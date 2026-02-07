from decimal import Decimal
from django.db.models import Avg, Q
from ..models import (
    PerformanceReview, CriteriaRating, RatingCategory, 
    BonusMapping, PerformanceCriteria
)


class RatingCalculatorService:
    """
    Service for calculating performance ratings and related metrics
    """
    
    @staticmethod
    def calculate_weighted_rating(performance_review):
        """
        Calculate overall rating based on criteria weightages
        Returns the weighted average of all criteria ratings
        """
        criteria_ratings = performance_review.criteria_ratings.all()
        
        if not criteria_ratings:
            return None
        
        total_weighted_score = Decimal('0')
        total_weight = Decimal('0')
        
        for rating in criteria_ratings:
            if rating.manager_rating is not None:
                weight = rating.criteria.weightage
                total_weighted_score += Decimal(str(rating.manager_rating)) * Decimal(str(weight))
                total_weight += Decimal(str(weight))
        
        if total_weight == 0:
            return None
        
        # Weighted average
        weighted_rating = total_weighted_score / total_weight
        return round(weighted_rating, 2)
    
    @staticmethod
    def get_rating_category(rating_value, rating_scale):
        """
        Get the rating category (Excellent, Good, etc.) for a given rating value
        """
        try:
            category = RatingCategory.objects.filter(
                rating_scale=rating_scale,
                min_score__lte=rating_value,
                max_score__gte=rating_value
            ).first()
            
            return category.name if category else None
        except Exception:
            return None
    
    @staticmethod
    def calculate_bonus_percentage(rating_value, employee_level=None, rating_scale=None):
        """
        Calculate bonus percentage based on performance rating
        """
        query = Q(
            min_rating__lte=rating_value,
            max_rating__gte=rating_value,
            is_active=True
        )
        
        if rating_scale:
            query &= Q(rating_scale=rating_scale)
        
        # First try to find mapping for specific employee level
        if employee_level:
            mapping = BonusMapping.objects.filter(
                query, applies_to_level=employee_level
            ).first()
            
            if mapping:
                return mapping.bonus_percentage
        
        # Fall back to general mapping (no specific level)
        mapping = BonusMapping.objects.filter(
            query, applies_to_level__isnull=True
        ).first()
        
        return mapping.bonus_percentage if mapping else Decimal('0')
    
    @staticmethod
    def calculate_team_average_rating(manager):
        """
        Calculate average rating for all team members under a manager
        """
        team_reviews = PerformanceReview.objects.filter(
            employee__manager=manager,
            status='completed',
            overall_rating__isnull=False
        )
        
        avg_rating = team_reviews.aggregate(avg=Avg('overall_rating'))['avg']
        return round(avg_rating, 2) if avg_rating else None
    
    @staticmethod
    def calculate_department_average_rating(department):
        """
        Calculate average rating for a department
        """
        dept_reviews = PerformanceReview.objects.filter(
            employee__department=department,
            status='completed',
            overall_rating__isnull=False
        )
        
        avg_rating = dept_reviews.aggregate(avg=Avg('overall_rating'))['avg']
        return round(avg_rating, 2) if avg_rating else None
    
    @staticmethod
    def get_rating_distribution(review_period=None, department=None, manager=None):
        """
        Get distribution of ratings (count per rating category)
        Returns dict like: {'Excellent': 10, 'Good': 25, 'Satisfactory': 15}
        """
        queryset = PerformanceReview.objects.filter(
            status='completed',
            rating_category__isnull=False
        )
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        
        if department:
            queryset = queryset.filter(employee__department=department)
        
        if manager:
            queryset = queryset.filter(employee__manager=manager)
        
        distribution = {}
        for review in queryset:
            category = review.rating_category
            distribution[category] = distribution.get(category, 0) + 1
        
        return distribution
    
    @staticmethod
    def calculate_criteria_wise_average(review_period=None, department=None):
        """
        Calculate average rating for each performance criteria
        Returns dict like: {'Quality of Work': 4.2, 'Teamwork': 3.8, ...}
        """
        queryset = CriteriaRating.objects.filter(
            manager_rating__isnull=False
        )
        
        if review_period:
            queryset = queryset.filter(performance_review__review_period=review_period)
        
        if department:
            queryset = queryset.filter(performance_review__employee__department=department)
        
        criteria = PerformanceCriteria.objects.filter(is_active=True)
        averages = {}
        
        for criterion in criteria:
            avg = queryset.filter(criteria=criterion).aggregate(
                avg=Avg('manager_rating')
            )['avg']
            
            if avg:
                averages[criterion.name] = round(avg, 2)
        
        return averages
    
    @staticmethod
    def get_top_performers(review_period, limit=10):
        """
        Get top performers for a review period
        """
        return PerformanceReview.objects.filter(
            review_period=review_period,
            status='completed',
            overall_rating__isnull=False
        ).order_by('-overall_rating')[:limit]
    
    @staticmethod
    def get_bottom_performers(review_period, limit=10):
        """
        Get bottom performers for a review period (for improvement focus)
        """
        return PerformanceReview.objects.filter(
            review_period=review_period,
            status='completed',
            overall_rating__isnull=False
        ).order_by('overall_rating')[:limit]
    
    @staticmethod
    def calculate_goal_achievement_rate(employee, review_period=None):
        """
        Calculate percentage of goals completed successfully
        """
        from ..models import Goal
        
        queryset = Goal.objects.filter(employee=employee)
        
        if review_period:
            queryset = queryset.filter(review_period=review_period)
        
        total_goals = queryset.count()
        
        if total_goals == 0:
            return None
        
        completed_goals = queryset.filter(status='completed').count()
        
        achievement_rate = (completed_goals / total_goals) * 100
        return round(achievement_rate, 2)
