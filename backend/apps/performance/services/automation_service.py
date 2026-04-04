from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from decimal import Decimal
import logging
from ..models import PerformanceReview, ReviewPeriod, BonusMapping, PerformanceCriteria, CriteriaRating

logger = logging.getLogger(__name__)


class AutomationService:
    """
    Service for automating performance review workflows.
    Handles: auto-create reviews, deadline reminders, bonus calculation, auto-close
    """
    
    @staticmethod
    @transaction.atomic
    def auto_create_reviews_for_period(review_period_id, created_by=None):
        """
        Automatically create reviews for all active employees when period is activated.
        Also attaches active performance criteria to each review.
        
        Args:
            review_period_id: UUID of the review period
            created_by: User who triggered the action (for audit)
            
        Returns:
            dict: {created_count, skipped_count, employee_ids, criteria_attached}
        """
        from apps.accounts.models import Employee
        
        try:
            review_period = ReviewPeriod.objects.get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            return {'error': 'Review period not found'}
        
        # Get all active employees who have a linked user account
        active_employees = Employee.objects.filter(
            status='active',
            user__isnull=False
        ).select_related('user', 'reporting_manager')
        
        # Get active performance criteria to attach to each review
        active_criteria = list(PerformanceCriteria.objects.filter(is_active=True))
        
        created_count = 0
        skipped_count = 0
        created_ids = []
        criteria_attached_count = 0
        
        for employee in active_employees:
            # Skip if review already exists
            existing = PerformanceReview.objects.filter(
                employee=employee.user,
                review_period=review_period
            ).exists()
            
            if existing:
                skipped_count += 1
                continue
            
            # Get reporting manager as reviewer
            reviewer = None
            if employee.reporting_manager and employee.reporting_manager.user:
                reviewer = employee.reporting_manager.user
            
            # Create the review
            review = PerformanceReview.objects.create(
                employee=employee.user,
                reviewer=reviewer,
                review_period=review_period,
                status='pending'
            )
            
            # Attach active criteria to review
            for criteria in active_criteria:
                CriteriaRating.objects.create(
                    performance_review=review,
                    criteria=criteria,
                    self_rating=None,
                    manager_rating=None
                )
                criteria_attached_count += 1
            
            created_count += 1
            created_ids.append(str(review.id))
        
        return {
            'created_count': created_count,
            'skipped_count': skipped_count,
            'review_ids': created_ids,
            'criteria_attached': len(active_criteria),
            'total_criteria_ratings': criteria_attached_count
        }
    
    @staticmethod
    def check_deadline_and_send_reminders(review_period_id, days_before=3):
        """
        Check if deadline is approaching and send reminders to pending reviews.
        
        Args:
            review_period_id: UUID of the review period
            days_before: Days before deadline to trigger reminders
            
        Returns:
            dict: {reminders_sent, deadline_info}
        """
        from .notification_service import NotificationService
        
        try:
            review_period = ReviewPeriod.objects.get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            return {'error': 'Review period not found'}
        
        if not review_period.submission_deadline:
            return {'error': 'No submission deadline set'}
        
        today = timezone.now().date()
        deadline = review_period.submission_deadline
        days_remaining = (deadline - today).days
        
        if days_remaining > days_before:
            return {
                'reminders_sent': 0,
                'reason': f'Deadline is {days_remaining} days away, not sending reminders yet'
            }
        
        # Get pending reviews
        pending_reviews = review_period.reviews.filter(
            status__in=['pending', 'self_submitted']
        )
        
        reminder_count = 0
        for review in pending_reviews:
            if review.status == 'pending':
                # Remind employee to submit self-assessment
                NotificationService.notify_employee_reminder(review)
            elif review.status == 'self_submitted':
                # Remind manager to review
                NotificationService.notify_manager_reminder(review)
            reminder_count += 1
        
        return {
            'reminders_sent': reminder_count,
            'days_remaining': days_remaining,
            'deadline': str(deadline)
        }
    
    @staticmethod
    @transaction.atomic
    def calculate_bonus_for_completed_reviews(review_period_id=None, review_id=None):
        """
        Calculate bonus points for completed reviews.
        Can calculate for a specific review or an entire period.
        
        Args:
            review_period_id: UUID of the review period (optional if review_id provided)
            review_id: UUID of a specific performance review (optional)
            
        Returns:
            dict: {calculated_count, bonus_details}
        """
        # Get completed reviews with ratings
        queryset = PerformanceReview.objects.filter(
            status='completed',
            overall_rating__isnull=False
        )
        
        if review_id:
            queryset = queryset.filter(id=review_id)
        elif review_period_id:
            queryset = queryset.filter(review_period_id=review_period_id)
        else:
            return {'error': 'Either review_period_id or review_id must be provided'}
        
        completed_reviews = queryset.select_related('employee', 'review_period')
        
        # Get bonus mappings
        bonus_mappings = BonusMapping.objects.filter(is_active=True).order_by('-min_rating')
        
        # Import AdhocPayment here to avoid potential circular imports at top level if any
        try:
            from apps.payroll.models import AdhocPayment, SalaryComponent
        except ImportError:
             # Fallback if payroll app is not ready or accessible
             return {'error': 'Payroll app not accessible'}
        
        calculated = []
        payments_created = 0
        
        for review in completed_reviews:
            rating = float(review.overall_rating)
            bonus_percentage = 0
            
            # Find matching bonus mapping
            for mapping in bonus_mappings:
                if rating >= float(mapping.min_rating) and rating <= float(mapping.max_rating):
                    bonus_percentage = float(mapping.bonus_percentage)
                    break
            
            if bonus_percentage > 0:
                # Calculate bonus amount
                # Assuming bonus is % of CURRENT Basic Salary
                # We need to fetch employee's current salary
                try:
                    from apps.payroll.models import EmployeeSalary
                    
                    # Get Employee profile from User
                    # PerformanceReview.employee is a User object
                    # EmployeeSalary.employee is an Employee object
                    employee_profile = getattr(review.employee, 'employee_profile', None)
                    
                    if employee_profile:
                        # Get employee current salary
                        salary_obj = EmployeeSalary.objects.filter(employee=employee_profile, is_current=True).first()
                        
                        # Use actual gross salary or fallback to default used in payroll generation
                        if salary_obj:
                            base_for_bonus = float(salary_obj.gross_salary)
                        else:
                            # Match the default '50000' used in payroll_generation.py
                            base_for_bonus = 50000.0
                            logger.info(f"No salary record for {employee_profile}. Using default 50000 for bonus calculation.")
                        
                        if base_for_bonus > 0:
                            bonus_amount = (base_for_bonus * bonus_percentage) / 100.0
                            
                            # Create Adhoc Payment
                            payment_name = f"Performance Bonus - {review.review_period.name}"
                            
                            # Determine component to use
                            bonus_component = SalaryComponent.objects.filter(
                                company=employee_profile.company,
                                name__icontains='Bonus',
                                component_type='earning'
                            ).first()
                            
                            # Check for duplicates
                            exists = AdhocPayment.objects.filter(
                                employee=employee_profile,
                                name=payment_name,
                                status__in=['pending', 'processed']
                            ).exists()
                            
                            if not exists:
                                AdhocPayment.objects.create(
                                    company=employee_profile.company,
                                    employee=employee_profile,
                                    name=payment_name,
                                    amount=bonus_amount,
                                    notes=f"Auto-generated from Review: {review.id} (Rating: {rating})"
                                )
                                payments_created += 1
                                
                                calculated.append({
                                    'employee_id': str(employee_profile.id),
                                    'employee_name': employee_profile.full_name,
                                    'rating': rating,
                                    'bonus_percentage': bonus_percentage,
                                    'amount': str(bonus_amount)
                                })
                    else:
                        print(f"Skipping bonus: No employee profile for user {review.employee}")

                except Exception as e:
                    print(f"Error calculating bonus for {review.employee}: {e}")
        
        return {
            'calculated_count': len(calculated),
            'payments_created': payments_created,
            'bonus_details': calculated
        }
    
    @staticmethod
    @transaction.atomic
    def auto_close_if_completed(review_period_id, closed_by=None):
        """
        Automatically close a review period if all reviews are completed.
        
        Args:
            review_period_id: UUID of the review period
            closed_by: User who triggered the action
            
        Returns:
            dict: {closed, reason, stats}
        """
        try:
            review_period = ReviewPeriod.objects.select_for_update().get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            return {'closed': False, 'reason': 'Review period not found'}
        
        if review_period.status != 'active':
            return {'closed': False, 'reason': f'Period is not active (status: {review_period.status})'}
        
        total_reviews = review_period.reviews.count()
        completed_reviews = review_period.reviews.filter(status='completed').count()
        
        if total_reviews == 0:
            return {
                'closed': False,
                'reason': 'No reviews in this period',
                'stats': {'total': 0, 'completed': 0}
            }
        
        if completed_reviews < total_reviews:
            return {
                'closed': False,
                'reason': f'Not all reviews completed ({completed_reviews}/{total_reviews})',
                'stats': {'total': total_reviews, 'completed': completed_reviews}
            }
        
        # All reviews are completed - close the period
        review_period.status = 'completed'
        review_period.save()
        
        return {
            'closed': True,
            'reason': 'All reviews completed, period closed automatically',
            'stats': {'total': total_reviews, 'completed': completed_reviews}
        }
    
    @staticmethod
    def run_all_automations(review_period_id, user=None):
        """
        Run all applicable automations for a review period.
        
        Args:
            review_period_id: UUID of the review period
            user: User triggering automations
            
        Returns:
            dict: Combined results from all automations
        """
        results = {}
        
        # Check and send reminders
        results['reminders'] = AutomationService.check_deadline_and_send_reminders(
            review_period_id, 
            days_before=7
        )
        
        # Calculate bonuses for completed reviews
        results['bonus_calculation'] = AutomationService.calculate_bonus_for_completed_reviews(
            review_period_id
        )
        
        # Check if period should auto-close
        results['auto_close'] = AutomationService.auto_close_if_completed(
            review_period_id,
            closed_by=user
        )
        
        return results
