from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    JobOpening, Candidate, Application, 
    Interview, InterviewFeedback, CandidateNote
)


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class JobOpeningSerializer(serializers.ModelSerializer):
    """Job Opening Serializer"""
    hiring_manager_details = UserSerializer(source='hiring_manager', read_only=True)
    recruiters_details = UserSerializer(source='recruiters', many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = JobOpening
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'applications_count', 'views_count']
    
    def validate(self, data):
        """Validate salary range"""
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError("Minimum salary cannot be greater than maximum salary")
        return data


class JobOpeningListSerializer(serializers.ModelSerializer):
    """Simplified Job Opening Serializer for list view"""
    hiring_manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JobOpening
        fields = [
            'id', 'title', 'department', 'location', 'employment_type',
            'experience_level', 'status', 'priority', 'openings',
            'applications_count', 'posted_date', 'hiring_manager_name',
            'is_remote', 'salary_min', 'salary_max', 'salary_currency'
        ]
    
    def get_hiring_manager_name(self, obj):
        return obj.hiring_manager.get_full_name() if obj.hiring_manager else None


class CandidateNoteSerializer(serializers.ModelSerializer):
    """Candidate Note Serializer"""
    added_by_details = UserSerializer(source='added_by', read_only=True)
    
    class Meta:
        model = CandidateNote
        fields = '__all__'
        read_only_fields = ['added_by', 'created_at', 'updated_at']


class ApplicationSerializer(serializers.ModelSerializer):
    """Application Serializer"""
    job_opening_details = JobOpeningListSerializer(source='job_opening', read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class CandidateSerializer(serializers.ModelSerializer):
    """Candidate Serializer"""
    applications_details = ApplicationSerializer(source='applications', many=True, read_only=True)
    notes_details = CandidateNoteSerializer(source='notes', many=True, read_only=True)
    assigned_recruiter_details = UserSerializer(source='assigned_recruiter', read_only=True)
    referred_by_details = UserSerializer(source='referred_by', read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'last_activity_date']
    
    def validate_email(self, value):
        """Validate unique email"""
        if self.instance:
            # Update case
            if Candidate.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("Candidate with this email already exists")
        else:
            # Create case
            if Candidate.objects.filter(email=value).exists():
                raise serializers.ValidationError("Candidate with this email already exists")
        return value


class CandidateListSerializer(serializers.ModelSerializer):
    """Simplified Candidate Serializer for list view"""
    full_name = serializers.ReadOnlyField()
    assigned_recruiter_name = serializers.SerializerMethodField()
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'full_name', 'email', 'phone', 'current_job_title',
            'current_company', 'total_experience_years', 'status',
            'source', 'overall_rating', 'assigned_recruiter_name',
            'applications_count', 'is_starred', 'created_at'
        ]
    
    def get_assigned_recruiter_name(self, obj):
        return obj.assigned_recruiter.get_full_name() if obj.assigned_recruiter else None
    
    def get_applications_count(self, obj):
        return obj.applications.count()


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    """Interview Feedback Serializer"""
    interviewer_details = UserSerializer(source='interviewer', read_only=True)
    
    class Meta:
        model = InterviewFeedback
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InterviewSerializer(serializers.ModelSerializer):
    """Interview Serializer"""
    candidate_details = CandidateListSerializer(source='candidate', read_only=True)
    job_opening_details = JobOpeningListSerializer(source='job_opening', read_only=True)
    feedbacks = InterviewFeedbackSerializer(source='interviewfeedback_set', many=True, read_only=True)
    interviewer_details = UserSerializer(source='interviewers', many=True, read_only=True)
    
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate scheduled date is in future"""
        if data.get('scheduled_date'):
            from django.utils import timezone
            if data['scheduled_date'] < timezone.now():
                raise serializers.ValidationError("Interview cannot be scheduled in the past")
        return data


class InterviewListSerializer(serializers.ModelSerializer):
    """Simplified Interview Serializer for list view"""
    candidate_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    interviewers_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Interview
        fields = [
            'id', 'title', 'candidate_name', 'job_title', 'interview_type',
            'scheduled_date', 'duration_minutes', 'status', 'round_number',
            'interviewers_names', 'meeting_link'
        ]
    
    def get_candidate_name(self, obj):
        return obj.candidate.full_name
    
    def get_job_title(self, obj):
        return obj.job_opening.title
    
    def get_interviewers_names(self, obj):
        return [interviewer.get_full_name() for interviewer in obj.interviewers.all()]


class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard Statistics Serializer"""
    total_jobs = serializers.IntegerField()
    open_jobs = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    new_candidates_this_month = serializers.IntegerField()
    interviews_scheduled = serializers.IntegerField()
    offers_pending = serializers.IntegerField()
    hired_count = serializers.IntegerField()
    
    # Status breakdown
    candidates_by_status = serializers.DictField()
    jobs_by_department = serializers.DictField()
    applications_by_stage = serializers.DictField()
    
    # Metrics
    average_time_to_hire = serializers.FloatField()
    offer_acceptance_rate = serializers.FloatField()
