from django.contrib import admin
from .models import (
    JobOpening, Candidate, Application, RecruitmentStage, SkillCategory, Skill,
    Interview, InterviewFeedback, CandidateNote,
    Survey, SurveyQuestion, SurveyResponse, SurveyAnswer,
    RecruitmentJobSetting,
    InterviewTemplate, InterviewQuestion,
)


@admin.register(RecruitmentStage)
class RecruitmentStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'sequence', 'is_system', 'created_at')
    list_filter = ('is_system',)
    search_fields = ('name',)
    ordering = ('sequence',)


@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name', 'description')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('name', 'description', 'category__name')
    list_select_related = ('category',)

@admin.register(JobOpening)
class JobOpeningAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'status', 'posted_date', 'applications_count')
    list_filter = ('status', 'department', 'employment_type')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'posted_date'

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'status', 'stage', 'source', 'created_at')
    list_filter = ('status', 'stage', 'source')
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    date_hierarchy = 'created_at'

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job_opening', 'status', 'current_stage', 'stage', 'source', 'applied_date')
    list_filter = ('status', 'current_stage', 'source')
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
admin.site.register(Survey)
admin.site.register(SurveyQuestion)
admin.site.register(SurveyResponse)
admin.site.register(SurveyAnswer)
admin.site.register(RecruitmentJobSetting)
admin.site.register(InterviewTemplate)
admin.site.register(InterviewQuestion)
