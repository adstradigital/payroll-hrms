from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator, EmailValidator
from django.utils import timezone
from django.db.models import Q
import uuid


class BaseModel(models.Model):
    """Abstract base model with common fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='%(class)s_updated'
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class Company(BaseModel):
    """Company/Organization Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True, validators=[EmailValidator()])
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    gstin = models.CharField(
        max_length=15, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
            message='Invalid GSTIN format'
        )]
    )
    pan = models.CharField(
        max_length=10,
        blank=True,
        validators=[RegexValidator(
            regex=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
            message='Invalid PAN format'
        )]
    )
    
    logo = models.ImageField(upload_to='company/logos/', null=True, blank=True)
    website = models.URLField(blank=True)
    
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Additional fields
    employee_count = models.PositiveIntegerField(default=0)
    established_date = models.DateField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = 'Companies'
        indexes = [
            models.Index(fields=['name', 'is_active']),
            models.Index(fields=['gstin']),
        ]

    def __str__(self):
        return self.name

    def get_active_employees_count(self):
        return self.employee_set.filter(status='active').count()


class Department(BaseModel):
    """Department Model with hierarchical structure"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL, 
        related_name='children'
    )
    
    # Department head
    head = models.ForeignKey(
        'Employee',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='headed_departments'
    )
    
    is_active = models.BooleanField(default=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Budget and cost center
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cost_center_code = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('company', 'code')
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return f"{self.name} ({self.company.name})"

    def get_all_children(self):
        """Get all child departments recursively"""
        children = list(self.children.all())
        for child in list(children):
            children.extend(child.get_all_children())
        return children

    def get_employee_count(self):
        return self.employee_set.filter(status='active').count()


class Designation(BaseModel):
    """Designation/Job Title Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='designations')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    level = models.PositiveIntegerField(default=1, help_text="Hierarchical level in organization")
    
    # Salary range
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Job grade
    job_grade = models.CharField(max_length=20, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_managerial = models.BooleanField(default=False)

    class Meta:
        unique_together = ('company', 'code')
        indexes = [
            models.Index(fields=['company', 'level']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class Employee(BaseModel):
    """Employee Model with comprehensive fields"""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
        ('resigned', 'Resigned'),
    )

    EMPLOYMENT_TYPE = (
        ('permanent', 'Permanent'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
        ('consultant', 'Consultant'),
        ('part_time', 'Part Time'),
    )

    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    )

    MARITAL_STATUS_CHOICES = (
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    )

    BLOOD_GROUP_CHOICES = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relations
    user = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='employee_profile'
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='employees'
    )
    designation = models.ForeignKey(
        Designation, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='employees'
    )
    reporting_manager = models.ForeignKey(
        'self', 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL, 
        related_name='subordinates'
    )

    # Basic Information
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True, db_index=True)
    personal_email = models.EmailField(blank=True, null=True)
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'."
    )
    phone = models.CharField(validators=[phone_regex], max_length=20, blank=True)
    alternate_phone = models.CharField(validators=[phone_regex], max_length=20, blank=True)

    # Personal Details
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    
    # Address
    current_address = models.TextField(blank=True)
    current_city = models.CharField(max_length=100, blank=True)
    current_state = models.CharField(max_length=100, blank=True)
    current_country = models.CharField(max_length=100, blank=True)
    current_pincode = models.CharField(max_length=10, blank=True)
    
    permanent_address = models.TextField(blank=True)
    permanent_city = models.CharField(max_length=100, blank=True)
    permanent_state = models.CharField(max_length=100, blank=True)
    permanent_country = models.CharField(max_length=100, blank=True)
    permanent_pincode = models.CharField(max_length=10, blank=True)

    # Employment Details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE, default='permanent')
    
    date_of_joining = models.DateField(db_index=True)
    confirmation_date = models.DateField(null=True, blank=True)
    probation_period_months = models.PositiveIntegerField(default=6)
    
    resignation_date = models.DateField(null=True, blank=True)
    last_working_date = models.DateField(null=True, blank=True)
    termination_date = models.DateField(null=True, blank=True)
    termination_reason = models.TextField(blank=True)

    # Documents
    profile_photo = models.ImageField(upload_to='employees/photos/', null=True, blank=True)
    resume = models.FileField(upload_to='employees/resumes/', null=True, blank=True)
    
    # Identification
    pan_number = models.CharField(max_length=10, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    passport_number = models.CharField(max_length=20, blank=True)
    driving_license = models.CharField(max_length=20, blank=True)

    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_ifsc_code = models.CharField(max_length=11, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)

    # Salary Information
    current_ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Additional
    notice_period_days = models.PositiveIntegerField(default=30)
    is_remote_employee = models.BooleanField(default=False)
    work_location = models.CharField(max_length=200, blank=True)
    
    # Skills and qualifications
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    highest_qualification = models.CharField(max_length=100, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['department', 'status']),
            models.Index(fields=['designation']),
            models.Index(fields=['reporting_manager']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['email']),
        ]
        ordering = ['-date_of_joining']

    @property
    def full_name(self):
        """Get full name"""
        parts = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(filter(None, parts))

    @property
    def age(self):
        """Calculate age from date of birth"""
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def tenure_in_days(self):
        """Calculate tenure in days"""
        if self.date_of_joining:
            end_date = self.last_working_date or timezone.now().date()
            return (end_date - self.date_of_joining).days
        return 0

    @property
    def is_on_probation(self):
        """Check if employee is on probation"""
        if self.confirmation_date:
            return False
        if self.date_of_joining:
            probation_end = self.date_of_joining + timezone.timedelta(days=30 * self.probation_period_months)
            return timezone.now().date() < probation_end
        return False

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"

    def get_subordinates_count(self):
        """Get count of direct reports"""
        return self.subordinates.filter(status='active').count()

    def get_all_subordinates(self):
        """Get all subordinates recursively"""
        subordinates = list(self.subordinates.filter(status='active'))
        for subordinate in list(subordinates):
            subordinates.extend(subordinate.get_all_subordinates())
        return subordinates


class EmployeeDocument(BaseModel):
    """Employee Documents Model"""
    DOCUMENT_TYPES = (
        ('offer_letter', 'Offer Letter'),
        ('appointment_letter', 'Appointment Letter'),
        ('contract', 'Contract'),
        ('nda', 'NDA'),
        ('resignation', 'Resignation Letter'),
        ('experience_letter', 'Experience Letter'),
        ('certificate', 'Certificate'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=200)
    document_file = models.FileField(upload_to='employees/documents/')
    description = models.TextField(blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'document_type']),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.title}"


class EmployeeEducation(BaseModel):
    """Employee Education History"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='education')
    degree = models.CharField(max_length=200)
    institution = models.CharField(max_length=200)
    field_of_study = models.CharField(max_length=200, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    grade = models.CharField(max_length=50, blank=True)
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ['-end_date', '-start_date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.degree}"


class EmployeeExperience(BaseModel):
    """Employee Work Experience History"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='experience')
    company_name = models.CharField(max_length=200)
    designation = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    responsibilities = models.TextField(blank=True)
    reason_for_leaving = models.TextField(blank=True)

    class Meta:
        ordering = ['-end_date', '-start_date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.company_name}"