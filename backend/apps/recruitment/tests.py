from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    RecruitmentStage,
    Candidate,
    JobOpening,
    Survey,
    SurveyQuestion,
    SurveyResponse,
    ensure_default_recruitment_stages,
)


class RecruitmentStageReorderTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_reorder_swaps_without_500(self):
        # Ensure defaults exist (created lazily by the endpoint).
        stages_response = self.client.get("/api/recruitment/stages/")
        self.assertEqual(stages_response.status_code, 200)
        stage_ids = [stage["id"] for stage in stages_response.data["data"]]
        self.assertGreaterEqual(len(stage_ids), 2)

        swapped_ids = [stage_ids[1], stage_ids[0], *stage_ids[2:]]
        reorder_response = self.client.patch(
            "/api/recruitment/stages/reorder/",
            {"stage_ids": swapped_ids},
            format="json",
        )
        self.assertEqual(reorder_response.status_code, 200)
        returned_ids = [stage["id"] for stage in reorder_response.data["data"]]
        self.assertEqual(returned_ids, swapped_ids)

        db_ids = list(RecruitmentStage.objects.order_by("sequence").values_list("id", flat=True))
        self.assertEqual(db_ids, swapped_ids)

        db_sequences = list(RecruitmentStage.objects.order_by("sequence").values_list("sequence", flat=True))
        self.assertEqual(db_sequences, list(range(1, len(swapped_ids) + 1)))

    def test_reorder_rejects_duplicates(self):
        stages_response = self.client.get("/api/recruitment/stages/")
        stage_ids = [stage["id"] for stage in stages_response.data["data"]]
        self.assertGreaterEqual(len(stage_ids), 2)

        payload = [stage_ids[0], stage_ids[0], *stage_ids[2:]]
        reorder_response = self.client.patch(
            "/api/recruitment/stages/reorder/",
            {"stage_ids": payload},
            format="json",
        )
        self.assertEqual(reorder_response.status_code, 400)


class RecruitmentPipelineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="pipeline_tester", password="password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        ensure_default_recruitment_stages()

        self.job = JobOpening.objects.create(
            title="Python Developer",
            department="IT",
            location="Remote",
            employment_type="FULL_TIME",
            experience_level="ENTRY",
            description="Test job",
            hiring_manager=self.user,
            created_by=self.user,
        )

        self.applied_stage = RecruitmentStage.objects.get(name="Applied")
        self.screening_stage = RecruitmentStage.objects.get(name="Screening")

        self.candidate = Candidate.objects.create(
            first_name="Rahul",
            last_name="Kumar",
            email="rahul.kumar@example.com",
            phone="1234567890",
            job_applied=self.job,
            stage=self.applied_stage,
            created_by=self.user,
        )

    def test_pipeline_groups_candidates_by_stage_name(self):
        response = self.client.get("/api/recruitment/pipeline/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Applied", response.data)

        applied_candidates = response.data["Applied"]
        self.assertTrue(any(item["id"] == self.candidate.id for item in applied_candidates))
        candidate_payload = next(item for item in applied_candidates if item["id"] == self.candidate.id)
        self.assertEqual(candidate_payload["job_title"], "Python Developer")

    def test_pipeline_stage_move_updates_candidate_stage(self):
        response = self.client.patch(
            f"/api/recruitment/candidates/{self.candidate.id}/stage/",
            {"stage_id": self.screening_stage.id},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.stage_id, self.screening_stage.id)


class RecruitmentSurveyAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="survey_tester", password="password")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_survey_and_add_question(self):
        create_response = self.client.post(
            "/api/recruitment/surveys/",
            {"title": "Candidate Experience Survey", "description": "Feedback on recruitment experience"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        survey_id = create_response.data["data"]["id"]
        self.assertTrue(Survey.objects.filter(id=survey_id).exists())

        question_response = self.client.post(
            f"/api/recruitment/surveys/{survey_id}/questions/",
            {"question_text": "How clear was the communication?", "question_type": "YES_NO"},
            format="json",
        )
        self.assertEqual(question_response.status_code, 201)
        self.assertEqual(SurveyQuestion.objects.filter(survey_id=survey_id).count(), 1)

    def test_submit_response_only_when_active(self):
        survey = Survey.objects.create(title="Technical Screen Feedback", status="CLOSED")
        question = SurveyQuestion.objects.create(
            survey=survey,
            question_text="Rate technical knowledge",
            question_type="RATING",
        )

        payload = {
            "answers": [{"question": question.id, "answer_text": "5"}],
        }

        closed_response = self.client.post(
            f"/api/recruitment/surveys/{survey.id}/responses/",
            payload,
            format="json",
        )
        self.assertEqual(closed_response.status_code, 400)
        self.assertIn("Survey is closed", closed_response.data.get("message", ""))

        survey.status = "ACTIVE"
        survey.save()

        success_response = self.client.post(
            f"/api/recruitment/surveys/{survey.id}/responses/",
            payload,
            format="json",
        )
        self.assertEqual(success_response.status_code, 201)
        self.assertEqual(SurveyResponse.objects.filter(survey=survey).count(), 1)
