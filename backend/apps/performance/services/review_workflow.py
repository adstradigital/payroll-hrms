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
        if approver.role not in ['admin', 'hr']:
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
        if rejector.role not in ['admin', 'hr', 'manager']:
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
        if created_by.role not in ['admin', 'hr']:
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
        Get progress statistics for a review period
        """
        total_reviews = review_period.reviews.count()
        
        if total_reviews == 0:
            return {
                'total': 0,
                'pending': 0,
                'self_submitted': 0,
                'under_review': 0,
                'completed': 0,
                'rejected': 0,
                'completion_percentage': 0
            }
        
        status_counts = {
            'pending': review_period.reviews.filter(status='pending').count(),
            'self_submitted': review_period.reviews.filter(status='self_submitted').count(),
            'under_review': review_period.reviews.filter(status='under_review').count(),
            'completed': review_period.reviews.filter(status='completed').count(),
            'rejected': review_period.reviews.filter(status='rejected').count(),
        }
        
        completion_percentage = (status_counts['completed'] / total_reviews) * 100
        
        return {
            'total': total_reviews,
            **status_counts,
            'completion_percentage': round(completion_percentage, 2)
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
        if closed_by.role not in ['admin', 'hr']:
            raise PermissionDenied("Only HR or Admin can close review periods")
        
        review_period.status = 'completed'
        review_period.save()
        
        # Optional: Auto-complete or flag incomplete reviews
        incomplete_reviews = review_period.reviews.exclude(status='completed')
        
        return {
            'review_period': review_period,
            'incomplete_count': incomplete_reviews.count()
        }
