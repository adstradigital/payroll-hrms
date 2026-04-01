from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'applications', views.ApplicationViewSet, basename='application')

urlpatterns = [
    # Settings
    path('settings/job-postings/', views.recruitment_job_posting_settings, name='recruitment-job-posting-settings'),
    path('jobs/defaults/', views.recruitment_job_defaults, name='recruitment-job-defaults'),
    path('interview-templates/', views.interview_template_list_create, name='interview-template-list-create'),
    path('interview-templates/<int:pk>/', views.interview_template_detail, name='interview-template-detail'),
    path('rejection-reasons/', views.rejection_reason_list_create, name='rejection-reason-list-create'),
    path('rejection-reasons/<int:pk>/', views.rejection_reason_detail, name='rejection-reason-detail'),

    # Surveys
    path('surveys/', views.survey_list_create, name='survey-list-create'),
    path('surveys/<int:pk>/', views.survey_detail, name='survey-detail'),
    path('surveys/<int:pk>/questions/', views.survey_questions, name='survey-questions'),
    path('surveys/<int:pk>/responses/', views.survey_responses, name='survey-responses'),

    # Open Jobs
    path('jobs/', views.job_opening_list_create, name='job-list-create'),
    path('jobs/<int:pk>/', views.job_opening_detail, name='job-detail'),
    path('jobs/<int:pk>/status/', views.job_opening_update_status, name='job-update-status'),

    # Skill Zone
    path('skill-categories/', views.skill_category_list_create, name='skill-category-list-create'),
    path('skill-categories/<int:pk>/', views.skill_category_detail, name='skill-category-detail'),
    path('skills/', views.skill_list_create, name='skill-list-create'),
    path('skills/<int:pk>/', views.skill_detail, name='skill-detail'),

    # Recruitment Stages
    path('stages/reorder/', views.recruitment_stage_reorder, name='recruitment-stage-reorder'),
    path('stages/', views.recruitment_stage_list_create, name='recruitment-stage-list-create'),
    path('stages/<int:pk>/', views.recruitment_stage_detail, name='recruitment-stage-detail'),

    # Job Openings
    path('job-openings/', views.job_opening_list_create, name='job-opening-list-create'),
    path('job-openings/<int:pk>/', views.job_opening_detail, name='job-opening-detail'),
    path('job-openings/stats/', views.job_opening_stats, name='job-opening-stats'),
    path('job-openings/<int:pk>/duplicate/', views.job_opening_duplicate, name='job-opening-duplicate'),
    path('job-openings/<int:pk>/applications/', views.job_opening_applications, name='job-opening-applications'),
    
    # Candidates
    path('candidates/', views.candidate_list_create, name='candidate-list-create'),
    path('candidates/<int:pk>/', views.candidate_detail, name='candidate-detail'),
    path('candidates/stats/', views.candidate_stats, name='candidate-stats'),
    path('candidates/bulk-upload/', views.resume_bulk_upload, name='candidate-bulk-upload'),
    path('candidates/bulk-update/', views.candidate_bulk_update, name='candidate-bulk-update'),
    path('candidates/<int:pk>/add-note/', views.candidate_add_note, name='candidate-add-note'),
    path('candidates/<int:pk>/status/', views.candidate_update_status, name='candidate-update-status'),
    path('candidates/<int:pk>/stage/', views.candidate_update_status, name='candidate-update-stage'),
    path('candidates/<int:pk>/toggle-star/', views.candidate_toggle_star, name='candidate-toggle-star'),
    path('candidates/<int:pk>/apply/', views.candidate_apply_to_job, name='candidate-apply-to-job'),
    
    # Applications (additional stage action)
    path('applications/<int:pk>/stage/', views.application_update_stage, name='application-update-stage'),

    # Pipeline
    path('pipeline/', views.recruitment_pipeline, name='recruitment-pipeline'),
     
    # Interviews
    path('interviews/', views.interview_list_create, name='interview-list-create'),
    path('interviews/upcoming/', views.interview_upcoming, name='interview-upcoming'),
    path('interviews/<int:pk>/', views.interview_detail, name='interview-detail'),
    path('interviews/<int:pk>/status/', views.interview_update_status, name='interview-update-status'),
    path('interviews/<int:pk>/result/', views.interview_update_result, name='interview-update-result'),
    path('interviews/<int:pk>/cancel/', views.interview_cancel, name='interview-cancel'),
    path('interviews/<int:pk>/reschedule/', views.interview_reschedule, name='interview-reschedule'),
    path('interviews/<int:pk>/feedback/', views.interview_submit_feedback, name='interview-submit-feedback'),
]

urlpatterns += router.urls
