from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ReviewPeriod, PerformanceReview, RatingScale, RatingCategory,
    PerformanceCriteria, CriteriaRating, BonusMapping, Goal
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for nested serialization"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class ReviewPeriodSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    is_active = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    total_reviews = serializers.SerializerMethodField()
    completed_reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewPeriod
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_total_reviews(self, obj):
        return obj.reviews.count()
    
    def get_completed_reviews(self, obj):
        return obj.reviews.filter(status='completed').count()
    
    def validate(self, data):
        """Ensure end_date is after start_date and submission_deadline is valid"""
        if data.get('start_date') and data.get('end_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError("End date must be after start date")
        
        if data.get('submission_deadline') and data.get('end_date'):
            if data['submission_deadline'] < data['end_date']:
                raise serializers.ValidationError("Submission deadline should be on or after end date")
        
        return data


class CriteriaRatingSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    criteria_weightage = serializers.DecimalField(source='criteria.weightage', 
                                                   max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = CriteriaRating
        fields = ['id', 'criteria', 'criteria_name', 'criteria_weightage', 
                 'self_rating', 'manager_rating', 'comments']


class GoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee = UserBasicSerializer(read_only=True)
    reviewer = UserBasicSerializer(read_only=True)
    review_period_name = serializers.CharField(source='review_period.name', read_only=True)
    criteria_ratings = CriteriaRatingSerializer(many=True, read_only=True)
    goals = GoalSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = PerformanceReview
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reviewed_at', 'self_submitted_at']


class PerformanceReviewCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating reviews"""
    
    class Meta:
        model = PerformanceReview
        fields = ['employee', 'reviewer', 'review_period']
    
    def validate(self, data):
        """Check if review already exists for this employee and period"""
        employee = data.get('employee')
        review_period = data.get('review_period')
        
        if PerformanceReview.objects.filter(employee=employee, review_period=review_period).exists():
            raise serializers.ValidationError(
                "A review already exists for this employee in this review period"
            )
        
        return data


class PerformanceReviewSelfAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for employee self-assessment submission"""
    
    class Meta:
        model = PerformanceReview
        fields = ['self_assessment', 'self_rating']


class PerformanceReviewManagerSerializer(serializers.ModelSerializer):
    """Serializer for manager review submission"""
    
    class Meta:
        model = PerformanceReview
        fields = ['manager_feedback', 'manager_rating', 'strengths', 
                 'areas_for_improvement', 'overall_rating', 'rating_category']


class RatingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RatingCategory
        fields = '__all__'


class RatingScaleSerializer(serializers.ModelSerializer):
    categories = RatingCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = RatingScale
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PerformanceCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceCriteria
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_weightage(self, value):
        """Ensure weightage is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Weightage must be between 0 and 100")
        return value


class BonusMappingSerializer(serializers.ModelSerializer):
    rating_scale_name = serializers.CharField(source='rating_scale.name', read_only=True)
    
    class Meta:
        model = BonusMapping
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure min_rating is less than max_rating"""
        if data.get('min_rating') and data.get('max_rating'):
            if data['min_rating'] >= data['max_rating']:
                raise serializers.ValidationError("Min rating must be less than max rating")
        
        return data


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_reviews = serializers.IntegerField()
    completed_reviews = serializers.IntegerField()
    pending_reviews = serializers.IntegerField()
    overdue_reviews = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_distribution = serializers.DictField()
    recent_reviews = PerformanceReviewSerializer(many=True)
