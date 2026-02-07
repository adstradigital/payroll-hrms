from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ReviewPeriod, PerformanceReview, RatingScale, RatingCategory,
    PerformanceCriteria, CriteriaRating, BonusMapping, Goal
)


@admin.register(ReviewPeriod)
class ReviewPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'review_type', 'start_date', 'end_date', 'status', 'is_active_display']
    list_filter = ['status', 'review_type', 'start_date']
    search_fields = ['name', 'description']
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'review_type', 'description')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'submission_deadline')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: gray;">○</span> Inactive')
    is_active_display.short_description = 'Active Status'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'reviewer', 'review_period', 'status', 'overall_rating', 'rating_category']
    list_filter = ['status', 'rating_category', 'review_period', 'reviewed_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__email']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Review Information', {
            'fields': ('employee', 'reviewer', 'review_period', 'status')
        }),
        ('Self Assessment', {
            'fields': ('self_assessment', 'self_rating', 'self_submitted_at')
        }),
        ('Manager Review', {
            'fields': ('manager_feedback', 'manager_rating', 'strengths', 'areas_for_improvement')
        }),
        ('Final Rating', {
            'fields': ('overall_rating', 'rating_category')
        }),
        ('Timestamps', {
            'fields': ('reviewed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at', 'self_submitted_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'employee', 'reviewer', 'review_period'
        )


@admin.register(RatingScale)
class RatingScaleAdmin(admin.ModelAdmin):
    list_display = ['name', 'min_value', 'max_value', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


@admin.register(RatingCategory)
class RatingCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'rating_scale', 'min_score', 'max_score', 'color_display']
    list_filter = ['rating_scale']
    search_fields = ['name']
    
    def color_display(self, obj):
        return format_html(
            '<span style="background-color: {}; padding: 5px 10px; color: white;">{}</span>',
            obj.color_code,
            obj.color_code
        )
    color_display.short_description = 'Color'


@admin.register(PerformanceCriteria)
class PerformanceCriteriaAdmin(admin.ModelAdmin):
    list_display = ['name', 'weightage', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


@admin.register(CriteriaRating)
class CriteriaRatingAdmin(admin.ModelAdmin):
    list_display = ['performance_review', 'criteria', 'self_rating', 'manager_rating']
    list_filter = ['criteria']
    search_fields = ['performance_review__employee__first_name', 'performance_review__employee__last_name']


@admin.register(BonusMapping)
class BonusMappingAdmin(admin.ModelAdmin):
    list_display = ['name', 'rating_scale', 'min_rating', 'max_rating', 'bonus_percentage', 'applies_to_level', 'is_active']
    list_filter = ['is_active', 'rating_scale', 'applies_to_level']
    search_fields = ['name']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'review_period', 'status', 'progress_percentage', 'target_date', 'is_overdue_display']
    list_filter = ['status', 'review_period', 'target_date']
    search_fields = ['title', 'employee__first_name', 'employee__last_name']
    date_hierarchy = 'target_date'
    
    fieldsets = (
        ('Goal Information', {
            'fields': ('employee', 'review_period', 'performance_review', 'title', 'description')
        }),
        ('Status & Progress', {
            'fields': ('status', 'target_date', 'progress_percentage', 'achievement_notes')
        }),
        ('Ratings', {
            'fields': ('self_achievement_rating', 'manager_achievement_rating')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def is_overdue_display(self, obj):
        if obj.is_overdue:
            return format_html('<span style="color: red;">● Overdue</span>')
        return format_html('<span style="color: green;">○ On Track</span>')
    is_overdue_display.short_description = 'Status'
