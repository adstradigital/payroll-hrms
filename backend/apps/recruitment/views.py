from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Count, Max
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from datetime import datetime, time, timedelta

from .models import (
    JobOpening,
    Application,
    Candidate,
    Interview,
    InterviewFeedback,
    CandidateNote,
    RecruitmentStage,
    SkillCategory,
    Skill,
    RecruitmentJobSetting,
    InterviewTemplate,
    ensure_default_recruitment_stages,
    ensure_default_skill_categories,
    Survey,
    SurveyQuestion,
    SurveyResponse,
    RejectionReason,
)
from .utils.parser import parse_resume
import logging

logger = logging.getLogger(__name__)
from .serializers import (
    JobOpeningSerializer, JobOpeningListSerializer,
    CandidateSerializer, CandidateListSerializer, CandidateNoteSerializer,
    ApplicationSerializer, RecruitmentStageSerializer, SkillCategorySerializer, SkillSerializer,
    InterviewSerializer, InterviewListSerializer, InterviewFeedbackSerializer,
    SurveySerializer, SurveyQuestionSerializer, SurveyResponseSerializer, SurveyResponseCreateSerializer,
    DashboardStatsSerializer, PipelineStatusSerializer, ApplicationSourceSerializer, TodayInterviewSerializer,
    RecruitmentJobSettingSerializer,
    InterviewTemplateSerializer,
    RejectionReasonSerializer,
)


def get_default_recruitment_stage():
    ensure_default_recruitment_stages()
    first_stage = RecruitmentStage.objects.filter(sequence=1).first()
    if first_stage and first_stage.is_active:
        return first_stage

    stage = RecruitmentStage.objects.filter(is_active=True).order_by('sequence').first()
    if stage:
        return stage

    return first_stage or RecruitmentStage.objects.order_by('sequence').first()


def get_recruitment_stage_fallback(stage):
    previous_stage = RecruitmentStage.objects.filter(sequence__lt=stage.sequence).order_by('-sequence').first()
    if previous_stage:
        return previous_stage
    return RecruitmentStage.objects.exclude(pk=stage.pk).order_by('sequence').first()


def sync_candidate_status_from_stage(candidate, stage):
    if not stage:
        return candidate.status

    normalized_name = stage.name.strip().lower()
    stage_to_status = {
        'applied': 'NEW',
        'screening': 'SCREENING',
        'technical interview': 'INTERVIEW',
        'cultural fit round': 'INTERVIEW',
        'offer': 'OFFERED',
        'hired': 'HIRED',
        'rejected': 'REJECTED',
    }
    return stage_to_status.get(normalized_name, candidate.status or 'NEW')


def sync_candidate_skills_snapshot(candidate):
    skill_snapshot = [
        {
            'id': skill.id,
            'name': skill.name,
            'category': skill.category.name if skill.category else '',
        }
        for skill in candidate.candidate_skills.select_related('category').all()
    ]
    candidate.skills = skill_snapshot
    candidate.save(update_fields=['skills'])


def ensure_candidate_job_application(candidate, job_opening):
    if not job_opening:
        return None

    application, created = Application.objects.get_or_create(
        candidate=candidate,
        job_opening=job_opening,
        defaults={
            'current_stage': candidate.stage.name if candidate.stage else 'Applied',
        },
    )

    if created:
        job_opening.applications_count = Application.objects.filter(job_opening=job_opening).count()
        job_opening.save(update_fields=['applications_count'])

    return application


def sync_candidate_primary_application_stage(candidate):
    if not candidate.job_applied or not candidate.stage:
        return

    application = Application.objects.filter(
        candidate=candidate,
        job_opening=candidate.job_applied,
    ).first()

    if not application:
        return

    application.current_stage = candidate.stage.name
    normalized_stage = candidate.stage.name.strip().lower()
    if normalized_stage == 'rejected':
        application.status = 'REJECTED'
    elif normalized_stage == 'hired':
        application.status = 'HIRED'
    elif normalized_stage == 'withdrawn':
        application.status = 'WITHDRAWN'
    else:
        application.status = 'ACTIVE'
    application.save(update_fields=['current_stage', 'status', 'updated_at'])


