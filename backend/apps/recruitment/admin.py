from django.contrib import admin
from .models import (
    JobOpening, Candidate, Application, 
    Interview, InterviewFeedback, CandidateNote
)

@admin.register(JobOpening)
class JobOpeningAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'status', 'posted_date', 'applications_count')
    list_filter = ('status', 'department', 'employment_type')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'posted_date'

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'status', 'source', 'created_at')
    list_filter = ('status', 'source')
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    date_hierarchy = 'created_at'

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job_opening', 'status', 'current_stage', 'applied_date')
    list_filter = ('status', 'current_stage')
    search_fields = ('candidate__first_name', 'candidate__last_name', 'job_opening__title')
    date_hierarchy = 'applied_date'

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('title', 'candidate', 'job_opening', 'scheduled_date', 'status')
    list_filter = ('status', 'interview_type')
    search_fields = ('title', 'candidate__first_name', 'candidate__last_name', 'job_opening__title')
    date_hierarchy = 'scheduled_date'

admin.site.register(InterviewFeedback)
admin.site.register(CandidateNote)
