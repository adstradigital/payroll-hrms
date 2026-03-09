from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class JobOpening(models.Model):
    """Job Opening Model"""
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('INTERNSHIP', 'Internship'),
        ('TEMPORARY', 'Temporary'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('ENTRY', 'Entry Level'),
        ('MID', 'Mid Level'),
        ('SENIOR', 'Senior Level'),
        ('LEAD', 'Lead'),
        ('MANAGER', 'Manager'),
        ('DIRECTOR', 'Director'),
        ('EXECUTIVE', 'Executive'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('ON_HOLD', 'On Hold'),
        ('CLOSED', 'Closed'),
        ('FILLED', 'Filled'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    DEPARTMENT_CHOICES = [
        ('ENGINEERING', 'Engineering'),
        ('MARKETING', 'Marketing'),
        ('SALES', 'Sales'),
        ('HR', 'HR'),
        ('FINANCE', 'Finance'),
        ('OPERATIONS', 'Operations'),
        ('CUSTOMER_SUPPORT', 'Customer Support'),
        ('PRODUCT', 'Product'),
        ('DESIGN', 'Design'),
        ('OTHER', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    location = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES)
    
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='USD')
    
    description = models.TextField()
    responsibilities = models.JSONField(default=list, blank=True)
    requirements = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    
    openings = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    hiring_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_jobs')
    recruiters = models.ManyToManyField(User, related_name='assigned_jobs', blank=True)
    
    application_deadline = models.DateField(null=True, blank=True)
    target_start_date = models.DateField(null=True, blank=True)
    posted_date = models.DateTimeField(default=timezone.now)
    closed_date = models.DateTimeField(null=True, blank=True)
    
    applications_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    
    is_remote = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-posted_date']
        indexes = [
            models.Index(fields=['status', '-posted_date']),
            models.Index(fields=['department']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.department}"


class Candidate(models.Model):
    """Candidate Model"""
    
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('SCREENING', 'Screening'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview'),
        ('OFFERED', 'Offered'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    SOURCE_CHOICES = [
        ('JOB_PORTAL', 'Job Portal'),
        ('LINKEDIN', 'LinkedIn'),
        ('REFERRAL', 'Referral'),
        ('CAREER_PAGE', 'Career Page'),
        ('DIRECT_APPLICATION', 'Direct Application'),
        ('SOCIAL_MEDIA', 'Social Media'),
        ('RECRUITMENT_AGENCY', 'Recruitment Agency'),
        ('CAMPUS_HIRING', 'Campus Hiring'),
        ('OTHER', 'Other'),
    ]
    
    NOTICE_PERIOD_CHOICES = [
        ('IMMEDIATE', 'Immediate'),
        ('15_DAYS', '15 Days'),
        ('1_MONTH', '1 Month'),
        ('2_MONTHS', '2 Months'),
        ('3_MONTHS', '3 Months'),
        ('SERVING_NOTICE', 'Serving Notice'),
    ]
    
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    
    # Professional Information
    current_job_title = models.CharField(max_length=200, blank=True)
    current_company = models.CharField(max_length=200, blank=True)
    total_experience_years = models.PositiveIntegerField(default=0)
    total_experience_months = models.PositiveIntegerField(default=0)
    
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='USD')
    notice_period = models.CharField(max_length=20, choices=NOTICE_PERIOD_CHOICES, blank=True)
    
    # Skills and Education
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    
    # Documents and Links
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    
    # Application Details
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='DIRECT_APPLICATION')
    referred_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    
    # Ratings
    overall_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    technical_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    culture_fit_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Tags and Flags
    tags = models.JSONField(default=list, blank=True)
    is_blacklisted = models.BooleanField(default=False)
    blacklist_reason = models.TextField(blank=True)
    is_starred = models.BooleanField(default=False)
    
    # Assignment
    assigned_recruiter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_candidates')
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_candidates')
    last_activity_date = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.email}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Application(models.Model):
    """Application Model - Links Candidate to Job Opening"""
    
    STAGE_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SCREENING', 'Screening'),
        ('PHONE_SCREEN', 'Phone Screen'),
        ('TECHNICAL_INTERVIEW', 'Technical Interview'),
        ('HR_INTERVIEW', 'HR Interview'),
        ('MANAGER_INTERVIEW', 'Manager Interview'),
        ('FINAL_ROUND', 'Final Round'),
        ('OFFER', 'Offer'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    OFFER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('NEGOTIATING', 'Negotiating'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='applications')
    job_opening = models.ForeignKey(JobOpening, on_delete=models.CASCADE, related_name='applications')
    
    applied_date = models.DateTimeField(default=timezone.now)
    current_stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default='APPLIED')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Offer Details
    offer_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    offer_joining_date = models.DateField(null=True, blank=True)
    offer_acceptance_status = models.CharField(max_length=20, choices=OFFER_STATUS_CHOICES, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-applied_date']
        unique_together = ['candidate', 'job_opening']
        indexes = [
            models.Index(fields=['job_opening', 'status']),
            models.Index(fields=['candidate', '-applied_date']),
        ]
    
    def __str__(self):
        return f"{self.candidate.full_name} - {self.job_opening.title}"


class Interview(models.Model):
    """Interview Model"""
    
    TYPE_CHOICES = [
        ('PHONE_SCREEN', 'Phone Screen'),
        ('VIDEO', 'Video'),
        ('IN_PERSON', 'In-Person'),
        ('TECHNICAL', 'Technical'),
        ('HR', 'HR'),
        ('BEHAVIORAL', 'Behavioral'),
        ('PANEL', 'Panel'),
        ('CASE_STUDY', 'Case Study'),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
        ('NO_SHOW', 'No Show'),
    ]
    
    RECOMMENDATION_CHOICES = [
        ('STRONG_HIRE', 'Strong Hire'),
        ('HIRE', 'Hire'),
        ('MAYBE', 'Maybe'),
        ('NO_HIRE', 'No Hire'),
        ('STRONG_NO_HIRE', 'Strong No Hire'),
    ]
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interviews')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    job_opening = models.ForeignKey(JobOpening, on_delete=models.CASCADE, related_name='interviews')
    
    title = models.CharField(max_length=200)
    interview_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    round_number = models.PositiveIntegerField(default=1)
    
    scheduled_date = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    location = models.CharField(max_length=300, blank=True)
    meeting_link = models.URLField(blank=True)
    
    interviewers = models.ManyToManyField(User, through='InterviewFeedback', related_name='conducted_interviews')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    # Notes
    preparation_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Cancellation
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_interviews')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Rescheduling
    previous_date = models.DateTimeField(null=True, blank=True)
    rescheduled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rescheduled_interviews')
    reschedule_reason = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_interviews')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['scheduled_date']
        indexes = [
            models.Index(fields=['candidate', 'scheduled_date']),
            models.Index(fields=['status', 'scheduled_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.candidate.full_name} on {self.scheduled_date.strftime('%Y-%m-%d')}"


class InterviewFeedback(models.Model):
    """Interview Feedback Model - Through model for Interview-User relationship"""
    
    RECOMMENDATION_CHOICES = [
        ('STRONG_HIRE', 'Strong Hire'),
        ('HIRE', 'Hire'),
        ('MAYBE', 'Maybe'),
        ('NO_HIRE', 'No Hire'),
        ('STRONG_NO_HIRE', 'Strong No Hire'),
    ]
    
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE)
    interviewer = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=100, blank=True)
    
    overall_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    technical_skills = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    problem_solving = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    culture_fit = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    comments = models.TextField(blank=True)
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES, blank=True)
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['interview', 'interviewer']
    
    def __str__(self):
        return f"Feedback by {self.interviewer.get_full_name()} for {self.interview}"


class CandidateNote(models.Model):
    """Notes on Candidates"""
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    added_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_private = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.candidate.full_name} by {self.added_by.get_full_name()}"
