from rest_framework import viewsets, status, views
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

from .models import (
    ReviewPeriod, PerformanceReview, RatingScale, RatingCategory,
    PerformanceCriteria, CriteriaRating, BonusMapping, Goal
)
from .serializers import (
    ReviewPeriodSerializer, PerformanceReviewSerializer,
    PerformanceReviewCreateSerializer, PerformanceReviewSelfAssessmentSerializer,
    PerformanceReviewManagerSerializer, RatingScaleSerializer, RatingCategorySerializer,
    PerformanceCriteriaSerializer, CriteriaRatingSerializer, BonusMappingSerializer,
    GoalSerializer, GoalCreateSerializer, DashboardStatsSerializer
)
from .permissions import (
    IsAdminOrHR, IsManagerOrAbove, CanManageReviewPeriod,
    CanViewPerformanceReview, CanEditPerformanceReview,
    CanSubmitSelfAssessment, CanSubmitManagerReview,
    CanManageRatings, CanManageBonusMapping, CanManageGoals
)
from .services import (
    RatingCalculatorService, ReviewWorkflowService,
    AnalyticsService, NotificationService
)


def safe_api(fn):
    try:
        return fn()
    except Exception as e:
        logger.exception(e)
        if hasattr(e, 'detail'):
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_dashboard(request):
    """
    Dashboard API endpoint - returns different data based on user role
    GET /api/performance/dashboard/
    """
    def logic():
        review_period_id = request.query_params.get('review_period_id')
        review_period = None
        
        if review_period_id:
            try:
                review_period = ReviewPeriod.objects.get(id=review_period_id)
            except ReviewPeriod.DoesNotExist:
                return Response(
                    {'error': 'Review period not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        stats = AnalyticsService.get_dashboard_stats(request.user, review_period)
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return safe_api(logic)


# ================== REVIEW PERIOD ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageReviewPeriod])
def review_period_list(request):
    def logic():
        if request.method == 'GET':
            queryset = ReviewPeriod.objects.all()
            # Manual filtering if needed (though none was in list() before)
            serializer = ReviewPeriodSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            serializer = ReviewPeriodSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageReviewPeriod])