def normalize_candidate_request_data(request):
    if not hasattr(request.data, 'getlist'):
        return request.data.copy()

    normalized_data = {}

    for key in request.data.keys():
        values = [value for value in request.data.getlist(key) if value not in (None, '')]
        if not values:
            continue

        if key == 'skill_ids':
            normalized_data[key] = values
        else:
            normalized_data[key] = values[-1]

    return normalized_data


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recruitment_job_posting_settings(request):
    """
    GET: Retrieve current recruitment job posting defaults (singleton).
    POST: Update or create settings (singleton).
    """
    try:
        settings_obj = RecruitmentJobSetting.get_solo()

        if request.method == 'GET':
            serializer = RecruitmentJobSettingSerializer(settings_obj)
            return Response({'success': True, 'data': serializer.data})

        serializer = RecruitmentJobSettingSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'success': True, 'message': 'Settings saved successfully', 'data': serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(
            {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {'success': False, 'message': 'An error occurred', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruitment_job_defaults(request):
    """
    Defaults for job creation screens.

    Reads RecruitmentJobSetting (singleton) and returns raw defaults so
    clients can prefill create-job forms.
    """
    try:
        settings_obj = RecruitmentJobSetting.get_solo()
        return Response(
            {
                'success': True,
                'data': {
                    'default_job_type': settings_obj.default_job_type,
                    'default_experience': settings_obj.default_experience,
                    'default_vacancies': settings_obj.default_vacancies,
                    'allow_remote': settings_obj.allow_remote,
                    'default_expiry_days': settings_obj.default_expiry_days,
                },
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {'success': False, 'message': 'An error occurred', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def interview_template_list_create(request):
    """
    Interview Templates

    GET: List templates (includes nested questions).
    POST: Create a template with questions.
    """
    try:
        if request.method == 'GET':
            queryset = InterviewTemplate.objects.prefetch_related('questions').order_by('-created_at')
            serializer = InterviewTemplateSerializer(queryset, many=True)
            return Response({'success': True, 'data': serializer.data})

        serializer = InterviewTemplateSerializer(data=request.data)
        if serializer.is_valid():
            template = serializer.save()
            response_serializer = InterviewTemplateSerializer(template)
            return Response(
                {'success': True, 'message': 'Interview template created successfully', 'data': response_serializer.data},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {'success': False, 'message': 'Failed to create interview template', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {'success': False, 'message': 'An error occurred', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def interview_template_detail(request, pk):
    """
    PUT: Update template (and optionally questions).
    DELETE: Delete template (cascades questions).
    """
    try:
        template = get_object_or_404(InterviewTemplate.objects.prefetch_related('questions'), pk=pk)

        if request.method == 'PUT':
            serializer = InterviewTemplateSerializer(template, data=request.data)
            if serializer.is_valid():
                template = serializer.save()
                return Response(
                    {'success': True, 'message': 'Interview template updated successfully', 'data': serializer.data},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {'success': False, 'message': 'Failed to update interview template', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template.delete()
        return Response({'success': True, 'message': 'Interview template deleted successfully'})

    except Exception as e:
        return Response(
            {'success': False, 'message': 'An error occurred', 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def survey_list_create(request):
    """
    GET: List all surveys with counts
    POST: Create a new survey
    """
    try:
        if request.method == 'GET':
            status_filter = request.query_params.get('status')
            search = request.query_params.get('search')

            queryset = Survey.objects.annotate(
                question_count=Count('questions', distinct=True),
                response_count=Count('responses', distinct=True),
            ).order_by('-created_at')

            if status_filter:
                queryset = queryset.filter(status=status_filter.upper())

            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search)
                )

            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated_queryset = paginator.paginate_queryset(queryset, request)

            serializer = SurveySerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SurveySerializer(data=request.data)
        if serializer.is_valid():
            survey = serializer.save()
            refreshed = Survey.objects.annotate(
                question_count=Count('questions', distinct=True),
                response_count=Count('responses', distinct=True),
            ).get(pk=survey.pk)
            data = SurveySerializer(refreshed).data
            return Response(
                {
                    'success': True,
                    'message': 'Survey created successfully',
                    'data': data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create survey',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def survey_detail(request, pk):
    """
    GET: Retrieve a survey
    PUT: Update a survey
    DELETE: Delete a survey
    """
    try:
        queryset = Survey.objects.annotate(
            question_count=Count('questions', distinct=True),
            response_count=Count('responses', distinct=True),
        )
        survey = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = SurveySerializer(survey)
            return Response({'success': True, 'data': serializer.data})

        elif request.method == 'PUT':
            serializer = SurveySerializer(survey, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                refreshed = queryset.get(pk=pk)
                return Response(
                    {
                        'success': True,
                        'message': 'Survey updated successfully',
                        'data': SurveySerializer(refreshed).data,
                    }
                )

            return Response(
                {
                    'success': False,
                    'message': 'Failed to update survey',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        survey.delete()
        return Response({'success': True, 'message': 'Survey deleted successfully'})

    except Survey.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Survey not found',
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rejection_reason_list_create(request):
    """
    GET: List all standardized rejection reasons.
    POST: Create a new rejection reason.
    """
    try:
        if request.method == 'GET':
            queryset = RejectionReason.objects.order_by('reason_text')
            serializer = RejectionReasonSerializer(queryset, many=True)
            return Response({'success': True, 'data': serializer.data})

        serializer = RejectionReasonSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Rejection reason created successfully',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create rejection reason',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def rejection_reason_detail(request, pk):
    """
    PUT: Update a rejection reason.
    DELETE: Delete a rejection reason.
    """
    try:
        reason = get_object_or_404(RejectionReason, pk=pk)

        if request.method == 'PUT':
            serializer = RejectionReasonSerializer(reason, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'success': True,
                        'message': 'Rejection reason updated successfully',
                        'data': serializer.data,
                    }
                )

            return Response(
                {
                    'success': False,
                    'message': 'Failed to update rejection reason',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason.delete()
        return Response({'success': True, 'message': 'Rejection reason deleted successfully'})
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def survey_questions(request, pk):
    """
    GET: List questions for a survey
    POST: Add a question to a survey
    """
    try:
        survey = get_object_or_404(Survey, pk=pk)

        if request.method == 'GET':
            questions = survey.questions.order_by('created_at')
            serializer = SurveyQuestionSerializer(questions, many=True)
            return Response({'success': True, 'data': serializer.data})

        payload = request.data.copy()
        payload['survey'] = survey.id
        serializer = SurveyQuestionSerializer(data=payload)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Question added successfully',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to add question',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Survey.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Survey not found',
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def survey_responses(request, pk):
    """
    GET: List responses for a survey
    POST: Submit a new response for a survey
    """
    try:
        survey = get_object_or_404(Survey, pk=pk)

        if request.method == 'POST':
            if survey.status != 'ACTIVE':
                return Response(
                    {
                        'success': False,
                        'message': 'Survey is closed and cannot accept responses.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = SurveyResponseCreateSerializer(data=request.data, context={'survey': survey})
            if serializer.is_valid():
                response_obj = serializer.save()
                response_data = SurveyResponseSerializer(response_obj).data
                return Response(
                    {
                        'success': True,
                        'message': 'Survey response submitted successfully',
                        'data': response_data,
                    },
                    status=status.HTTP_201_CREATED,
                )

            return Response(
                {
                    'success': False,
                    'message': 'Failed to submit response',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = SurveyResponse.objects.filter(survey=survey).select_related('candidate').prefetch_related(
            'answers__question'
        ).order_by('-submitted_at')

        paginator = PageNumberPagination()
        paginator.page_size = request.query_params.get('page_size', 10)
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        serializer = SurveyResponseSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)

    except Survey.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Survey not found',
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def skill_category_list_create(request):
    ensure_default_skill_categories()

    try:
        if request.method == 'GET':
            queryset = SkillCategory.objects.prefetch_related('skills').order_by('name')
            serializer = SkillCategorySerializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
            })

        serializer = SkillCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Skill category created successfully',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create skill category',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def skill_category_detail(request, pk):
    ensure_default_skill_categories()

    try:
        category = get_object_or_404(SkillCategory, pk=pk)
        category.delete()
        return Response({
            'success': True,
            'message': 'Skill category deleted successfully',
        })
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def skill_list_create(request):
    ensure_default_skill_categories()

    try:
        if request.method == 'GET':
            queryset = Skill.objects.select_related('category').order_by('category__name', 'name')
            serializer = SkillSerializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
            })

        serializer = SkillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Skill created successfully',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create skill',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def skill_detail(request, pk):
    ensure_default_skill_categories()

    try:
        skill = get_object_or_404(Skill, pk=pk)

        if request.method == 'PUT':
            serializer = SkillSerializer(skill, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Skill updated successfully',
                    'data': serializer.data,
                })

            return Response(
                {
                    'success': False,
                    'message': 'Failed to update skill',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        skill.delete()
        return Response({
            'success': True,
            'message': 'Skill deleted successfully',
        })
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recruitment_stage_list_create(request):
    ensure_default_recruitment_stages()

    try:
        if request.method == 'GET':
            serializer = RecruitmentStageSerializer(RecruitmentStage.objects.order_by('sequence'), many=True)
            return Response({
                'success': True,
                'data': serializer.data,
            })

        serializer = RecruitmentStageSerializer(data=request.data)
        if serializer.is_valid():
            requested_sequence = serializer.validated_data.get('sequence')
            total = RecruitmentStage.objects.count()
            desired = total + 1
            if requested_sequence is not None:
                try:
                    desired = int(requested_sequence)
                except (TypeError, ValueError):
                    desired = total + 1
                desired = max(1, min(desired, total + 1))

            with transaction.atomic():
                if desired <= total:
                    # Free up the desired slot without violating the unique constraint mid-way.
                    max_sequence = RecruitmentStage.objects.aggregate(max_seq=Max('sequence')).get('max_seq') or 0
                    temp_base = max_sequence + total + 10
                    bump = list(RecruitmentStage.objects.filter(sequence__gte=desired).order_by('-sequence'))
                    for stage in bump:
                        stage.sequence = temp_base + stage.sequence
                    if bump:
                        RecruitmentStage.objects.bulk_update(bump, ['sequence'])

                serializer.save(sequence=desired, is_system=False)

                for index, stage in enumerate(RecruitmentStage.objects.order_by('sequence', 'id'), start=1):
                    if stage.sequence != index:
                        stage.sequence = index
                        stage.save(update_fields=['sequence'])

            refreshed = RecruitmentStageSerializer(RecruitmentStage.objects.order_by('sequence'), many=True)
            return Response(
                {
                    'success': True,
                    'message': 'Recruitment stage created successfully',
                    'data': refreshed.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create recruitment stage',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def recruitment_stage_detail(request, pk):
    ensure_default_recruitment_stages()

    try:
        stage = get_object_or_404(RecruitmentStage, pk=pk)

        if request.method == 'PUT':
            serializer = RecruitmentStageSerializer(stage, data=request.data, partial=True)
            if serializer.is_valid():
                if stage.is_system:
                    # Allow only activation toggles for system stages.
                    serializer.save(
                        sequence=stage.sequence,
                        is_system=stage.is_system,
                        name=stage.name,
                    )
                else:
                    serializer.save(sequence=stage.sequence, is_system=stage.is_system)
                return Response({
                    'success': True,
                    'message': 'Recruitment stage updated successfully',
                    'data': serializer.data,
                })

            return Response(
                {
                    'success': False,
                    'message': 'Failed to update recruitment stage',
                    'errors': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if stage.is_system:
            return Response(
                {
                    'success': False,
                    'message': 'System stages cannot be deleted',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            fallback_stage = get_recruitment_stage_fallback(stage) or get_default_recruitment_stage()
            if fallback_stage and fallback_stage.pk != stage.pk:
                Candidate.objects.filter(stage=stage).update(stage=fallback_stage)

            stage.delete()

            for index, current_stage in enumerate(RecruitmentStage.objects.order_by('sequence', 'id'), start=1):
                if current_stage.sequence != index:
                    current_stage.sequence = index
                    current_stage.save(update_fields=['sequence'])

        serializer = RecruitmentStageSerializer(RecruitmentStage.objects.order_by('sequence'), many=True)
        return Response({
            'success': True,
            'message': 'Recruitment stage deleted successfully',
            'data': serializer.data,
        })
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def recruitment_stage_reorder(request):
    ensure_default_recruitment_stages()

    try:
        stage_ids = request.data.get('stage_ids') or request.data.get('ordered_ids')
        if not isinstance(stage_ids, list) or not stage_ids:
            return Response(
                {
                    'success': False,
                    'message': 'stage_ids must be a non-empty list',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            normalized_stage_ids = [int(stage_id) for stage_id in stage_ids]
        except (TypeError, ValueError):
            return Response(
                {
                    'success': False,
                    'message': 'stage_ids must contain integers',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(set(normalized_stage_ids)) != len(normalized_stage_ids):
            return Response(
                {
                    'success': False,
                    'message': 'stage_ids must not contain duplicates',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = RecruitmentStage.objects.filter(id__in=normalized_stage_ids)
        if queryset.count() != RecruitmentStage.objects.count():
            return Response(
                {
                    'success': False,
                    'message': 'All recruitment stages must be included in reorder payload',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # `RecruitmentStage.sequence` is unique, so naive per-row updates can violate
            # the constraint mid-way through a reorder (e.g. swapping 1 <-> 2).
            max_sequence = RecruitmentStage.objects.aggregate(max_seq=Max('sequence')).get('max_seq') or 0
            temp_base = max_sequence + len(normalized_stage_ids) + 10

            stage_map = {stage.id: stage for stage in queryset}
            temp_updates = []
            for index, stage_id in enumerate(normalized_stage_ids, start=1):
                stage = stage_map.get(stage_id)
                if not stage:
                    return Response(
                        {
                            'success': False,
                            'message': f'Invalid stage id: {stage_id}',
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                stage.sequence = temp_base + index
                temp_updates.append(stage)

            RecruitmentStage.objects.bulk_update(temp_updates, ['sequence'])

            final_updates = []
            for index, stage_id in enumerate(normalized_stage_ids, start=1):
                stage = stage_map[stage_id]
                stage.sequence = index
                final_updates.append(stage)

            RecruitmentStage.objects.bulk_update(final_updates, ['sequence'])

        serializer = RecruitmentStageSerializer(RecruitmentStage.objects.order_by('sequence'), many=True)
        return Response({
            'success': True,
            'message': 'Recruitment stages reordered successfully',
            'data': serializer.data,
        })
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def get_job_opening_queryset():
    return JobOpening.objects.select_related(
        'hiring_manager', 'created_by'
    ).prefetch_related('recruiters', 'required_skills')


# Job Opening Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def job_opening_list_create(request):
    """
    GET: List all job openings with filters
    POST: Create a new job opening
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            status_filter = request.query_params.get('status', None)
            department = request.query_params.get('department', None)
            priority = request.query_params.get('priority', None)
            search = request.query_params.get('search', None)
            is_remote = request.query_params.get('is_remote', None)
            
            # Start with all jobs
            queryset = get_job_opening_queryset()
            
            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if department:
                queryset = queryset.filter(department=department)
            
            if priority:
                queryset = queryset.filter(priority=priority)
            
            if is_remote:
                queryset = queryset.filter(is_remote=is_remote.lower() == 'true')
            
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) |
                    Q(description__icontains=search) |
                    Q(location__icontains=search)
                )
            
            # Pagination
            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = JobOpeningListSerializer(paginated_queryset, many=True)
            
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            # Create new job opening
            payload = request.data.copy()

            # Apply job posting defaults when the client omits values.
            try:
                defaults = RecruitmentJobSetting.get_solo()
            except Exception:
                defaults = None

            if defaults is not None:
                if not payload.get('employment_type'):
                    payload['employment_type'] = defaults.default_job_type

                if 'is_remote' not in payload:
                    payload['is_remote'] = defaults.allow_remote

                if not payload.get('openings') and not payload.get('vacancies'):
                    payload['openings'] = defaults.default_vacancies

                if not payload.get('application_deadline') and defaults.default_expiry_days:
                    payload['application_deadline'] = (timezone.now().date() + timedelta(days=defaults.default_expiry_days)).isoformat()

                if not payload.get('experience_required'):
                    experience_label_map = dict(RecruitmentJobSetting.EXPERIENCE_CHOICES)
                    payload['experience_required'] = experience_label_map.get(defaults.default_experience, '')

            serializer = JobOpeningSerializer(data=payload)
             
            if serializer.is_valid():
                serializer.save(created_by=request.user, status=payload.get('status', 'OPEN'))
                return Response(
                    {
                        'success': True,
                        'message': 'Job opening created successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to create job opening',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def job_opening_detail(request, pk):
    """
    GET: Retrieve a job opening
    PUT: Update a job opening
    DELETE: Delete a job opening
    """
    try:
        job = get_object_or_404(get_job_opening_queryset(), pk=pk)
        
        if request.method == 'GET':
            # Increment view count
            job.views_count += 1
            job.save(update_fields=['views_count'])
            
            serializer = JobOpeningSerializer(job)
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            # Update job opening
            serializer = JobOpeningSerializer(job, data=request.data, partial=True)
            
            if serializer.is_valid():
                # If status is being changed to Closed, set closed_date
                if request.data.get('status') == 'CLOSED' and job.status != 'CLOSED':
                    serializer.save(closed_date=timezone.now())
                else:
                    serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Job opening updated successfully',
                    'data': serializer.data
                })
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to update job opening',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        elif request.method == 'DELETE':
            with transaction.atomic():
                job.interviews.all().delete()
                job.applications.all().delete()
                job.recruiters.clear()
                job.required_skills.clear()
                job.delete()
            return Response({
                'success': True,
                'message': 'Job opening deleted successfully'
            })
    
    except JobOpening.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Job opening not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def job_opening_update_status(request, pk):
    try:
        job = get_object_or_404(JobOpening, pk=pk)
        new_status = str(request.data.get('status', '')).upper()

        if new_status not in {'OPEN', 'CLOSED'}:
            return Response(
                {
                    'success': False,
                    'message': 'Status must be OPEN or CLOSED',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        job.status = new_status
        if new_status == 'CLOSED':
            job.closed_date = timezone.now()
            job.save(update_fields=['status', 'closed_date'])
        else:
            job.closed_date = None
            job.save(update_fields=['status', 'closed_date'])

        serializer = JobOpeningSerializer(job)
        return Response({
            'success': True,
            'message': 'Job status updated successfully',
            'data': serializer.data,
        })
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_opening_stats(request):
    """
    Get job opening statistics
    """
    try:
        # Status statistics
        status_stats = JobOpening.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Department statistics
        department_stats = JobOpening.objects.filter(
            status__in=['OPEN', 'ON_HOLD']
        ).values('department').annotate(
            count=Count('id')
        ).order_by('department')
        
        # Priority statistics for open jobs
        priority_stats = JobOpening.objects.filter(
            status='OPEN'
        ).values('priority').annotate(
            count=Count('id')
        ).order_by('priority')
        
        # Total applications
        total_applications = Application.objects.count()
        
        # Recent jobs (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_jobs = JobOpening.objects.filter(
            posted_date__gte=thirty_days_ago
        ).count()
        
        return Response({
            'success': True,
            'data': {
                'by_status': list(status_stats),
                'by_department': list(department_stats),
                'by_priority': list(priority_stats),
                'total_applications': total_applications,
                'recent_jobs_30_days': recent_jobs
            }
        })
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred while fetching statistics',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def job_opening_duplicate(request, pk):
    """
    Duplicate a job opening
    """
    try:
        original_job = get_object_or_404(JobOpening, pk=pk)
        
        # Create a copy
        new_job = JobOpening.objects.get(pk=pk)
        new_job.pk = None  # This will create a new instance
        new_job.title = f"{original_job.title} (Copy)"
        new_job.status = 'DRAFT'
        new_job.posted_date = timezone.now()
        new_job.created_by = request.user
        new_job.applications_count = 0
        new_job.views_count = 0
        new_job.closed_date = None
        new_job.save()
        
        # Copy recruiters
        new_job.recruiters.set(original_job.recruiters.all())
        
        serializer = JobOpeningSerializer(new_job)
        return Response({
            'success': True,
            'message': 'Job opening duplicated successfully',
            'data': serializer.data
        })
    
    except JobOpening.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Job opening not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred while duplicating job opening',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_opening_applications(request, pk):
    """
    Get all applications for a specific job opening
    """
    try:
        job = get_object_or_404(JobOpening, pk=pk)
        applications = Application.objects.filter(job_opening=job).select_related(
            'candidate'
        ).order_by('-applied_date')
        
        # Pagination
        paginator = PageNumberPagination()
        paginated_applications = paginator.paginate_queryset(applications, request)
        
        serializer = ApplicationSerializer(paginated_applications, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    except JobOpening.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Job opening not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Candidate Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def candidate_list_create(request):
    """
    GET: List all candidates with filters
    POST: Create a new candidate
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            status_filter = request.query_params.get('status', None)
            source = request.query_params.get('source', None)
            job_id = request.query_params.get('job_id', None)
            search = request.query_params.get('search', None)
            skills = request.query_params.get('skills', None)
            min_exp = request.query_params.get('min_experience', None)
            max_exp = request.query_params.get('max_experience', None)
            is_starred = request.query_params.get('is_starred', None)
            
            # Start with all candidates
            queryset = Candidate.objects.select_related(
                'assigned_recruiter', 'referred_by', 'created_by', 'stage', 'job_applied'
            ).prefetch_related('applications', 'candidate_skills', 'candidate_skills__category')
            
            # Apply filters
            if status_filter:
                if str(status_filter).isdigit():
                    queryset = queryset.filter(stage_id=int(status_filter))
                else:
                    queryset = queryset.filter(Q(status=status_filter) | Q(stage__name__iexact=status_filter))
            
            if source:
                queryset = queryset.filter(source=source)
            
            if job_id:
                queryset = queryset.filter(Q(job_applied_id=job_id) | Q(applications__job_opening_id=job_id))
            
            if is_starred:
                queryset = queryset.filter(is_starred=is_starred.lower() == 'true')
            
            if search:
                queryset = queryset.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(current_job_title__icontains=search) |
                    Q(current_company__icontains=search)
                )
            
            if skills:
                skills_list = skills.split(',')
                queryset = queryset.filter(
                    Q(candidate_skills__name__in=[skill.strip() for skill in skills_list]) |
                    Q(skills__icontains=skills)
                ).distinct()
            
            if min_exp:
                queryset = queryset.filter(total_experience_years__gte=int(min_exp))
            
            if max_exp:
                queryset = queryset.filter(total_experience_years__lte=int(max_exp))
            
            # Pagination
            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = CandidateListSerializer(paginated_queryset, many=True, context={'request': request})
            
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            # Create new candidate
            serializer = CandidateSerializer(data=normalize_candidate_request_data(request))
            
            if serializer.is_valid():
                default_stage = get_default_recruitment_stage()
                candidate = serializer.save(
                    created_by=request.user,
                    stage=serializer.validated_data.get('stage') or default_stage,
                    applied_date=serializer.validated_data.get('applied_date') or timezone.now(),
                )
                candidate.status = sync_candidate_status_from_stage(candidate, candidate.stage)
                candidate.save(update_fields=['stage', 'status', 'applied_date'])
                sync_candidate_skills_snapshot(candidate)
                ensure_candidate_job_application(candidate, candidate.job_applied)
                sync_candidate_primary_application_stage(candidate)

                serializer = CandidateSerializer(candidate, context={'request': request})
                 
                return Response(
                    {
                        'success': True,
                        'message': 'Candidate created successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to create candidate',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def candidate_detail(request, pk):
    """
    GET: Retrieve a candidate
    PUT: Update a candidate
    DELETE: Delete a candidate
    """
    try:
        candidate = get_object_or_404(
            Candidate.objects.select_related(
                'assigned_recruiter', 'referred_by', 'created_by', 'stage', 'job_applied'
            ).prefetch_related('applications', 'candidate_skills', 'candidate_skills__category'),
            pk=pk,
        )
        
        if request.method == 'GET':
            serializer = CandidateSerializer(candidate, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            # Update candidate
            previous_job = candidate.job_applied
            serializer = CandidateSerializer(candidate, data=normalize_candidate_request_data(request), partial=True)
            
            if serializer.is_valid():
                candidate = serializer.save(last_activity_date=timezone.now())
                if candidate.stage is None:
                    candidate.stage = get_default_recruitment_stage()
                    candidate.save(update_fields=['stage'])
                candidate.status = sync_candidate_status_from_stage(candidate, candidate.stage)
                candidate.save(update_fields=['status', 'last_activity_date'])
                sync_candidate_skills_snapshot(candidate)
                ensure_candidate_job_application(candidate, candidate.job_applied)
                sync_candidate_primary_application_stage(candidate)
                for job_opening in {previous_job, candidate.job_applied}:
                    if job_opening:
                        job_opening.applications_count = Application.objects.filter(job_opening=job_opening).count()
                        job_opening.save(update_fields=['applications_count'])
                serializer = CandidateSerializer(candidate, context={'request': request})
                return Response({
                    'success': True,
                    'message': 'Candidate updated successfully',
                    'data': serializer.data
                })
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to update candidate',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        elif request.method == 'DELETE':
            linked_job_ids = list(candidate.applications.values_list('job_opening_id', flat=True).distinct())
            candidate.delete()
            if linked_job_ids:
                for job_opening in JobOpening.objects.filter(id__in=linked_job_ids):
                    job_opening.applications_count = Application.objects.filter(job_opening=job_opening).count()
                    job_opening.save(update_fields=['applications_count'])
            return Response({
                'success': True,
                'message': 'Candidate deleted successfully'
            })
    
    except Candidate.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Candidate not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def candidate_add_note(request, pk):
    """
    Add a note to a candidate
    """
    try:
        candidate = get_object_or_404(Candidate, pk=pk)
        
        serializer = CandidateNoteSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                candidate=candidate,
                added_by=request.user
            )
            
            # Update candidate's last activity date
            candidate.last_activity_date = timezone.now()
            candidate.save(update_fields=['last_activity_date'])
            
            return Response({
                'success': True,
                'message': 'Note added successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            {
                'success': False,
                'message': 'Failed to add note',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Candidate.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Candidate not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def candidate_update_status(request, pk):
    """
    Update candidate status
    """
    try:
        ensure_default_recruitment_stages()
        candidate = get_object_or_404(Candidate, pk=pk)

        stage_id = request.data.get('stage_id')
        new_status = request.data.get('status')
        if not stage_id and not new_status:
            return Response(
                {
                    'success': False,
                    'message': 'Stage is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if stage_id:
            target_stage = get_object_or_404(RecruitmentStage, pk=stage_id)
        else:
            target_stage = RecruitmentStage.objects.filter(name__iexact=str(new_status).replace('_', ' ')).first()
            if not target_stage and str(new_status).isdigit():
                target_stage = RecruitmentStage.objects.filter(pk=int(new_status)).first()

        if target_stage:
            candidate.stage = target_stage
            candidate.status = sync_candidate_status_from_stage(candidate, target_stage)
        else:
            candidate.status = new_status

        candidate.last_activity_date = timezone.now()
        update_fields = ['status', 'last_activity_date']
        if target_stage:
            update_fields.append('stage')
        candidate.save(update_fields=update_fields)
        sync_candidate_primary_application_stage(candidate)
        
        serializer = CandidateSerializer(candidate, context={'request': request})
        return Response({
            'success': True,
            'message': 'Candidate stage updated successfully',
            'data': serializer.data
        })
    
    except Candidate.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Candidate not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def candidate_toggle_star(request, pk):
    """
    Toggle candidate starred status
    """
    try:
        candidate = get_object_or_404(Candidate, pk=pk)
        
        candidate.is_starred = not candidate.is_starred
        candidate.save(update_fields=['is_starred'])
        
        return Response({
            'success': True,
            'message': f"Candidate {'starred' if candidate.is_starred else 'unstarred'} successfully",
            'data': {'is_starred': candidate.is_starred}
        })
    
    except Candidate.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Candidate not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def candidate_stats(request):
    """
    Get candidate statistics
    """
    try:
        # Status statistics
        status_stats = Candidate.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Source statistics
        source_stats = Candidate.objects.values('source').annotate(
            count=Count('id')
        ).order_by('source')
        
        # Total candidates
        total_candidates = Candidate.objects.count()
        
        # New candidates this month
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = Candidate.objects.filter(
            created_at__gte=current_month_start
        ).count()
        
        # Hired count
        hired_count = Candidate.objects.filter(status='HIRED').count()
        
        # Rejected count
        rejected_count = Candidate.objects.filter(status='REJECTED').count()
        
        # Conversion rate
        conversion_rate = 0
        if total_candidates > 0:
            conversion_rate = round((hired_count / total_candidates) * 100, 2)
        
        return Response({
            'success': True,
            'data': {
                'total': total_candidates,
                'new_this_month': new_this_month,
                'hired': hired_count,
                'rejected': rejected_count,
                'by_status': list(status_stats),
                'by_source': list(source_stats),
                'conversion_rate': conversion_rate
            }
        })
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred while fetching statistics',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def candidate_bulk_update(request):
    """
    Bulk update candidates
    """
    try:
        candidate_ids = request.data.get('candidate_ids', [])
        updates = request.data.get('updates', {})
        
        if not candidate_ids:
            return Response(
                {
                    'success': False,
                    'message': 'No candidate IDs provided'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update candidates
        updated_count = Candidate.objects.filter(
            id__in=candidate_ids
        ).update(**updates, last_activity_date=timezone.now())
        
        return Response({
            'success': True,
            'message': f'{updated_count} candidates updated successfully',
            'count': updated_count
        })
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred during bulk update',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def candidate_apply_to_job(request, pk):
    """
    Apply candidate to a job opening
    """
    try:
        candidate = get_object_or_404(Candidate, pk=pk)
        job_opening_id = request.data.get('job_opening_id')
        
        if not job_opening_id:
            return Response(
                {
                    'success': False,
                    'message': 'Job opening ID is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job_opening = get_object_or_404(JobOpening, pk=job_opening_id)
        
        # Check if application already exists
        if Application.objects.filter(candidate=candidate, job_opening=job_opening).exists():
            return Response(
                {
                    'success': False,
                    'message': 'Candidate has already applied to this job'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create application
        application = Application.objects.create(
            candidate=candidate,
            job_opening=job_opening
        )
        candidate.job_applied = job_opening
        if not candidate.applied_date:
            candidate.applied_date = timezone.now()
        candidate.last_activity_date = timezone.now()
        candidate.save(update_fields=['job_applied', 'applied_date', 'last_activity_date'])
        
        # Update job applications count
        job_opening.applications_count += 1
        job_opening.save(update_fields=['applications_count'])
        
        serializer = ApplicationSerializer(application)
        return Response({
            'success': True,
            'message': 'Application created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    except Candidate.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Candidate not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except JobOpening.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Job opening not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Top-level recruitment stats for the main dashboard."""
    payload = {
        'total_candidates': Candidate.objects.count(),
        'active_jobs': JobOpening.objects.filter(status='OPEN').count(),
        'hired': Application.objects.filter(status__iexact='HIRED').count(),
        'rejected': Application.objects.filter(status__iexact='REJECTED').count(),
    }
    serializer = DashboardStatsSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.validated_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pipeline_status(request):
    """Counts of candidates in key pipeline stages."""
    payload = {
        'screening': Candidate.objects.filter(status='SCREENING').count(),
        'interview': Candidate.objects.filter(status='INTERVIEW').count(),
        'offer': Candidate.objects.filter(status='OFFERED').count(),
        'hired': Candidate.objects.filter(status='HIRED').count(),
    }
    serializer = PipelineStatusSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.validated_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_sources(request):
    """Candidate source distribution used in dashboard chart."""
    payload = {
        'linkedin': Candidate.objects.filter(source='LINKEDIN').count(),
        'website': Candidate.objects.filter(source__in=['CAREER_PAGE', 'DIRECT_APPLICATION']).count(),
        'referral': Candidate.objects.filter(source='REFERRAL').count(),
        'job_portal': Candidate.objects.filter(source='JOB_PORTAL').count(),
    }
    serializer = ApplicationSourceSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.validated_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_interviews(request):
    """List of today's interviews."""
    today = timezone.localdate()
    start = timezone.make_aware(datetime.combine(today, time.min))
    end = timezone.make_aware(datetime.combine(today, time.max))

    interviews = (
        Interview.objects.select_related('candidate', 'job_opening')
        .filter(scheduled_date__gte=start, scheduled_date__lte=end)
        .exclude(status='CANCELLED')
        .order_by('scheduled_date')
    )

    serializer = TodayInterviewSerializer(interviews, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recruitment_pipeline(request):
    """
    Recruitment Pipeline (Kanban)

    Returns candidates grouped by stage name.

    Example:
      {
        "Applied": [{ "id": 1, "name": "Rahul Kumar", "job": "Python Developer" }],
        "Screening": []
      }
    """
    try:
        ensure_default_recruitment_stages()

        stages = list(RecruitmentStage.objects.order_by('sequence'))
        pipeline = {stage.name: [] for stage in stages}

        search = (request.query_params.get('search') or '').strip()

        queryset = Candidate.objects.select_related('job_applied', 'stage').filter(job_applied__isnull=False)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(job_applied__title__icontains=search)
            )

        default_stage = stages[0] if stages else None

        def experience_display(candidate):
            if candidate.experience:
                return candidate.experience

            parts = []
            if candidate.total_experience_years:
                year_label = 'year' if candidate.total_experience_years == 1 else 'years'
                parts.append(f"{candidate.total_experience_years} {year_label}")
            if candidate.total_experience_months:
                month_label = 'month' if candidate.total_experience_months == 1 else 'months'
                parts.append(f"{candidate.total_experience_months} {month_label}")
            return ' '.join(parts)

        for candidate in queryset:
            stage = candidate.stage or default_stage
            if not stage:
                continue

            job_title = candidate.job_applied.title if candidate.job_applied else ''
            pipeline.setdefault(stage.name, []).append(
                {
                    'id': candidate.id,
                    'name': candidate.full_name,
                    'full_name': candidate.full_name,
                    'email': candidate.email,
                    'job': job_title,
                    'job_title': job_title,
                    'job_id': candidate.job_applied_id,
                    'experience': candidate.experience or '',
                    'experience_display': experience_display(candidate),
                    'created_at': candidate.created_at,
                    'stage_id': stage.id,
                    'stage_name': stage.name,
                }
            )

        return Response(pipeline)

    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Interview & Application Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def interview_list_create(request):
    """
    GET: List all interviews with filters
    POST: Create/Schedule a new interview
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            status_filter = request.query_params.get('status', None)
            candidate_id = request.query_params.get('candidate_id', None)
            job_id = request.query_params.get('job_id', None)
            interviewer_id = request.query_params.get('interviewer_id', None)
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)
            interview_type = request.query_params.get('type', None)
            
            # Start with all interviews
            queryset = Interview.objects.select_related(
                'candidate', 'job_opening', 'application', 'created_by'
            ).prefetch_related('interviewers')
            
            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if candidate_id:
                queryset = queryset.filter(candidate_id=candidate_id)
            
            if job_id:
                queryset = queryset.filter(job_opening_id=job_id)
            
            if interviewer_id:
                queryset = queryset.filter(interviewers__id=interviewer_id)
            
            if interview_type:
                queryset = queryset.filter(interview_type=interview_type)
            
            if start_date:
                queryset = queryset.filter(scheduled_date__gte=start_date)
            
            if end_date:
                queryset = queryset.filter(scheduled_date__lte=end_date)
            
            # Pagination
            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = InterviewListSerializer(paginated_queryset, many=True)
            
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            # Schedule new interview
            serializer = InterviewSerializer(data=request.data)
            
            if serializer.is_valid():
                # Validate that scheduled date is in the future
                scheduled_date = serializer.validated_data.get('scheduled_date')
                if scheduled_date and scheduled_date < timezone.now():
                    return Response(
                        {
                            'success': False,
                            'message': 'Interview cannot be scheduled in the past'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                interview = serializer.save(created_by=request.user)
                
                # TODO: Send email notifications to interviewers and candidate
                
                return Response(
                    {
                        'success': True,
                        'message': 'Interview scheduled successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to schedule interview',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def interview_detail(request, pk):
    """
    GET: Retrieve an interview
    PUT: Update an interview
    DELETE: Delete an interview
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        
        if request.method == 'GET':
            serializer = InterviewSerializer(interview)
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            # Update interview
            serializer = InterviewSerializer(interview, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Interview updated successfully',
                    'data': serializer.data
                })
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to update interview',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        elif request.method == 'DELETE':
            interview.delete()
            return Response({
                'success': True,
                'message': 'Interview deleted successfully'
            })
    
    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def interview_update_status(request, pk):
    """
    Update interview status (PATCH)
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {
                    'success': False,
                    'message': 'Status is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InterviewSerializer(interview, data={'status': new_status}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Interview status updated successfully',
                'data': serializer.data
            })

        return Response(
            {
                'success': False,
                'message': 'Failed to update interview status',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def interview_update_result(request, pk):
    """
    Update interview result (PATCH)
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        new_result = request.data.get('result')

        if not new_result:
            return Response(
                {
                    'success': False,
                    'message': 'Result is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payload = {
            'result': new_result,
        }
        if 'feedback' in request.data:
            payload['feedback'] = request.data.get('feedback')

        if interview.status == 'SCHEDULED' and str(new_result).strip().lower() in ('passed', 'failed'):
            payload['status'] = 'COMPLETED'

        serializer = InterviewSerializer(interview, data=payload, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Interview result updated successfully',
                'data': serializer.data
            })

        return Response(
            {
                'success': False,
                'message': 'Failed to update interview result',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_cancel(request, pk):
    """
    Cancel an interview
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        
        reason = request.data.get('reason', '')
        
        interview.status = 'CANCELLED'
        interview.cancellation_reason = reason
        interview.cancelled_by = request.user
        interview.cancelled_at = timezone.now()
        interview.save()
        
        # TODO: Send cancellation notifications
        
        serializer = InterviewSerializer(interview)
        return Response({
            'success': True,
            'message': 'Interview cancelled successfully',
            'data': serializer.data
        })
    
    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_reschedule(request, pk):
    """
    Reschedule an interview
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        
        new_date = request.data.get('new_date')
        reason = request.data.get('reason', '')
        
        if not new_date:
            return Response(
                {
                    'success': False,
                    'message': 'New date is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse and validate new date
        try:
            new_datetime = timezone.datetime.fromisoformat(new_date.replace('Z', '+00:00'))
            if timezone.is_naive(new_datetime):
                new_datetime = timezone.make_aware(new_datetime)
        except (ValueError, AttributeError):
            return Response(
                {
                    'success': False,
                    'message': 'Invalid date format'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_datetime < timezone.now():
            return Response(
                {
                    'success': False,
                    'message': 'Cannot reschedule to a past date'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update interview
        interview.previous_date = interview.scheduled_date
        interview.scheduled_date = new_datetime
        interview.status = 'RESCHEDULED'
        interview.rescheduled_by = request.user
        interview.reschedule_reason = reason
        interview.reminder_sent = False
        
        if 'location' in request.data:
            interview.location = request.data['location']
        if 'meeting_link' in request.data:
            interview.meeting_link = request.data['meeting_link']
        
        interview.save()
        
        # TODO: Send rescheduling notifications
        
        serializer = InterviewSerializer(interview)
        return Response({
            'success': True,
            'message': 'Interview rescheduled successfully',
            'data': serializer.data
        })
    
    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_submit_feedback(request, pk):
    """
    Submit interview feedback
    """
    try:
        interview = get_object_or_404(Interview, pk=pk)
        
        # Check if user is an interviewer
        if not interview.interviewers.filter(id=request.user.id).exists():
            return Response(
                {
                    'success': False,
                    'message': 'You are not assigned as an interviewer for this interview'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create feedback
        feedback, created = InterviewFeedback.objects.get_or_create(
            interview=interview,
            interviewer=request.user,
            defaults={'role': request.data.get('role', '')}
        )
        
        # Update feedback
        feedback.overall_rating = request.data.get('overall_rating')
        feedback.technical_skills = request.data.get('technical_skills')
        feedback.communication = request.data.get('communication')
        feedback.problem_solving = request.data.get('problem_solving')
        feedback.culture_fit = request.data.get('culture_fit')
        feedback.comments = request.data.get('comments', '')
        feedback.recommendation = request.data.get('recommendation', '')
        feedback.submitted_at = timezone.now()
        feedback.save()
        
        # Check if all interviewers have submitted feedback
        total_interviewers = interview.interviewers.count()
        submitted_feedbacks = InterviewFeedback.objects.filter(
            interview=interview,
            submitted_at__isnull=False
        ).count()
        
        if submitted_feedbacks == total_interviewers and interview.status == 'SCHEDULED':
            interview.status = 'COMPLETED'
            interview.save()
        
        serializer = InterviewFeedbackSerializer(feedback)
        return Response({
            'success': True,
            'message': 'Feedback submitted successfully',
            'data': serializer.data
        })
    
    except Interview.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Interview not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_upcoming(request):
    """
    Get upcoming interviews
    """
    try:
        # Get interviews scheduled in next 30 days
        now = timezone.now()
        thirty_days_later = now + timedelta(days=30)
        
        interviews = Interview.objects.filter(
            scheduled_date__gte=now,
            scheduled_date__lte=thirty_days_later,
            status='SCHEDULED'
        ).select_related(
            'candidate', 'job_opening'
        ).order_by('scheduled_date')
        
        serializer = InterviewListSerializer(interviews, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
            'error': str(e)
        },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Standard CRUD viewset for applications
    """
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Application.objects.select_related('candidate', 'job_opening', 'stage').order_by('-applied_date')

    def perform_create(self, serializer):
        application = serializer.save()
        if application.candidate:
            application.candidate.last_activity_date = timezone.now()
            application.candidate.save(update_fields=['last_activity_date'])


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def application_list_create(request):
    """
    GET: List applications
    POST: Create a new application
    """
    try:
        if request.method == 'GET':
            queryset = Application.objects.select_related(
                'candidate', 'job_opening', 'stage'
            ).order_by('-applied_date')

            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated = paginator.paginate_queryset(queryset, request)
            serializer = ApplicationSerializer(paginated, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ApplicationSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save()
            if application.candidate:
                application.candidate.last_activity_date = timezone.now()
                application.candidate.save(update_fields=['last_activity_date'])
            return Response(
                {
                    'success': True,
                    'message': 'Application created successfully',
                    'data': serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Failed to create application',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def application_detail(request, pk):
    """
    GET: Retrieve an application
    PUT: Update an application
    DELETE: Delete an application
    """
    try:
        application = get_object_or_404(Application, pk=pk)
        
        if request.method == 'GET':
            serializer = ApplicationSerializer(application)
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            serializer = ApplicationSerializer(application, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                
                # Update candidate's last activity
                application.candidate.last_activity_date = timezone.now()
                application.candidate.save(update_fields=['last_activity_date'])
                
                return Response({
                    'success': True,
                    'message': 'Application updated successfully',
                    'data': serializer.data
                })
            
            return Response(
                {
                    'success': False,
                    'message': 'Failed to update application',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        elif request.method == 'DELETE':
            application.delete()
            return Response({
                'success': True,
                'message': 'Application deleted successfully'
            })

    except Application.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Application not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def application_update_stage(request, pk):
    """
    Update application stage
    """
    try:
        ensure_default_recruitment_stages()
        application = get_object_or_404(Application, pk=pk)
        
        stage_id = request.data.get('stage_id')
        new_stage = request.data.get('stage')
        if not new_stage:
            if stage_id:
                stage = get_object_or_404(RecruitmentStage, pk=stage_id)
                new_stage = stage.name
            else:
                return Response(
                    {
                        'success': False,
                        'message': 'Stage is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        application.current_stage = new_stage
        normalized_stage = str(new_stage).strip().lower()
        
        # Update status based on stage
        if normalized_stage == 'rejected':
            application.status = 'REJECTED'
            application.rejection_reason = request.data.get('rejection_reason', '')
        elif normalized_stage == 'withdrawn':
            application.status = 'WITHDRAWN'
        elif normalized_stage == 'offer':
            application.status = 'ACTIVE'
            application.offer_salary = request.data.get('offer_salary')
            application.offer_joining_date = request.data.get('offer_joining_date')
            application.offer_acceptance_status = 'PENDING'
        
        application.save()
        
        # Update candidate's last activity
        application.candidate.last_activity_date = timezone.now()
        application.candidate.save(update_fields=['last_activity_date'])
        
        serializer = ApplicationSerializer(application)
        return Response({
            'success': True,
            'message': 'Application stage updated successfully',
            'data': serializer.data
        })
    
    except Application.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'Application not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': 'An error occurred',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def resume_bulk_upload(request):
    """
    Bulk upload resumes, parse them, and create candidate profiles.
    """
    files = request.FILES.getlist('files')
    job_id = request.data.get('job_id')
    
    if not files:
        return Response({'success': False, 'message': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
        
    job_opening = None
    if job_id:
        job_opening = get_object_or_404(JobOpening, pk=job_id)
        
    results = []
    created_count = 0
    
    # Get default stage for new candidates
    default_stage = get_default_recruitment_stage()
    
    for file in files:
        try:
            # Parse the resume
            parsed_data = parse_resume(file)
            
            if not parsed_data:
                results.append({'file': file.name, 'success': False, 'message': 'Failed to parse resume'})
                continue
                
            # Create candidate
            full_name = parsed_data['name'] or "Unknown Candidate"
            name_parts = full_name.split()
            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "."
            
            # Skills - convert comma separated string to list for JSONField
            skills_list = [s.strip() for s in parsed_data['skills'].split(',') if s.strip()]
            
            candidate = Candidate.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=parsed_data['email'] or f"unknown_{timezone.now().timestamp()}@example.com",
                phone=parsed_data['phone'],
                skills=skills_list,
                resume=file,
                stage=default_stage,
                job_applied=job_opening,
                source='OTHER',
                status='NEW'
            )
            
            # If job provided, create application
            if job_opening:
                ensure_candidate_job_application(candidate, job_opening)
                
            results.append({
                'file': file.name, 
                'success': True, 
                'candidate_id': str(candidate.id),
                'name': parsed_data['name'],
                'email': parsed_data['email']
            })
            created_count += 1
            
        except Exception as e:
            logger.error(f"Error processing bulk upload file {file.name}: {str(e)}")
            results.append({'file': file.name, 'success': False, 'message': str(e)})
            
    return Response({
        'success': True,
        'message': f'Successfully processed {created_count} resumes',
        'results': results,
        'created_count': created_count
    }, status=status.HTTP_201_CREATED)
