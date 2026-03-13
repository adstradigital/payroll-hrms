from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.models import User
from .models import (
    JobOpening, Candidate, Application, RecruitmentStage, SkillCategory, Skill,
    Interview, InterviewFeedback, CandidateNote,
    Survey, SurveyQuestion, SurveyResponse, SurveyAnswer,
    RecruitmentJobSetting,
    InterviewTemplate, InterviewQuestion,
)


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RecruitmentStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentStage
        fields = ['id', 'name', 'sequence', 'is_system', 'is_active', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {
            'sequence': {'required': False, 'validators': []},
            'is_system': {'required': False},
            'is_active': {'required': False},
        }

    def validate_name(self, value):
        queryset = RecruitmentStage.objects.exclude(pk=getattr(self.instance, 'pk', None))
        if queryset.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError("A recruitment stage with this name already exists")
        return value.strip()


class SkillCategorySerializer(serializers.ModelSerializer):
    skills_count = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description', 'created_at', 'skills_count']
        read_only_fields = ['created_at', 'skills_count']

    def validate_name(self, value):
        queryset = SkillCategory.objects.exclude(pk=getattr(self.instance, 'pk', None))
        if queryset.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError("A skill category with this name already exists")
        return value.strip()

    def get_skills_count(self, obj):
        return obj.skills.count()


class SkillSerializer(serializers.ModelSerializer):
    category_details = SkillCategorySerializer(source='category', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_details', 'description', 'status', 'created_at']
        read_only_fields = ['created_at']

    def validate_name(self, value):
        return value.strip()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        name = attrs.get('name', getattr(self.instance, 'name', '')).strip()
        category = attrs.get('category', getattr(self.instance, 'category', None))

        if category and Skill.objects.exclude(pk=getattr(self.instance, 'pk', None)).filter(
            category=category,
            name__iexact=name,
        ).exists():
            raise serializers.ValidationError({'name': 'This skill already exists in the selected category'})

        attrs['name'] = name
        return attrs


class JobOpeningSerializer(serializers.ModelSerializer):
    """Job Opening Serializer"""
    hiring_manager_details = UserSerializer(source='hiring_manager', read_only=True)
    recruiters_details = UserSerializer(source='recruiters', many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    required_skills_details = SkillSerializer(source='required_skills', many=True, read_only=True)
    vacancies = serializers.IntegerField(source='openings', required=False)
    
    class Meta:
        model = JobOpening
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'applications_count', 'views_count']
    
    def validate(self, data):
        """Validate job opening payload"""
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError("Minimum salary cannot be greater than maximum salary")

        openings = data.get('openings')
        if openings is not None and openings <= 0:
            raise serializers.ValidationError({'vacancies': 'Vacancies must be greater than 0'})

        required_skills = data.get('required_skills')
        if self.instance is None and not required_skills:
            raise serializers.ValidationError({'required_skills': 'At least one skill must be selected'})
        if self.instance is not None and required_skills is not None and len(required_skills) == 0:
            raise serializers.ValidationError({'required_skills': 'At least one skill must be selected'})

        status_value = data.get('status')
        if status_value:
            normalized_status = str(status_value).upper()
            if normalized_status in {'OPEN', 'CLOSED'}:
                data['status'] = normalized_status
        return data


class RecruitmentJobSettingSerializer(serializers.ModelSerializer):
    candidate_sources = serializers.ListField(
        child=serializers.ChoiceField(choices=RecruitmentJobSetting.CANDIDATE_SOURCE_CHOICES),
        required=False,
    )

    class Meta:
        model = RecruitmentJobSetting
        fields = [
            'default_job_type',
            'default_experience',
            'allow_remote',
            'default_expiry_days',
            'default_vacancies',
            'auto_close_job',
            'allow_multiple_locations',
            'candidate_sources',
            'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate_candidate_sources(self, value):
        # Normalize and de-duplicate while preserving order.
        if value is None:
            return []
        cleaned = []
        seen = set()
        for item in value:
            if item in seen:
                continue
            cleaned.append(item)
            seen.add(item)
        return cleaned


class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ['id', 'question_text', 'question_type', 'order']
        read_only_fields = ['id']

    def validate_question_text(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Question text is required.')
        return value

    def validate_question_type(self, value):
        normalized = str(value).upper()
        valid = {choice[0] for choice in InterviewQuestion.QUESTION_TYPE_CHOICES}
        if normalized not in valid:
            raise serializers.ValidationError('Invalid question type.')
        return normalized


class InterviewTemplateSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True)
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewTemplate
        fields = ['id', 'name', 'description', 'created_at', 'questions_count', 'questions']
        read_only_fields = ['id', 'created_at', 'questions_count']

    def get_questions_count(self, obj):
        try:
            return obj.questions.count()
        except Exception:
            return 0

    def validate_name(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Template name is required.')
        return value

    def validate_questions(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError('At least one question is required.')
        return value

    def _normalize_questions_payload(self, questions_payload):
        normalized = []
        for index, item in enumerate(questions_payload, start=1):
            if not isinstance(item, dict):
                continue
            text = (item.get('question_text') or '').strip()
            qtype = str(item.get('question_type') or 'TEXT').upper()
            order = item.get('order')
            try:
                order = int(order) if order is not None else index
            except (TypeError, ValueError):
                order = index
            normalized.append(
                {
                    'question_text': text,
                    'question_type': qtype,
                    'order': order,
                }
            )
        return normalized

    def _replace_questions(self, template, questions_payload):
        normalized = self._normalize_questions_payload(questions_payload)

        valid_types = {choice[0] for choice in InterviewQuestion.QUESTION_TYPE_CHOICES}
        cleaned = []
        seen_orders = set()
        for index, item in enumerate(sorted(normalized, key=lambda q: q.get('order') or index), start=1):
            text = (item.get('question_text') or '').strip()
            if not text:
                raise serializers.ValidationError({'questions': f'Question {index} text is required.'})
            qtype = str(item.get('question_type') or 'TEXT').upper()
            if qtype not in valid_types:
                raise serializers.ValidationError({'questions': f'Question {index} has invalid type.'})

            order = item.get('order') or index
            try:
                order = int(order)
            except (TypeError, ValueError):
                order = index
            if order <= 0:
                order = index
            if order in seen_orders:
                # Ensure unique order per template by falling back to sequential order.
                order = index
            seen_orders.add(order)

            cleaned.append(InterviewQuestion(template=template, question_text=text, question_type=qtype, order=order))

        with transaction.atomic():
            template.questions.all().delete()
            InterviewQuestion.objects.bulk_create(cleaned)

    def create(self, validated_data):
        questions = validated_data.pop('questions', [])
        with transaction.atomic():
            template = InterviewTemplate.objects.create(**validated_data)
            self._replace_questions(template, questions)
        return template

    def update(self, instance, validated_data):
        questions = validated_data.pop('questions', None)

        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)

        with transaction.atomic():
            instance.save(update_fields=['name', 'description'])
            if questions is not None:
                self._replace_questions(instance, questions)

        return instance

class JobOpeningListSerializer(serializers.ModelSerializer):
    """Simplified Job Opening Serializer for list view"""
    hiring_manager_name = serializers.SerializerMethodField()
    required_skills_details = SkillSerializer(source='required_skills', many=True, read_only=True)
    vacancies = serializers.IntegerField(source='openings', read_only=True)
    
    class Meta:
        model = JobOpening
        fields = [
            'id', 'title', 'department', 'location', 'employment_type',
            'experience_level', 'experience_required', 'status', 'priority', 'openings', 'vacancies',
            'required_skills_details',
            'applications_count', 'posted_date', 'hiring_manager_name',
            'is_remote', 'salary_min', 'salary_max', 'salary_currency'
        ]
    
    def get_hiring_manager_name(self, obj):
        return obj.hiring_manager.get_full_name() if obj.hiring_manager else None


class CandidateNoteSerializer(serializers.ModelSerializer):
    """Candidate Note Serializer"""
    added_by_details = UserSerializer(source='added_by', read_only=True)
    
    class Meta:
        model = CandidateNote
        fields = '__all__'
        read_only_fields = ['added_by', 'created_at', 'updated_at']


class ApplicationSerializer(serializers.ModelSerializer):
    """Application Serializer"""
    job_opening_details = JobOpeningListSerializer(source='job_opening', read_only=True)
    candidate_details = serializers.SerializerMethodField()
    stage_details = RecruitmentStageSerializer(source='stage', read_only=True)
    job = serializers.PrimaryKeyRelatedField(source='job_opening', queryset=JobOpening.objects.all(), write_only=True, required=False)
    candidate_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    stage_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id',
            'candidate',
            'candidate_details',
            'candidate_name',
            'job_opening',
            'job_opening_details',
            'job_title',
            'job',
            'stage',
            'stage_details',
            'stage_name',
            'current_stage',
            'status',
            'source',
            'applied_date',
            'notes',
            'rating',
            'rejection_reason',
            'offer_salary',
            'offer_joining_date',
            'offer_acceptance_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_candidate_name(self, obj):
        return obj.candidate.full_name if obj.candidate else None

    def get_job_title(self, obj):
        return obj.job_opening.title if obj.job_opening else None

    def get_stage_name(self, obj):
        if obj.stage:
            return obj.stage.name
        return obj.current_stage

    def get_candidate_details(self, obj):
        from .serializers import CandidateListSerializer  # local import to avoid circular reference
        if obj.candidate:
            return CandidateListSerializer(obj.candidate).data
        return None


class CandidateSerializer(serializers.ModelSerializer):
    """Candidate Serializer"""
    applications_details = ApplicationSerializer(source='applications', many=True, read_only=True)
    notes_details = CandidateNoteSerializer(source='note_entries', many=True, read_only=True)
    assigned_recruiter_details = UserSerializer(source='assigned_recruiter', read_only=True)
    referred_by_details = UserSerializer(source='referred_by', read_only=True)
    full_name = serializers.ReadOnlyField()
    stage_details = RecruitmentStageSerializer(source='stage', read_only=True)
    stage_name = serializers.SerializerMethodField()
    current_stage = serializers.PrimaryKeyRelatedField(source='stage', queryset=RecruitmentStage.objects.all(), required=False, allow_null=True)
    current_stage_details = RecruitmentStageSerializer(source='stage', read_only=True)
    skills_details = SkillSerializer(source='candidate_skills', many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        source='candidate_skills',
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    job_applied_details = JobOpeningListSerializer(source='job_applied', read_only=True)
    resume_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'last_activity_date']
    
    def validate_email(self, value):
        """Validate unique email"""
        if self.instance:
            # Update case
            if Candidate.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("Candidate with this email already exists")
        else:
            # Create case
            if Candidate.objects.filter(email=value).exists():
                raise serializers.ValidationError("Candidate with this email already exists")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        job_applied = attrs.get('job_applied', getattr(self.instance, 'job_applied', None))
        skill_records = attrs.get('candidate_skills')

        if self.instance is None and not job_applied:
            raise serializers.ValidationError({'job_applied': 'Job applied is required'})

        if self.instance is None and not skill_records:
            raise serializers.ValidationError({'skill_ids': 'At least one skill must be selected'})

        if self.instance is not None and skill_records is not None and len(skill_records) == 0:
            raise serializers.ValidationError({'skill_ids': 'At least one skill must be selected'})

        return attrs

    def get_stage_name(self, obj):
        return obj.stage.name if obj.stage else None

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None


class CandidateListSerializer(serializers.ModelSerializer):
    """Simplified Candidate Serializer for list view"""
    full_name = serializers.ReadOnlyField()
    assigned_recruiter_name = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()
    stage_details = RecruitmentStageSerializer(source='stage', read_only=True)
    stage_name = serializers.SerializerMethodField()
    current_stage_details = RecruitmentStageSerializer(source='stage', read_only=True)
    skills_details = SkillSerializer(source='candidate_skills', many=True, read_only=True)
    job_applied_details = JobOpeningListSerializer(source='job_applied', read_only=True)
    experience_display = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'full_name', 'email', 'phone', 'job_applied', 'job_applied_details',
            'current_job_title', 'current_company', 'total_experience_years', 'experience', 'experience_display',
            'status', 'stage', 'stage_name', 'stage_details', 'current_stage_details',
            'skills_details', 'source', 'overall_rating', 'assigned_recruiter_name',
            'applications_count', 'is_starred', 'applied_date', 'created_at', 'resume_url'
        ]
    
    def get_assigned_recruiter_name(self, obj):
        return obj.assigned_recruiter.get_full_name() if obj.assigned_recruiter else None
    
    def get_applications_count(self, obj):
        return obj.applications.count()

    def get_stage_name(self, obj):
        return obj.stage.name if obj.stage else None

    def get_experience_display(self, obj):
        if obj.experience:
            return obj.experience

        if obj.total_experience_years or obj.total_experience_months:
            parts = []
            if obj.total_experience_years:
                year_label = 'year' if obj.total_experience_years == 1 else 'years'
                parts.append(f"{obj.total_experience_years} {year_label}")
            if obj.total_experience_months:
                month_label = 'month' if obj.total_experience_months == 1 else 'months'
                parts.append(f"{obj.total_experience_months} {month_label}")
            return ' '.join(parts)

        return ''

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    """Interview Feedback Serializer"""
    interviewer_details = UserSerializer(source='interviewer', read_only=True)
    
    class Meta:
        model = InterviewFeedback
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InterviewSerializer(serializers.ModelSerializer):
    """Interview Serializer"""
    title = serializers.CharField(required=False, allow_blank=True)
    application = serializers.PrimaryKeyRelatedField(
        queryset=Application.objects.all(),
        required=False,
        allow_null=True,
    )
    job_opening = serializers.PrimaryKeyRelatedField(
        queryset=JobOpening.objects.all(),
        required=False,
        allow_null=True,
    )
    scheduled_date = serializers.DateTimeField(required=False)
    interviewers = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False,
    )
    job = serializers.PrimaryKeyRelatedField(
        source='job_opening',
        queryset=JobOpening.objects.all(),
        required=False,
        allow_null=True,
    )
    interview_date = serializers.DateTimeField(source='scheduled_date', required=False)
    candidate_details = CandidateListSerializer(source='candidate', read_only=True)
    job_opening_details = JobOpeningListSerializer(source='job_opening', read_only=True)
    feedbacks = InterviewFeedbackSerializer(source='interviewfeedback_set', many=True, read_only=True)
    interviewer_details = UserSerializer(source='interviewers', many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    result_label = serializers.CharField(source='get_result_display', read_only=True)
    
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate and normalize interview payloads (supports simplified keys)."""
        from django.utils import timezone

        normalized_status = {
            'scheduled': 'SCHEDULED',
            'completed': 'COMPLETED',
            'cancelled': 'CANCELLED',
            'canceled': 'CANCELLED',
            'rescheduled': 'RESCHEDULED',
            'no_show': 'NO_SHOW',
            'no-show': 'NO_SHOW',
            'noshow': 'NO_SHOW',
        }
        normalized_result = {
            'pending': 'PENDING',
            'passed': 'PASSED',
            'failed': 'FAILED',
        }
        normalized_mode = {
            'online': 'ONLINE',
            'in-person': 'IN_PERSON',
            'in person': 'IN_PERSON',
            'in_person': 'IN_PERSON',
            'inperson': 'IN_PERSON',
        }

        def normalize(value, mapping):
            if value is None:
                return None
            if isinstance(value, str):
                cleaned = value.strip()
                if cleaned in mapping.values():
                    return cleaned
                lowered = cleaned.lower()
                if lowered in mapping:
                    return mapping[lowered]
            return value

        if 'status' in data:
            data['status'] = normalize(data.get('status'), normalized_status)
        if 'result' in data:
            data['result'] = normalize(data.get('result'), normalized_result)
        if 'interview_mode' in data:
            data['interview_mode'] = normalize(data.get('interview_mode'), normalized_mode)

        is_create = self.instance is None
        scheduled_date = data.get('scheduled_date')
        if is_create and not scheduled_date:
            raise serializers.ValidationError({'interview_date': 'Interview date is required'})
        if scheduled_date and scheduled_date < timezone.now():
            raise serializers.ValidationError("Interview cannot be scheduled in the past")

        if is_create:
            candidate = data.get('candidate')
            if not candidate:
                raise serializers.ValidationError({'candidate': 'Candidate is required'})

            if not data.get('job_opening') and getattr(candidate, 'job_applied', None):
                data['job_opening'] = candidate.job_applied

            if not data.get('job_opening'):
                raise serializers.ValidationError({'job': 'Job is required (or set a job on the candidate)'})

            has_interviewer = bool((data.get('interviewer_name') or '').strip()) or bool(data.get('interviewers'))
            if not has_interviewer:
                raise serializers.ValidationError({'interviewer_name': 'Interviewer name is required'})

        return data

    def _sync_location_fields(self, instance_or_data):
        payload = instance_or_data if isinstance(instance_or_data, dict) else None
        if payload is None:
            return

        mode = payload.get('interview_mode')
        location_or_link = payload.get('location_or_link')
        if location_or_link in (None, ''):
            return

        if mode == 'ONLINE':
            payload['meeting_link'] = location_or_link
            payload.setdefault('location', '')
        elif mode == 'IN_PERSON':
            payload['location'] = location_or_link
            payload.setdefault('meeting_link', '')

    def create(self, validated_data):
        from django.utils import timezone

        self._sync_location_fields(validated_data)

        candidate = validated_data['candidate']
        job_opening = validated_data.get('job_opening') or getattr(candidate, 'job_applied', None)
        if not job_opening:
            raise serializers.ValidationError({'job': 'Job is required'})

        validated_data['job_opening'] = job_opening

        application = validated_data.get('application')
        if not application:
            application, _ = Application.objects.get_or_create(candidate=candidate, job_opening=job_opening)
            validated_data['application'] = application

        if not validated_data.get('title'):
            interview_type = validated_data.get('interview_type') or 'Interview'
            type_label = dict(Interview.TYPE_CHOICES).get(interview_type, interview_type)
            validated_data['title'] = f"{type_label} Interview"

        if not validated_data.get('round_number'):
            validated_data['round_number'] = Interview.objects.filter(application=application).count() + 1

        interview = super().create(validated_data)

        stage_map = {
            'TECHNICAL': 'TECHNICAL_INTERVIEW',
            'HR': 'HR_INTERVIEW',
            'MANAGERIAL': 'MANAGER_INTERVIEW',
            'FINAL': 'FINAL_ROUND',
        }
        target_stage = stage_map.get(interview.interview_type)
        if target_stage and application.current_stage != target_stage:
            application.current_stage = target_stage
            application.save(update_fields=['current_stage', 'updated_at'])

        candidate.last_activity_date = timezone.now()
        candidate.save(update_fields=['last_activity_date'])

        return interview

    def update(self, instance, validated_data):
        self._sync_location_fields(validated_data)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation.get('location_or_link'):
            representation['location_or_link'] = (
                representation.get('meeting_link')
                or representation.get('location')
                or ''
            )
        return representation


class InterviewListSerializer(serializers.ModelSerializer):
    """Simplified Interview Serializer for list view"""
    candidate_id = serializers.IntegerField(read_only=True)
    job_id = serializers.IntegerField(read_only=True)
    candidate_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    interviewer = serializers.SerializerMethodField()
    interview_date = serializers.DateTimeField(source='scheduled_date', read_only=True)
    location_or_link = serializers.SerializerMethodField()
    
    class Meta:
        model = Interview
        fields = [
            'id',
            'candidate_id',
            'job_id',
            'candidate_name',
            'job_title',
            'interview_type',
            'interviewer',
            'interview_date',
            'interview_mode',
            'status',
            'result',
            'location_or_link',
            'round_number',
        ]
    
    def get_candidate_name(self, obj):
        return obj.candidate.full_name
    
    def get_job_title(self, obj):
        return obj.job_opening.title
    
    def get_interviewers_names(self, obj):
        return [interviewer.get_full_name() for interviewer in obj.interviewers.all()]

    def get_interviewer(self, obj):
        if (obj.interviewer_name or '').strip():
            return obj.interviewer_name.strip()
        names = self.get_interviewers_names(obj)
        return ', '.join([name for name in names if name]) or '-'

    def get_location_or_link(self, obj):
        if (obj.location_or_link or '').strip():
            return obj.location_or_link.strip()
        if (obj.meeting_link or '').strip():
            return obj.meeting_link.strip()
        if (obj.location or '').strip():
            return obj.location.strip()
        return ''


class RecruitmentDashboardStatsSerializer(serializers.Serializer):
    """Legacy recruitment dashboard statistics serializer (kept for compatibility)."""
    total_jobs = serializers.IntegerField()
    open_jobs = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    new_candidates_this_month = serializers.IntegerField()
    interviews_scheduled = serializers.IntegerField()
    offers_pending = serializers.IntegerField()
    hired_count = serializers.IntegerField()
    
    # Status breakdown
    candidates_by_status = serializers.DictField()
    jobs_by_department = serializers.DictField()
    applications_by_stage = serializers.DictField()
    
    # Metrics
    average_time_to_hire = serializers.FloatField()
    offer_acceptance_rate = serializers.FloatField()


class DashboardStatsSerializer(serializers.Serializer):
    """Recruitment dashboard stats for main dashboard page."""
    total_candidates = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    hired = serializers.IntegerField()
    rejected = serializers.IntegerField()


class PipelineStatusSerializer(serializers.Serializer):
    screening = serializers.IntegerField()
    interview = serializers.IntegerField()
    offer = serializers.IntegerField()
    hired = serializers.IntegerField()


class ApplicationSourceSerializer(serializers.Serializer):
    linkedin = serializers.IntegerField()
    website = serializers.IntegerField()
    referral = serializers.IntegerField()
    job_portal = serializers.IntegerField()


class TodayInterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    job_role = serializers.CharField(source='job_opening.title', read_only=True)
    scheduled_date = serializers.DateTimeField(read_only=True)
    interview_type_label = serializers.CharField(source='get_interview_type_display', read_only=True)

    class Meta:
        model = Interview
        fields = ['id', 'scheduled_date', 'candidate_name', 'job_role', 'interview_type', 'interview_type_label']


class SurveySerializer(serializers.ModelSerializer):
    """Survey serializer with aggregate counts"""
    question_count = serializers.IntegerField(read_only=True)
    response_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Survey
        fields = [
            'id',
            'title',
            'description',
            'status',
            'created_at',
            'updated_at',
            'question_count',
            'response_count',
        ]
        read_only_fields = ['created_at', 'updated_at', 'question_count', 'response_count']

    def validate_title(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Survey title is required.")
        return value

    def validate_status(self, value):
        if not value:
            return 'ACTIVE'
        normalized = str(value).upper()
        if normalized not in dict(Survey.STATUS_CHOICES):
            raise serializers.ValidationError("Status must be ACTIVE or CLOSED.")
        return normalized


class SurveyQuestionSerializer(serializers.ModelSerializer):
    """Serializer for survey questions"""

    class Meta:
        model = SurveyQuestion
        fields = ['id', 'survey', 'question_text', 'question_type', 'options', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_question_text(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError("Question text is required.")
        return value

    def validate_question_type(self, value):
        normalized = str(value).upper()
        if normalized not in dict(SurveyQuestion.QUESTION_TYPE_CHOICES):
            raise serializers.ValidationError("Invalid question type.")
        return normalized

    def validate(self, attrs):
        attrs = super().validate(attrs)
        question_type = attrs.get('question_type') or getattr(self.instance, 'question_type', 'TEXT')
        options = attrs.get('options', [])

        if question_type == 'MULTIPLE_CHOICE':
            cleaned_options = [str(option).strip() for option in options if str(option).strip()]
            if not cleaned_options:
                raise serializers.ValidationError({'options': 'At least one option is required for multiple choice questions.'})
            attrs['options'] = cleaned_options
        else:
            attrs['options'] = []
        return attrs


class SurveyAnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers within a survey response"""
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)

    class Meta:
        model = SurveyAnswer
        fields = ['id', 'question', 'question_text', 'question_type', 'answer_text']
        read_only_fields = ['id', 'question_text', 'question_type']


class SurveyCandidateSerializer(serializers.ModelSerializer):
    """Lightweight candidate serializer for survey responses"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = ['id', 'full_name', 'email']

    def get_full_name(self, obj):
        return obj.full_name


class SurveyResponseSerializer(serializers.ModelSerializer):
    """Serializer for viewing survey responses"""
    answers = SurveyAnswerSerializer(many=True, read_only=True)
    candidate_details = SurveyCandidateSerializer(source='candidate', read_only=True)

    class Meta:
        model = SurveyResponse
        fields = ['id', 'candidate', 'candidate_details', 'interviewer_name', 'submitted_at', 'answers']
        read_only_fields = ['id', 'submitted_at', 'answers', 'candidate_details']


class SurveyAnswerCreateSerializer(serializers.Serializer):
    """Input serializer for answers"""
    question = serializers.PrimaryKeyRelatedField(queryset=SurveyQuestion.objects.all())
    answer_text = serializers.CharField(allow_blank=True, required=False, trim_whitespace=False)


class SurveyResponseCreateSerializer(serializers.Serializer):
    """Serializer to create a survey response with nested answers"""
    candidate = serializers.PrimaryKeyRelatedField(queryset=Candidate.objects.all(), required=False, allow_null=True)
    interviewer_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    answers = SurveyAnswerCreateSerializer(many=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        answers = attrs.get('answers') or []
        if not answers:
            raise serializers.ValidationError({'answers': 'At least one answer is required.'})
        return attrs

    def create(self, validated_data):
        survey = self.context['survey']
        answers_data = validated_data.pop('answers')
        interviewer_name = (validated_data.get('interviewer_name') or '').strip()

        question_ids = [answer['question'].id for answer in answers_data]
        valid_ids = set(SurveyQuestion.objects.filter(survey=survey, id__in=question_ids).values_list('id', flat=True))
        if len(valid_ids) != len(question_ids):
            raise serializers.ValidationError({'answers': 'One or more questions do not belong to this survey.'})

        with transaction.atomic():
            response = SurveyResponse.objects.create(
                survey=survey,
                candidate=validated_data.get('candidate'),
                interviewer_name=interviewer_name,
            )

            SurveyAnswer.objects.bulk_create([
                SurveyAnswer(
                    response=response,
                    question=answer['question'],
                    answer_text=str(answer.get('answer_text', '')).strip(),
                )
                for answer in answers_data
            ])

        return response
