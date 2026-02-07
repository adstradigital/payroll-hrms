from django.urls import path
from .views import (
    performance_dashboard, performance_reports,
    review_period_list, review_period_detail, review_period_activate,
    review_period_close, review_period_progress, review_period_reminders,
    performance_review_list, performance_review_detail, submit_self_assessment,
    submit_manager_review, approve_review, reject_review, bulk_create_reviews,
    rating_scale_list, rating_scale_detail,
    rating_category_list, rating_category_detail,
    performance_criteria_list, performance_criteria_detail,
    bonus_mapping_list, bonus_mapping_detail, calculate_bonus,
    goal_list, goal_detail, goal_update_progress, claim_goal
)

urlpatterns = [
    # Dashboard and Reports
    path('dashboard/', performance_dashboard, name='performance-dashboard'),
    path('reports/', performance_reports, name='performance-reports'),
    
    # Review Periods
    path('review-periods/', review_period_list, name='review-period-list'),
    path('review-periods/<uuid:pk>/', review_period_detail, name='review-period-detail'),
    path('review-periods/<uuid:pk>/activate/', review_period_activate, name='review-period-activate'),
    path('review-periods/<uuid:pk>/close/', review_period_close, name='review-period-close'),
    path('review-periods/<uuid:pk>/progress/', review_period_progress, name='review-period-progress'),
    path('review-periods/<uuid:pk>/send_reminders/', review_period_reminders, name='review-period-reminders'), # Matching frontend expectation or previous naming
    
    # Performance Reviews
    path('reviews/', performance_review_list, name='performance-review-list'),
    path('reviews/bulk_create/', bulk_create_reviews, name='performance-review-bulk-create'),
    path('reviews/<uuid:pk>/', performance_review_detail, name='performance-review-detail'),
    path('reviews/<uuid:pk>/submit_self_assessment/', submit_self_assessment, name='performance-review-self-submit'),
    path('reviews/<uuid:pk>/submit_manager_review/', submit_manager_review, name='performance-review-manager-submit'),
    path('reviews/<uuid:pk>/approve/', approve_review, name='performance-review-approve'),
    path('reviews/<uuid:pk>/reject/', reject_review, name='performance-review-reject'),
    
    # Ratings
    path('rating-scales/', rating_scale_list, name='rating-scale-list'),
    path('rating-scales/<uuid:pk>/', rating_scale_detail, name='rating-scale-detail'),
    
    path('rating-categories/', rating_category_list, name='rating-category-list'),
    path('rating-categories/<uuid:pk>/', rating_category_detail, name='rating-category-detail'),
    
    path('criteria/', performance_criteria_list, name='performance-criteria-list'),
    path('criteria/<uuid:pk>/', performance_criteria_detail, name='performance-criteria-detail'),
    
    # Bonus Mappings
    path('bonus-mappings/', bonus_mapping_list, name='bonus-mapping-list'),
    path('bonus-mappings/calculate_bonus/', calculate_bonus, name='bonus-calculate'),
    path('bonus-mappings/<uuid:pk>/', bonus_mapping_detail, name='bonus-mapping-detail'),
    
    # Goals
    path('goals/', goal_list, name='goal-list'),
    path('goals/<uuid:pk>/', goal_detail, name='goal-detail'),
    path('goals/<uuid:pk>/update_progress/', goal_update_progress, name='goal-update-progress'),
    path('goals/<uuid:pk>/claim/', claim_goal, name='goal-claim'),
]
