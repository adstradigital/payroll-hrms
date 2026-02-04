from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.accounts.models import BaseModel
import uuid

User = get_user_model()


class ReviewPeriod(BaseModel):
    """
    Defines performance review periods (Quarterly, Annual, etc.)
    """
    REVIEW_TYPE_CHOICES = [
        ('annual', 'Annual Review'),
        ('quarterly', 'Quarterly Review'),
        ('half_yearly', 'Half Yearly Review'),
        ('probation', 'Probation Review'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    review_type = models.CharField(max_length=20, choices=REVIEW_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    submission_deadline = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'review_periods'
        ordering = ['-start_date']
        verbose_name = 'Review Period'
        verbose_name_plural = 'Review Periods'
    
    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"
    
    @property
    def is_active(self):
        return self.status == 'active' and self.start_date <= timezone.now().date() <= self.end_date
    
    @property
    def is_overdue(self):
        return timezone.now().date() > self.submission_deadline and self.status == 'active'


class PerformanceReview(BaseModel):
    """
    Individual performance reviews for employees
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Self Assessment'),
        ('self_submitted', 'Self Assessment Submitted'),
        ('under_review', 'Under Manager Review'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='conducted_reviews')
    review_period = models.ForeignKey(ReviewPeriod, on_delete=models.CASCADE, related_name='reviews')
    
    # Self Assessment
    self_assessment = models.TextField(blank=True, null=True)
    self_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                     validators=[MinValueValidator(0), MaxValueValidator(5)])
    self_submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Manager Review
    manager_feedback = models.TextField(blank=True, null=True)
    manager_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                        validators=[MinValueValidator(0), MaxValueValidator(5)])
    strengths = models.TextField(blank=True, null=True)
    areas_for_improvement = models.TextField(blank=True, null=True)
    
    # Final Rating
    overall_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                        validators=[MinValueValidator(0), MaxValueValidator(5)])
    rating_category = models.CharField(max_length=50, blank=True, null=True)  # Excellent, Good, etc.
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'performance_reviews'
        unique_together = ['employee', 'review_period']
        ordering = ['-created_at']
        verbose_name = 'Performance Review'
        verbose_name_plural = 'Performance Reviews'
    
    def __str__(self):
        name = self.employee.get_full_name() if hasattr(self.employee, 'get_full_name') else self.employee.username
        return f"{name} - {self.review_period.name}"
    
    @property
    def is_overdue(self):
        return (self.status in ['pending', 'self_submitted'] and 
                timezone.now().date() > self.review_period.submission_deadline)


class RatingScale(BaseModel):
    """
    Defines rating scales and their descriptions
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    min_value = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    max_value = models.DecimalField(max_digits=3, decimal_places=2, default=5)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'rating_scales'
        verbose_name = 'Rating Scale'
        verbose_name_plural = 'Rating Scales'
    
    def __str__(self):
        return f"{self.name} ({self.min_value} - {self.max_value})"


class RatingCategory(BaseModel):
    """
    Rating categories like Excellent, Good, Satisfactory, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rating_scale = models.ForeignKey(RatingScale, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)  # Excellent, Good, Satisfactory, etc.
    min_score = models.DecimalField(max_digits=3, decimal_places=2)
    max_score = models.DecimalField(max_digits=3, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    color_code = models.CharField(max_length=7, default='#000000')  # Hex color for UI
    
    class Meta:
        db_table = 'rating_categories'
        ordering = ['-min_score']
        verbose_name = 'Rating Category'
        verbose_name_plural = 'Rating Categories'
    
    def __str__(self):
        return f"{self.name} ({self.min_score} - {self.max_score})"


class PerformanceCriteria(BaseModel):
    """
    Criteria for evaluating performance (Quality of Work, Teamwork, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, 
                                   validators=[MinValueValidator(0), MaxValueValidator(100)])
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'performance_criteria'
        verbose_name = 'Performance Criterion'
        verbose_name_plural = 'Performance Criteria'
    
    def __str__(self):
        return f"{self.name} ({self.weightage}%)"


class CriteriaRating(BaseModel):
    """
    Ratings for individual criteria within a performance review
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    performance_review = models.ForeignKey(PerformanceReview, on_delete=models.CASCADE, 
                                          related_name='criteria_ratings')
    criteria = models.ForeignKey(PerformanceCriteria, on_delete=models.CASCADE)
    
    self_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                     validators=[MinValueValidator(0), MaxValueValidator(5)])
    manager_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                        validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    comments = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'criteria_ratings'
        unique_together = ['performance_review', 'criteria']
        verbose_name = 'Criteria Rating'
        verbose_name_plural = 'Criteria Ratings'
    
    def __str__(self):
        return f"{self.performance_review} - {self.criteria.name}"


class BonusMapping(BaseModel):
    """
    Maps performance ratings to bonus percentages
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    rating_scale = models.ForeignKey(RatingScale, on_delete=models.CASCADE, related_name='bonus_mappings')
    min_rating = models.DecimalField(max_digits=3, decimal_places=2)
    max_rating = models.DecimalField(max_digits=3, decimal_places=2)
    bonus_percentage = models.DecimalField(max_digits=5, decimal_places=2,
                                          validators=[MinValueValidator(0), MaxValueValidator(100)])
    is_active = models.BooleanField(default=True)
    
    # Optional: Different bonus for different employee levels
    applies_to_level = models.CharField(max_length=50, blank=True, null=True)  # Junior, Senior, Manager, etc.
    
    class Meta:
        db_table = 'bonus_mappings'
        ordering = ['-min_rating']
        verbose_name = 'Bonus Mapping'
        verbose_name_plural = 'Bonus Mappings'
    
    def __str__(self):
        return f"{self.name}: {self.min_rating}-{self.max_rating} = {self.bonus_percentage}%"


class Goal(BaseModel):
    """
    Employee goals/objectives for a review period
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    review_period = models.ForeignKey(ReviewPeriod, on_delete=models.CASCADE, related_name='goals')
    performance_review = models.ForeignKey(PerformanceReview, on_delete=models.CASCADE, 
                                          related_name='goals', null=True, blank=True)
    
    title = models.CharField(max_length=300)
    description = models.TextField()
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    
    # Progress tracking
    progress_percentage = models.IntegerField(default=0, 
                                             validators=[MinValueValidator(0), MaxValueValidator(100)])
    achievement_notes = models.TextField(blank=True, null=True)
    
    # Rating
    self_achievement_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                                  validators=[MinValueValidator(0), MaxValueValidator(5)])
    manager_achievement_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True,
                                                     validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    class Meta:
        db_table = 'goals'
        ordering = ['target_date']
        verbose_name = 'Goal'
        verbose_name_plural = 'Goals'
    
    def __str__(self):
        name = self.employee.get_full_name() if hasattr(self.employee, 'get_full_name') else self.employee.username
        return f"{name} - {self.title}"
    
    @property
    def is_overdue(self):
        return self.status != 'completed' and timezone.now().date() > self.target_date
