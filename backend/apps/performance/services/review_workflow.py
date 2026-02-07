from django.db import transaction
from django.utils import timezone
from django.core.exceptions import PermissionDenied, ValidationError
from ..models import PerformanceReview, ReviewPeriod
from ..validators import (
    validate_review_can_be_submitted,
    validate_self_assessment_complete,
    validate_manager_review_complete,
    validate_user_can_review
)
from .notification_service import NotificationService
from .rating_calculator import RatingCalculatorService


def _is_admin_or_hr(user):
    """
    Check if user has admin or HR privileges.
    Uses Django's is_superuser/is_staff and Employee.is_admin fields.
    """
    if user.is_superuser or user.is_staff:
        return True
    # Check if user has employee profile with is_admin flag
    if hasattr(user, 'employee_profile') and user.employee_profile:
        return user.employee_profile.is_admin
    return False


def _is_manager(user):
    """
    Check if user is a manager (has subordinates).
    """
    if hasattr(user, 'employee_profile') and user.employee_profile:
        return user.employee_profile.subordinates.filter(status='active').exists()
    return False

class ReviewWorkflowService:
    """
    Service for managing performance review workflow and state transitions
    """
    
    @staticmethod
    @transaction.atomic
    def submit_self_assessment(review_id, employee, self_assessment_data):
        """
        Employee submits their self-assessment
        """
        try:
            review = PerformanceReview.objects.select_for_update().get(id=review_id)
        except PerformanceReview.DoesNotExist:
            raise ValidationError("Performance review not found")
        
        # Validate permissions
        if review.employee != employee:
            raise PermissionDenied("You can only submit your own self-assessment")
        
        # Validate review can be submitted
        validate_review_can_be_submitted(review)
        
        # Update review with self-assessment
        review.self_assessment = self_assessment_data.get('self_assessment', '')
        review.self_rating = self_assessment_data.get('self_rating')
        review.status = 'self_submitted'
        review.self_submitted_at = timezone.now()
        review.save()
        
        # Send notification to manager
        NotificationService.notify_manager_review_pending(review)
        
        return review
    
    @staticmethod
    @transaction.atomic
    def submit_manager_review(review_id, manager, manager_review_data):
        """
        Manager submits their review and rating
        """
        try:
            review = PerformanceReview.objects.select_for_update().get(id=review_id)
        except PerformanceReview.DoesNotExist:
            raise ValidationError("Performance review not found")
        
        # Validate permissions
        validate_user_can_review(manager, review.employee)
        
        # Validate self-assessment is complete
        validate_self_assessment_complete(review)
        
        # Update review with manager feedback
        review.manager_feedback = manager_review_data.get('manager_feedback', '')
        review.manager_rating = manager_review_data.get('manager_rating')
        review.strengths = manager_review_data.get('strengths', '')
        review.areas_for_improvement = manager_review_data.get('areas_for_improvement', '')
        
        # Calculate overall rating (can be weighted or simple average)
        if review.criteria_ratings.exists():
            review.overall_rating = RatingCalculatorService.calculate_weighted_rating(review)
        else:
            review.overall_rating = manager_review_data.get('overall_rating')
        
        # Determine rating category
        if review.overall_rating and review.review_period:
            # Assuming default rating scale - in production, get from review_period or settings
            from ..models import RatingScale
            rating_scale = RatingScale.objects.filter(is_active=True).first()
            
            if rating_scale:
                review.rating_category = RatingCalculatorService.get_rating_category(
                    review.overall_rating, 
                    rating_scale
                )
        
        # Calculate goal completion score
        from ..models import Goal
        from django.db.models import Avg
        
        goals = Goal.objects.filter(
            employee=review.employee,
            review_period=review.review_period
        )
        
        if goals.exists():
            avg_progress = goals.aggregate(avg=Avg('progress_percentage'))['avg']
            review.goal_completion_score = round(avg_progress or 0, 2)
            
            # Optional: Weight overall rating with goal completion (30% goals, 70% manager rating)
            # Uncomment below to enable weighted rating
            # if review.overall_rating and review.goal_completion_score:
            #     goal_rating = (review.goal_completion_score / 100) * 5  # Convert % to 5-point scale
            #     weighted_rating = (float(review.overall_rating) * 0.7) + (goal_rating * 0.3)
            #     review.overall_rating = round(weighted_rating, 2)
        
        review.status = 'under_review'
        review.reviewed_at = timezone.now()
        review.save()
        
        # Send notification to employee
        NotificationService.notify_employee_review_completed(review)
        
        return review
    
    @staticmethod
    @transaction.atomic
    def approve_review(review_id, approver):
        """
        HR/Admin approves the completed review
        """
        try:
            review = PerformanceReview.objects.select_for_update().get(id=review_id)
        except PerformanceReview.DoesNotExist:
            raise ValidationError("Performance review not found")
        
        # Validate permissions (only HR/Admin can approve)
        if not _is_admin_or_hr(approver):
            raise PermissionDenied("Only HR or Admin can approve reviews")
        
        # Validate review is complete
        validate_manager_review_complete(review)
        
        review.status = 'completed'
        review.save()
        
        # Send notification to employee and manager
        NotificationService.notify_review_approved(review)
        
        return review
    
    @staticmethod
    @transaction.atomic
    def reject_review(review_id, rejector, rejection_reason):
        """
        Send review back for revision
        """
        try:
            review = PerformanceReview.objects.select_for_update().get(id=review_id)
        except PerformanceReview.DoesNotExist:
            raise ValidationError("Performance review not found")
        
        # Validate permissions
        if not (_is_admin_or_hr(rejector) or _is_manager(rejector)):
            raise PermissionDenied("You don't have permission to reject reviews")
        
        review.status = 'rejected'
        review.manager_feedback = f"{review.manager_feedback}\n\n[REJECTED]: {rejection_reason}"
        review.save()
        
        # Send notification
        NotificationService.notify_review_rejected(review, rejection_reason)
        
        return review
    
    @staticmethod
    @transaction.atomic
    def bulk_create_reviews(review_period_id, employee_ids, created_by):
        """
        Create performance reviews for multiple employees in bulk
        """
        try:
            review_period = ReviewPeriod.objects.get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            raise ValidationError("Review period not found")
        
        # Validate permissions
        if not _is_admin_or_hr(created_by):
            raise PermissionDenied("Only HR or Admin can create bulk reviews")
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        employees = User.objects.filter(id__in=employee_ids)
        created_reviews = []
        
        for employee in employees:
            # Check if review already exists
            existing_review = PerformanceReview.objects.filter(
                employee=employee,
                review_period=review_period
            ).first()
            
            if existing_review:
                continue
            
            # Get employee's manager as reviewer
            reviewer = employee.manager if hasattr(employee, 'manager') else None
            
            review = PerformanceReview.objects.create(
                employee=employee,
                reviewer=reviewer,
                review_period=review_period,
                status='pending'
            )
            
            created_reviews.append(review)
            
            # Send notification to employee
            NotificationService.notify_review_period_started(review)
        
        return created_reviews
    
    @staticmethod
    def get_review_progress(review_period):
        """
        Get detailed progress statistics for a review period
        """
        from django.db.models import Avg
        
        total_reviews = review_period.reviews.count()
        
        if total_reviews == 0:
            return {
                'total_reviews': 0,
                'pending': 0,
                'self_completed': 0,
                'manager_completed': 0,
                'completed': 0,
                'rejected': 0,
                'avg_rating': 0,
                'bonus_ready': 0,
                'completion_percentage': 0,
                'status_flow': {
                    'draft': review_period.status == 'draft',
                    'active': review_period.status == 'active',
                    'reviewing': False,
                    'completed': review_period.status == 'completed',
                    'closed': review_period.status == 'closed'
                }
            }
        
        # Count by status
        pending = review_period.reviews.filter(status='pending').count()
        self_submitted = review_period.reviews.filter(status='self_submitted').count()
        under_review = review_period.reviews.filter(status='under_review').count()
        completed = review_period.reviews.filter(status='completed').count()
        rejected = review_period.reviews.filter(status='rejected').count()
        
        # Self completed = self_submitted + under_review + completed
        self_completed = self_submitted + under_review + completed
        
        # Manager completed = under_review + completed (manager has reviewed)
        manager_completed = under_review + completed
        
        # Average rating of completed reviews
        avg_rating_result = review_period.reviews.filter(
            status='completed',
            overall_rating__isnull=False
        ).aggregate(avg=Avg('overall_rating'))
        avg_rating = round(avg_rating_result['avg'] or 0, 1)
        
        # Bonus ready = completed reviews (can calculate bonus)
        bonus_ready = completed
        
        # Completion percentage
        completion_percentage = round((completed / total_reviews) * 100, 2)
        
        # Determine if we're in reviewing phase (some self-assessments submitted)
        is_reviewing = self_submitted > 0 or under_review > 0
        
        return {
            'total_reviews': total_reviews,
            'pending': pending,
            'self_completed': self_completed,
            'manager_completed': manager_completed,
            'completed': completed,
            'rejected': rejected,
            'avg_rating': avg_rating,
            'bonus_ready': bonus_ready,
            'completion_percentage': completion_percentage,
            'status_flow': {
                'draft': review_period.status == 'draft',
                'active': review_period.status == 'active' and not is_reviewing,
                'reviewing': review_period.status == 'active' and is_reviewing,
                'completed': review_period.status == 'completed',
            'closed': review_period.status == 'closed'
            }
        }
    
    @staticmethod
    def send_reminder_notifications(review_period):
        """
        Send reminder notifications for pending reviews
        """
        pending_reviews = review_period.reviews.filter(
            status__in=['pending', 'self_submitted']
        )
        
        for review in pending_reviews:
            if review.status == 'pending':
                NotificationService.notify_employee_reminder(review)
            elif review.status == 'self_submitted':
                NotificationService.notify_manager_reminder(review)
        
        return pending_reviews.count()
    
    @staticmethod
    @transaction.atomic
    def close_review_period(review_period_id, closed_by):
        """
        Close a review period and mark all pending reviews
        """
        try:
            review_period = ReviewPeriod.objects.select_for_update().get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            raise ValidationError("Review period not found")
        
        # Validate permissions
        if not _is_admin_or_hr(closed_by):
            raise PermissionDenied("Only HR or Admin can close review periods")
        
        review_period.status = 'completed'
        review_period.save()
        
        # Optional: Auto-complete or flag incomplete reviews
        incomplete_reviews = review_period.reviews.exclude(status='completed')
        
        return {
            'review_period': review_period,
            'incomplete_count': incomplete_reviews.count()
        }