def review_period_detail(request, pk):
    def logic():
        instance = get_object_or_404(ReviewPeriod, pk=pk)
        
        if request.method == 'GET':
            serializer = ReviewPeriodSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ReviewPeriodSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Review period deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def review_period_activate(request, pk):
    """Activate a review period and optionally auto-create reviews"""
    def logic():
        from .services.automation_service import AutomationService
        
        review_period = get_object_or_404(ReviewPeriod, pk=pk)
        review_period.status = 'active'
        review_period.save()
        
        # Auto-create reviews if requested
        auto_create = request.data.get('auto_create_reviews', False)
        auto_result = None
        
        if auto_create:
            auto_result = AutomationService.auto_create_reviews_for_period(
                pk, 
                created_by=request.user
            )
        
        serializer = ReviewPeriodSerializer(review_period)
        response_data = serializer.data
        
        if auto_result:
            response_data['automation'] = auto_result
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def review_period_close(request, pk):
    """Close a review period"""
    def logic():
        # verify existence
        get_object_or_404(ReviewPeriod, pk=pk)
        result = ReviewWorkflowService.close_review_period(pk, request.user)
        
        return Response({
            'message': 'Review period closed successfully',
            'incomplete_reviews': result['incomplete_count']
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def review_period_reopen(request, pk):
    """Reopen a closed review period"""
    def logic():
        review_period = get_object_or_404(ReviewPeriod, pk=pk)
        
        if review_period.status != 'completed':
            return Response({
                'error': 'Only completed review periods can be reopened'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        review_period.status = 'active'
        review_period.save()
        
        serializer = ReviewPeriodSerializer(review_period)
        return Response({
            'message': 'Review period reopened successfully',
            'review_period': serializer.data
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_period_progress(request, pk):
    """Get progress statistics for a review period"""
    def logic():
        review_period = get_object_or_404(ReviewPeriod, pk=pk)
        progress = ReviewWorkflowService.get_review_progress(review_period)
        return Response(progress, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def review_period_reminders(request, pk):
    """Send reminder notifications for pending reviews"""
    def logic():
        review_period = get_object_or_404(ReviewPeriod, pk=pk)
        count = ReviewWorkflowService.send_reminder_notifications(review_period)
        return Response({
            'message': f'Reminders sent to {count} employees'
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def review_period_run_automations(request, pk):
    """Run all automations for a review period (reminders, bonus calc, auto-close)"""
    def logic():
        from .services.automation_service import AutomationService
        
        review_period = get_object_or_404(ReviewPeriod, pk=pk)
        results = AutomationService.run_all_automations(pk, user=request.user)
        
        return Response({
            'message': 'Automations executed successfully',
            'period_id': str(pk),
            'period_name': review_period.name,
            'results': results
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


# ================== PERFORMANCE REVIEW ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanViewPerformanceReview])
def performance_review_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = PerformanceReview.objects.all()
            role = getattr(user, 'role', None)
            
            if role in ['admin', 'hr']:
                pass
            elif role == 'manager':
                queryset = queryset.filter(employee__manager=user)
            else:
                queryset = queryset.filter(employee=user)
            
            review_period_id = request.query_params.get('review_period')
            if review_period_id:
                queryset = queryset.filter(review_period_id=review_period_id)
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            queryset = queryset.select_related('employee', 'reviewer', 'review_period')
            serializer = PerformanceReviewSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            # Use Create serializer for POST
            serializer = PerformanceReviewCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanViewPerformanceReview])
def performance_review_detail(request, pk):
    def logic():
        user = request.user
        # queryset filtering for retrieval safety
        queryset = PerformanceReview.objects.all()
        role = getattr(user, 'role', None)
        if role not in ['admin', 'hr']:
            if role == 'manager':
                queryset = queryset.filter(employee__manager=user)
            else:
                queryset = queryset.filter(employee=user)
        
        instance = get_object_or_404(queryset, pk=pk)
        
        if request.method == 'GET':
            serializer = PerformanceReviewSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PerformanceReviewSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            # Check permission specifically for delete if it was restricted in ViewSet (ViewSet only mentioned Admin/HR in docstring, but permission_classes was CanViewPerformanceReview)
            # Re-enforcing documentation: delete should be Admin/HR only
            if role not in ['admin', 'hr']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
                
            instance.delete()
            return Response(
                {'message': 'Performance review deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_goals(request, pk):
    """Get employee's goals for a specific review - used by managers during review"""
    def logic():
        review = get_object_or_404(PerformanceReview, pk=pk)
        
        # Get goals for this employee in this review period
        goals = Goal.objects.filter(
            employee=review.employee,
            review_period=review.review_period
        ).select_related('claimed_by')
        
        serializer = GoalSerializer(goals, many=True)
        
        # Calculate summary stats
        total_goals = goals.count()
        completed_goals = goals.filter(status='completed').count()
        avg_progress = 0
        
        if total_goals > 0:
            from django.db.models import Avg
            avg_result = goals.aggregate(avg=Avg('progress_percentage'))
            avg_progress = round(avg_result['avg'] or 0, 2)
        
        return Response({
            'goals': serializer.data,
            'summary': {
                'total_goals': total_goals,
                'completed_goals': completed_goals,
                'avg_progress': avg_progress
            }
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, CanSubmitSelfAssessment])
def submit_self_assessment(request, pk):
    """Employee submits self-assessment"""
    def logic():
        # verify existence
        get_object_or_404(PerformanceReview, pk=pk)
        updated_review = ReviewWorkflowService.submit_self_assessment(
            pk, 
            request.user, 
            request.data
        )
        serializer = PerformanceReviewSerializer(updated_review)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, CanSubmitManagerReview])
def submit_manager_review(request, pk):
    """Manager submits review"""
    def logic():
        # verify existence
        get_object_or_404(PerformanceReview, pk=pk)
        updated_review = ReviewWorkflowService.submit_manager_review(
            pk, 
            request.user, 
            request.data
        )
        serializer = PerformanceReviewSerializer(updated_review)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def approve_review(request, pk):
    """HR/Admin approves review"""
    def logic():
        # verify existence
        get_object_or_404(PerformanceReview, pk=pk)
        review = ReviewWorkflowService.approve_review(pk, request.user)
        serializer = PerformanceReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsManagerOrAbove])
def reject_review(request, pk):
    """Reject review for revision"""
    def logic():
        # verify existence
        get_object_or_404(PerformanceReview, pk=pk)
        rejection_reason = request.data.get('rejection_reason', '')
        
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        review = ReviewWorkflowService.reject_review(pk, request.user, rejection_reason)
        serializer = PerformanceReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def bulk_create_reviews(request):
    """Create reviews for multiple employees"""
    def logic():
        review_period_id = request.data.get('review_period_id')
        employee_ids = request.data.get('employee_ids', [])
        
        if not review_period_id or not employee_ids:
            return Response(
                {'error': 'review_period_id and employee_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_reviews = ReviewWorkflowService.bulk_create_reviews(
            review_period_id, 
            employee_ids, 
            request.user
        )
        
        serializer = PerformanceReviewSerializer(created_reviews, many=True)
        return Response({
            'message': f'{len(created_reviews)} reviews created successfully',
            'reviews': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    return safe_api(logic)


# ================== RATING SCALE ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageRatings])
def rating_scale_list(request):
    def logic():
        if request.method == 'GET':
            queryset = RatingScale.objects.all()
            serializer = RatingScaleSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            serializer = RatingScaleSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageRatings])
def rating_scale_detail(request, pk):
    def logic():
        instance = get_object_or_404(RatingScale, pk=pk)
        
        if request.method == 'GET':
            serializer = RatingScaleSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = RatingScaleSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Rating scale deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


# ================== RATING CATEGORY ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageRatings])
def rating_category_list(request):
    def logic():
        if request.method == 'GET':
            queryset = RatingCategory.objects.all()
            serializer = RatingCategorySerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            serializer = RatingCategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageRatings])
def rating_category_detail(request, pk):
    def logic():
        instance = get_object_or_404(RatingCategory, pk=pk)
        
        if request.method == 'GET':
            serializer = RatingCategorySerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = RatingCategorySerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Rating category deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


# ================== PERFORMANCE CRITERIA ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageRatings])
def performance_criteria_list(request):
    def logic():
        if request.method == 'GET':
            queryset = PerformanceCriteria.objects.all()
            serializer = PerformanceCriteriaSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            serializer = PerformanceCriteriaSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageRatings])
def performance_criteria_detail(request, pk):
    def logic():
        instance = get_object_or_404(PerformanceCriteria, pk=pk)
        
        if request.method == 'GET':
            serializer = PerformanceCriteriaSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PerformanceCriteriaSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Performance criteria deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


# ================== BONUS MAPPING ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageBonusMapping])
def bonus_mapping_list(request):
    def logic():
        if request.method == 'GET':
            queryset = BonusMapping.objects.all()
            serializer = BonusMappingSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            serializer = BonusMappingSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageBonusMapping])
def bonus_mapping_detail(request, pk):
    def logic():
        instance = get_object_or_404(BonusMapping, pk=pk)
        
        if request.method == 'GET':
            serializer = BonusMappingSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = BonusMappingSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Bonus mapping deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calculate_bonus(request):
    """Calculate bonus for a given rating"""
    def logic():
        rating = request.query_params.get('rating')
        employee_level = request.query_params.get('employee_level')
        
        if not rating:
            return Response(
                {'error': 'rating parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating_val = float(rating)
        except ValueError:
            return Response(
                {'error': 'Invalid rating value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        bonus_percentage = RatingCalculatorService.calculate_bonus_percentage(
            rating_val, 
            employee_level
        )
        
        return Response({
            'rating': rating_val,
            'employee_level': employee_level,
            'bonus_percentage': float(bonus_percentage)
        }, status=status.HTTP_200_OK)
        
    return safe_api(logic)


# ================== GOALS ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, CanManageGoals])
def goal_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = Goal.objects.all()
            role = getattr(user, 'role', None)
            
            if role in ['admin', 'hr']:
                pass
            elif role == 'manager':
                # Managers see their team's goals AND unassigned goals? Or just team?
                # Let's say managers can see all unassigned to assign?
                # For now keeping it simple:
                # If query params has 'unassigned=true', showing unassigned.
                pass
            else:
                # Regular employees see their own goals OR unassigned goals they can claim
                pass
            
            # Simplified Logic for "Take Task" support across all roles:
            # 1. Base filter by role logic (existing)
            # 2. Add OR condition for unassigned goals if they are public pool
            
            # RE-WRITING QUERYSET LOGIC:
            if role in ['admin', 'hr']:
                 # Admin sees all
                 pass 
            elif role == 'manager':
                queryset = queryset.filter(
                    Q(employee__manager=request.user) | Q(employee__isnull=True)
                )
            else:
                # Employees see their own AND unassigned
                queryset = queryset.filter(
                    Q(employee=request.user) | Q(employee__isnull=True)
                )
            
            review_period_id = request.query_params.get('review_period')
            if review_period_id:
                queryset = queryset.filter(review_period_id=review_period_id)
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            queryset = queryset.select_related('employee', 'review_period')
            serializer = GoalSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            # Create a mutable copy of data
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            
            # Default to current user if employee not specified
            if 'employee' not in data:
                data['employee'] = user.id
            
            # Default to active review period if not specified
            if 'review_period' not in data or not data['review_period']:
                active_period = ReviewPeriod.objects.filter(status='active').order_by('-start_date').first()
                if active_period:
                    data['review_period'] = active_period.id
                else:
                    return Response(
                        {'review_period': ['No active review period found. Please contact admin to create one.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            print(f"Goal Creation Data: {data}")    
            serializer = GoalCreateSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(GoalSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
            
            print(f"Goal Creation Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageGoals])
def goal_detail(request, pk):
    def logic():
        user = request.user
        queryset = Goal.objects.all()
        role = getattr(user, 'role', None)
        if role not in ['admin', 'hr']:
            if role == 'manager':
                queryset = queryset.filter(employee__manager=user)
            else:
                queryset = queryset.filter(employee=user)
                
        instance = get_object_or_404(queryset, pk=pk)
        
        if request.method == 'GET':
            serializer = GoalSerializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = GoalSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            instance.delete()
            return Response(
                {'message': 'Goal deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def goal_update_progress(request, pk):
    """Update goal progress"""
    def logic():
        goal = get_object_or_404(Goal, pk=pk)
        progress = request.data.get('progress_percentage')
        
        if progress is None:
            return Response(
                {'error': 'progress_percentage is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            goal.progress_percentage = int(progress)
        except ValueError:
            return Response(
                {'error': 'Invalid progress value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        goal.save()
        serializer = GoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_goal(request, pk):
    """Claim an unassigned goal (Take Task)"""
    def logic():
        goal = get_object_or_404(Goal, pk=pk)
        
        if goal.employee:
            return Response(
                {'error': 'This goal is already assigned'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        goal.employee = request.user
        goal.status = 'in_progress' # Automatically start when claimed? Or keep not_started?
        goal.save()
        
        serializer = GoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    return safe_api(logic)


# ================== REPORTS ==================
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrHR])
def performance_reports(request):
    """
    API endpoint for generating reports
    GET /api/performance/reports/?type=performance-report&review_period_id=1
    GET /api/performance/reports/?type=bonus-projections&review_period_id=1
    """
    def logic():
        report_type = request.query_params.get('type', 'performance-report')
        review_period_id = request.query_params.get('review_period_id')
        
        if not review_period_id:
            return Response(
                {'error': 'review_period_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if report_type == 'performance-report':
            report = AnalyticsService.generate_performance_report(review_period_id)
        elif report_type == 'bonus-projections':
            report = AnalyticsService.get_bonus_projections(review_period_id)
        else:
            return Response(
                {'error': 'Invalid report type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(report, status=status.HTTP_200_OK)
        
    return safe_api(logic)
