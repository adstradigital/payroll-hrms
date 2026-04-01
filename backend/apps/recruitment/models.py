from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


DEFAULT_RECRUITMENT_STAGES = [
    {"name": "Applied", "sequence": 1, "is_system": True},
    {"name": "Screening", "sequence": 2, "is_system": False},
    {"name": "Technical Interview", "sequence": 3, "is_system": False},
    {"name": "Cultural Fit Round", "sequence": 4, "is_system": False},
    {"name": "Offer", "sequence": 5, "is_system": True},
    {"name": "Hired", "sequence": 6, "is_system": True},
    {"name": "Rejected", "sequence": 7, "is_system": True},
]

DEFAULT_SKILL_CATEGORIES = [
    {"name": "Development", "description": "Technical and engineering skills used for software and product roles."},
    {"name": "Design", "description": "Product, visual, and interaction design skills used in creative roles."},
    {"name": "Soft Skills", "description": "Communication, leadership, and behavioral skills used across roles."},
]


class RecruitmentJobSetting(models.Model):
    """
    Singleton settings for recruitment job posting defaults.

    Enforced as a singleton by pinning the primary key to 1.
    """

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)

    JOB_TYPE_CHOICES = [
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('INTERNSHIP', 'Internship'),
    ]

    EXPERIENCE_CHOICES = [
        ('FRESHER', 'Fresher'),
        ('ONE_TO_THREE', '1-3 Years'),
        ('THREE_TO_FIVE', '3-5 Years'),
        ('FIVE_PLUS', '5+ Years'),
    ]

    CANDIDATE_SOURCE_CHOICES = [
        ('LINKEDIN', 'LinkedIn'),
        ('COMPANY_WEBSITE', 'Company Website'),
        ('REFERRAL', 'Referral'),
        ('INDEED', 'Indeed'),
        ('NAUKRI', 'Naukri'),
    ]

    default_job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='FULL_TIME')
    default_experience = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='FRESHER')

    allow_remote = models.BooleanField(default=False)
    default_expiry_days = models.PositiveIntegerField(default=30)
    default_vacancies = models.PositiveIntegerField(default=1)
    auto_close_job = models.BooleanField(default=True)
    allow_multiple_locations = models.BooleanField(default=False)

    candidate_sources = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Recruitment Job Posting Setting'
        verbose_name_plural = 'Recruitment Job Posting Settings'

    def save(self, *args, **kwargs):
        # Hard-enforce singleton semantics even if someone tries to create another row.
        self.id = 1
        return super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, _created = cls.objects.get_or_create(pk=1)
        return obj


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
        ('IT', 'IT'),
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
    required_skills = models.ManyToManyField('Skill', blank=True, related_name='job_openings')
    benefits = models.JSONField(default=list, blank=True)
    experience_required = models.CharField(max_length=50, blank=True, default='')
    
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


class RecruitmentStage(models.Model):
    name = models.CharField(max_length=100, unique=True)
    sequence = models.IntegerField(unique=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sequence"]

    def __str__(self):
        return self.name


def ensure_default_recruitment_stages():
    if RecruitmentStage.objects.exists():
        return

    RecruitmentStage.objects.bulk_create(
        [
            RecruitmentStage(
                name=stage["name"],
                sequence=stage["sequence"],
                is_system=stage["is_system"],
            )
            for stage in DEFAULT_RECRUITMENT_STAGES
        ]
    )


class SkillCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name='skills')
    description = models.TextField(blank=True, null=True)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'category']

    def __str__(self):
        return self.name


def ensure_default_skill_categories():
    for category in DEFAULT_SKILL_CATEGORIES:
        SkillCategory.objects.get_or_create(
            name=category['name'],
            defaults={'description': category['description']},
        )


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
    candidate_skills = models.ManyToManyField('Skill', blank=True, related_name='candidate_profiles')
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
    job_applied = models.ForeignKey(
        JobOpening,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidates',
    )
    experience = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True)
    applied_date = models.DateTimeField(default=timezone.now)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    stage = models.ForeignKey(
        RecruitmentStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidates'
    )
    
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
        ('APPLIED', 'Applied'),
        ('SCREENING', 'Screening'),
        ('INTERVIEW', 'Interview'),
        ('OFFER', 'Offer'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
        ('ACTIVE', 'Active'),
        ('WITHDRAWN', 'Withdrawn'),
        ('ON_HOLD', 'On Hold'),
    ]

    SOURCE_CHOICES = [
        ('LINKEDIN', 'LinkedIn'),
        ('WEBSITE', 'Website'),
        ('REFERRAL', 'Referral'),
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
    stage = models.ForeignKey(
        RecruitmentStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications_in_stage'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='WEBSITE')
    
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
        ('MANAGERIAL', 'Managerial'),
        ('FINAL', 'Final'),
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

    MODE_CHOICES = [
        ('ONLINE', 'Online'),
        ('IN_PERSON', 'In-Person'),
    ]

    RESULT_CHOICES = [
        ('PENDING', 'Pending'),
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
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

    interviewer_name = models.CharField(max_length=150, blank=True, default='')
    interview_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='ONLINE')
    location_or_link = models.CharField(max_length=255, blank=True, null=True)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='PENDING')
    feedback = models.TextField(blank=True, null=True)
    
    interviewers = models.ManyToManyField(
        User,
        through='InterviewFeedback',
        related_name='conducted_interviews',
        blank=True,
    )
    
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


class InterviewTemplate(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class InterviewQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('RATING', 'Rating (1-5)'),
        ('TEXT', 'Text'),
        ('YES_NO', 'Yes/No'),
        ('DROPDOWN', 'Dropdown'),
    ]

    template = models.ForeignKey(InterviewTemplate, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='TEXT')
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order', 'id']
        unique_together = ['template', 'order']
        indexes = [
            models.Index(fields=['template', 'order']),
        ]

    def __str__(self):
        return f"{self.template.name} - Q{self.order}"


class CandidateNote(models.Model):
    """Notes on Candidates"""
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='note_entries')
    content = models.TextField()
    added_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_private = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.candidate.full_name} by {self.added_by.get_full_name()}"


class Survey(models.Model):
    """Recruitment Survey for candidates and interviewers"""

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.title


class SurveyQuestion(models.Model):
    """Questions belonging to a survey"""

    QUESTION_TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('RATING', 'Rating'),
        ('YES_NO', 'Yes/No'),
        ('MULTIPLE_CHOICE', 'Multiple Choice'),
    ]

    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='TEXT')
    options = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['survey']),
        ]

    def __str__(self):
        return f"{self.survey.title} - {self.question_text[:40]}"


class SurveyResponse(models.Model):
    """Response submission for a survey"""

    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='survey_responses'
    )
    interviewer_name = models.CharField(max_length=255, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['survey']),
            models.Index(fields=['candidate']),
        ]

    def __str__(self):
        return f"Response for {self.survey.title} at {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"


class SurveyAnswer(models.Model):
    """Answers to survey questions"""

    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['response']),
            models.Index(fields=['question']),
        ]

    def __str__(self):
        return f"Answer to '{self.question.question_text[:25]}'"


class RejectionReason(models.Model):
    """Standardized reasons for candidate rejection"""
    reason_text = models.CharField(max_length=200, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['reason_text']

    def __str__(self):
        return self.reason_text

