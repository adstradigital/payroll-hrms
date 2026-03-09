from django.urls import path
from . import views

urlpatterns = [
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
    path('candidates/bulk-update/', views.candidate_bulk_update, name='candidate-bulk-update'),
    path('candidates/<int:pk>/add-note/', views.candidate_add_note, name='candidate-add-note'),
    path('candidates/<int:pk>/status/', views.candidate_update_status, name='candidate-update-status'),
    path('candidates/<int:pk>/toggle-star/', views.candidate_toggle_star, name='candidate-toggle-star'),
    path('candidates/<int:pk>/apply/', views.candidate_apply_to_job, name='candidate-apply-to-job'),
    
    # Applications
    path('applications/<int:pk>/', views.application_detail, name='application-detail'),
    path('applications/<int:pk>/stage/', views.application_update_stage, name='application-update-stage'),
    
    # Interviews
    path('interviews/', views.interview_list_create, name='interview-list-create'),
    path('interviews/upcoming/', views.interview_upcoming, name='interview-upcoming'),
    path('interviews/<int:pk>/', views.interview_detail, name='interview-detail'),
    path('interviews/<int:pk>/cancel/', views.interview_cancel, name='interview-cancel'),
    path('interviews/<int:pk>/reschedule/', views.interview_reschedule, name='interview-reschedule'),
    path('interviews/<int:pk>/feedback/', views.interview_submit_feedback, name='interview-submit-feedback'),
]
