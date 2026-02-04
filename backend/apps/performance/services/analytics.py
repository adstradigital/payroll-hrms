from django.db.models import Avg, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from ..models import PerformanceReview, ReviewPeriod, Goal
from .rating_calculator import RatingCalculatorService


class AnalyticsService:
    """
    Service for generating performance analytics and dashboard data
    """
    
    @staticmethod
    def get_dashboard_stats(user, review_period=None):
        """
        Get dashboard statistics based on user role
        Returns different data for Admin/HR, Manager, and Employee
        """
        role = getattr(user, 'role', None)
        
        if role in ['admin', 'hr']:
            return AnalyticsService._get_admin_dashboard(review_period)
        elif role == 'manager':
            return AnalyticsService._get_manager_dashboard(user, review_period)
        else:
            return AnalyticsService._get_employee_dashboard(user, review_period)
    
    @staticmethod
    def _get_admin_dashboard(review_period=None):
        """
        Admin/HR dashboard with company-wide statistics
        """
        queryset = PerformanceReview.objects.all()
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        else:
            # Default to latest active review period
            latest_period = ReviewPeriod.objects.filter(status='active').order_by('-start_date').first()
            if latest_period:
                queryset = queryset.filter(review_period=latest_period)
                review_period = latest_period
        
        total_reviews = queryset.count()
        completed_reviews = queryset.filter(status='completed').count()
        pending_reviews = queryset.filter(status='pending').count()
        overdue_reviews = queryset.filter(
            status__in=['pending', 'self_submitted'],
            review_period__submission_deadline__lt=timezone.now().date()
        ).count()
        
        # Average rating
        avg_rating = queryset.filter(
            status='completed',
            overall_rating__isnull=False
        ).aggregate(avg=Avg('overall_rating'))['avg']
        
        # Rating distribution
        rating_distribution = RatingCalculatorService.get_rating_distribution(review_period)
        
        # Recent reviews
        recent_reviews = queryset.filter(status='completed').order_by('-reviewed_at')[:5]
        
        # Department-wise stats
        department_stats = AnalyticsService._get_department_stats(review_period)
        
        # Trend data (last 6 review periods)
        trend_data = AnalyticsService._get_rating_trends(periods=6)
        
        return {
            'total_reviews': total_reviews,
            'completed_reviews': completed_reviews,
            'pending_reviews': pending_reviews,
            'overdue_reviews': overdue_reviews,
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'rating_distribution': rating_distribution,
            'recent_reviews': recent_reviews,
            'department_stats': department_stats,
            'trend_data': trend_data,
            'completion_percentage': round((completed_reviews / total_reviews * 100), 2) if total_reviews > 0 else 0
        }
    
    @staticmethod
    def _get_manager_dashboard(manager, review_period=None):
        """
        Manager dashboard with team statistics
        """
        queryset = PerformanceReview.objects.filter(employee__manager=manager)
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        else:
            latest_period = ReviewPeriod.objects.filter(status='active').order_by('-start_date').first()
            if latest_period:
                queryset = queryset.filter(review_period=latest_period)
        
        total_reviews = queryset.count()
        completed_reviews = queryset.filter(status='completed').count()
        pending_reviews = queryset.filter(status__in=['pending', 'self_submitted']).count()
        
        # Average team rating
        avg_rating = queryset.filter(
            status='completed',
            overall_rating__isnull=False
        ).aggregate(avg=Avg('overall_rating'))['avg']
        
        # Team members performance
        team_performance = queryset.filter(status='completed').values(
            'employee__first_name', 
            'employee__last_name',
            'overall_rating',
            'rating_category'
        ).order_by('-overall_rating')
        
        # Pending actions (reviews awaiting manager input)
        pending_actions = queryset.filter(status='self_submitted').count()
        
        return {
            'total_reviews': total_reviews,
            'completed_reviews': completed_reviews,
            'pending_reviews': pending_reviews,
            'average_team_rating': round(avg_rating, 2) if avg_rating else None,
            'team_performance': list(team_performance),
            'pending_actions': pending_actions,
            'completion_percentage': round((completed_reviews / total_reviews * 100), 2) if total_reviews > 0 else 0
        }
    
    @staticmethod
    def _get_employee_dashboard(employee, review_period=None):
        """
        Employee dashboard with personal performance data
        """
        queryset = PerformanceReview.objects.filter(employee=employee)
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        
        # Current review
        current_review = queryset.filter(
            review_period__status='active'
        ).first()
        
        # Performance history
        performance_history = queryset.filter(
            status='completed'
        ).order_by('-review_period__end_date').values(
            'review_period__name',
            'overall_rating',
            'rating_category',
            'reviewed_at'
        )[:5]
        
        # Goals
        goals_queryset = Goal.objects.filter(employee=employee)
        
        if review_period:
            goals_queryset = goals_queryset.filter(review_period=review_period)
        
        total_goals = goals_queryset.count()
        completed_goals = goals_queryset.filter(status='completed').count()
        overdue_goals = goals_queryset.filter(
            status__in=['not_started', 'in_progress'],
            target_date__lt=timezone.now().date()
        ).count()
        
        # Average rating over time
        avg_rating = queryset.filter(
            status='completed',
            overall_rating__isnull=False
        ).aggregate(avg=Avg('overall_rating'))['avg']
        
        return {
            'current_review': current_review,
            'performance_history': list(performance_history),
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'total_goals': total_goals,
            'completed_goals': completed_goals,
            'overdue_goals': overdue_goals,
            'goal_completion_rate': round((completed_goals / total_goals * 100), 2) if total_goals > 0 else 0
        }
    
    @staticmethod
    def _get_department_stats(review_period=None):
        """
        Get statistics grouped by department
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        queryset = PerformanceReview.objects.filter(status='completed')
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        
        # Assuming User model has a department field
        if not hasattr(User, 'department'):
            return []
        
        departments = queryset.values('employee__department').annotate(
            total=Count('id'),
            avg_rating=Avg('overall_rating')
        ).order_by('employee__department')
        
        return list(departments)
    
    @staticmethod
    def _get_rating_trends(periods=6):
        """
        Get rating trends over the last N review periods
        """
        recent_periods = ReviewPeriod.objects.filter(
            status='completed'
        ).order_by('-end_date')[:periods]
        
        trends = []
        
        for period in reversed(list(recent_periods)):
            avg_rating = PerformanceReview.objects.filter(
                review_period=period,
                status='completed',
                overall_rating__isnull=False
            ).aggregate(avg=Avg('overall_rating'))['avg']
            
            trends.append({
                'period_name': period.name,
                'average_rating': round(avg_rating, 2) if avg_rating else None
            })
        
        return trends
    
    @staticmethod
    def generate_performance_report(review_period_id):
        """
        Generate comprehensive performance report for a review period
        """
        try:
            review_period = ReviewPeriod.objects.get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            return None
        
        reviews = PerformanceReview.objects.filter(
            review_period=review_period,
            status='completed'
        )
        
        total_reviews = reviews.count()
        
        if total_reviews == 0:
            return {
                'review_period': review_period.name,
                'total_reviews': 0,
                'message': 'No completed reviews found'
            }
        
        # Overall statistics
        avg_rating = reviews.aggregate(avg=Avg('overall_rating'))['avg']
        rating_distribution = RatingCalculatorService.get_rating_distribution(review_period)
        
        # Top and bottom performers
        top_performers = RatingCalculatorService.get_top_performers(review_period, limit=10)
        bottom_performers = RatingCalculatorService.get_bottom_performers(review_period, limit=10)
        
        # Criteria-wise averages
        criteria_averages = RatingCalculatorService.calculate_criteria_wise_average(review_period)
        
        # Department-wise breakdown
        department_stats = AnalyticsService._get_department_stats(review_period)
        
        return {
            'review_period': review_period.name,
            'total_reviews': total_reviews,
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'rating_distribution': rating_distribution,
            'top_performers': list(top_performers.values(
                'employee__first_name', 
                'employee__last_name',
                'overall_rating',
                'rating_category'
            )),
            'bottom_performers': list(bottom_performers.values(
                'employee__first_name', 
                'employee__last_name',
                'overall_rating',
                'rating_category'
            )),
            'criteria_averages': criteria_averages,
            'department_stats': department_stats
        }
    
    @staticmethod
    def get_bonus_projections(review_period_id):
        """
        Calculate projected bonuses for all employees in a review period
        """
        try:
            review_period = ReviewPeriod.objects.get(id=review_period_id)
        except ReviewPeriod.DoesNotExist:
            return []
        
        reviews = PerformanceReview.objects.filter(
            review_period=review_period,
            status='completed',
            overall_rating__isnull=False
        ).select_related('employee')
        
        projections = []
        
        for review in reviews:
            employee = review.employee
            
            # Get employee level/position if available
            employee_level = getattr(employee, 'level', None) or getattr(employee, 'position', None)
            
            # Calculate bonus percentage
            bonus_percentage = RatingCalculatorService.calculate_bonus_percentage(
                review.overall_rating,
                employee_level
            )
            
            # Calculate bonus amount (assuming base_salary exists on employee)
            base_salary = getattr(employee, 'base_salary', 0)
            bonus_amount = (base_salary * bonus_percentage) / 100
            
            projections.append({
                'employee_id': employee.id,
                'employee_name': employee.get_full_name(),
                'rating': float(review.overall_rating),
                'rating_category': review.rating_category,
                'bonus_percentage': float(bonus_percentage),
                'base_salary': float(base_salary),
                'bonus_amount': float(bonus_amount)
            })
        
        return projections
