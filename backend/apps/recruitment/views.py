from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import timedelta

from .models import JobOpening, Application, Candidate, Interview, InterviewFeedback, CandidateNote
from .serializers import (
    JobOpeningSerializer, JobOpeningListSerializer,
    CandidateSerializer, CandidateListSerializer, CandidateNoteSerializer,
    ApplicationSerializer,
    InterviewSerializer, InterviewListSerializer, InterviewFeedbackSerializer
)


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
            queryset = JobOpening.objects.select_related(
                'hiring_manager', 'created_by'
            ).prefetch_related('recruiters')
            
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
            serializer = JobOpeningSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
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
        job = get_object_or_404(JobOpening, pk=pk)
        
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
            # Check if there are applications
            if Application.objects.filter(job_opening=job).exists():
                return Response(
                    {
                        'success': False,
                        'message': 'Cannot delete job opening with existing applications. Please close it instead.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
@parser_classes([MultiPartParser, FormParser])
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
                'assigned_recruiter', 'referred_by', 'created_by'
            ).prefetch_related('applications')
            
            # Apply filters
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if source:
                queryset = queryset.filter(source=source)
            
            if job_id:
                queryset = queryset.filter(applications__job_opening_id=job_id)
            
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
                # Search in JSON field
                skills_list = skills.split(',')
                for skill in skills_list:
                    queryset = queryset.filter(skills__contains=[{'name': skill.strip()}])
            
            if min_exp:
                queryset = queryset.filter(total_experience_years__gte=int(min_exp))
            
            if max_exp:
                queryset = queryset.filter(total_experience_years__lte=int(max_exp))
            
            # Pagination
            paginator = PageNumberPagination()
            paginator.page_size = request.query_params.get('page_size', 10)
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = CandidateListSerializer(paginated_queryset, many=True)
            
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            # Create new candidate
            serializer = CandidateSerializer(data=request.data)
            
            if serializer.is_valid():
                candidate = serializer.save(created_by=request.user)
                
                # If job_opening_id is provided, create an application
                job_opening_id = request.data.get('job_opening_id')
                if job_opening_id:
                    try:
                        job_opening = JobOpening.objects.get(id=job_opening_id)
                        Application.objects.create(
                            candidate=candidate,
                            job_opening=job_opening
                        )
                        # Update job applications count
                        job_opening.applications_count += 1
                        job_opening.save(update_fields=['applications_count'])
                    except JobOpening.DoesNotExist:
                        pass
                
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
def candidate_detail(request, pk):
    """
    GET: Retrieve a candidate
    PUT: Update a candidate
    DELETE: Delete a candidate
    """
    try:
        candidate = get_object_or_404(Candidate, pk=pk)
        
        if request.method == 'GET':
            serializer = CandidateSerializer(candidate)
            return Response({
                'success': True,
                'data': serializer.data
            })
        
        elif request.method == 'PUT':
            # Update candidate
            serializer = CandidateSerializer(candidate, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save(last_activity_date=timezone.now())
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
            candidate.delete()
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


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def candidate_update_status(request, pk):
    """
    Update candidate status
    """
    try:
        candidate = get_object_or_404(Candidate, pk=pk)
        
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {
                    'success': False,
                    'message': 'Status is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        candidate.status = new_status
        candidate.last_activity_date = timezone.now()
        candidate.save(update_fields=['status', 'last_activity_date'])
        
        serializer = CandidateSerializer(candidate)
        return Response({
            'success': True,
            'message': 'Candidate status updated successfully',
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
        
        # Update job applications count
        job_opening.applications_count += 1
        job_opening.save(update_fields=['applications_count'])
        
        # Update candidate's last activity
        candidate.last_activity_date = timezone.now()
        candidate.save(update_fields=['last_activity_date'])
        
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
                if serializer.validated_data['scheduled_date'] < timezone.now():
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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def application_detail(request, pk):
    """
    GET: Retrieve an application
    PUT: Update an application
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
        application = get_object_or_404(Application, pk=pk)
        
        new_stage = request.data.get('stage')
        if not new_stage:
            return Response(
                {
                    'success': False,
                    'message': 'Stage is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.current_stage = new_stage
        
        # Update status based on stage
        if new_stage == 'REJECTED':
            application.status = 'REJECTED'
            application.rejection_reason = request.data.get('rejection_reason', '')
        elif new_stage == 'WITHDRAWN':
            application.status = 'WITHDRAWN'
        elif new_stage == 'OFFER':
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
