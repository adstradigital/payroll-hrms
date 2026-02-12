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


# ==================== ORGANIZATION MODEL ====================

class Organization(BaseModel):
    """Organization/Company - Can be parent or subsidiary"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, db_index=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    
    # Contact
    email = models.EmailField(blank=True, null=True, validators=[EmailValidator()])
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone format: '+999999999'. Up to 15 digits."
    )
    phone = models.CharField(validators=[phone_regex], max_length=20, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Legal
    gstin = models.CharField(max_length=15, blank=True)
    pan = models.CharField(max_length=10, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    # Branding
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    website = models.URLField(blank=True)
    
    # Hierarchy
    is_parent = models.BooleanField(default=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subsidiaries'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    employee_count = models.PositiveIntegerField(default=0)
    established_date = models.DateField(null=True, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    
    # Settings
    settings = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name_plural = 'Organizations'
        indexes = [
            models.Index(fields=['name', 'is_active']),
            models.Index(fields=['parent', 'is_active']),
        ]
        unique_together = [('parent', 'name')]

    def __str__(self):
        return self.name
    
    def get_all_subsidiaries(self):
        """Get all subsidiaries recursively"""
        subs = list(self.subsidiaries.filter(is_active=True))
        for sub in list(subs):
            subs.extend(sub.get_all_subsidiaries())
        return subs
    
    def get_root_parent(self):
        """Get the root/main parent organization"""
        if self.parent:
            return self.parent.get_root_parent()
        return self
    
    def get_active_employees_count(self):
        return self.employees.filter(status='active').count()


# ==================== COMPANY MODEL (Alias to Organization) ====================

class Company(Organization):
    """Proxy model for Organization - for backward compatibility"""
    class Meta:
        proxy = True
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'


# ==================== DEPARTMENT MODEL ====================

class Department(BaseModel):
    """Department Model with hierarchical structure"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
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
        return self.employees.filter(status='active').count()


# ==================== DESIGNATION MODEL ====================

class Designation(BaseModel):
    """Designation/Job Title Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='designations')
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
    
    # Permission roles associated with this designation (legacy - for role-based)
    roles = models.ManyToManyField(
        'Role', 
        blank=True, 
        related_name='designations',
        help_text="Roles automatically granted to employees with this designation"
    )
    
    # Direct permissions for this designation (simplified - designation IS the role)
    permissions = models.ManyToManyField(
        'Permission',
        through='DesignationPermission',
        blank=True,
        related_name='designations',
        help_text="Permissions directly assigned to this designation"
    )

    class Meta:
        unique_together = ('company', 'code')
        indexes = [
            models.Index(fields=['company', 'level']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


# ==================== EMPLOYEE MODEL ====================

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
        on_delete=models.CASCADE,
        null=True, 
        blank=True,
        related_name='employee_profile'
    )
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='employees')
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
    biometric_id = models.CharField(max_length=50, blank=True, null=True, unique=True, db_index=True, help_text="ID as registered in Biometric Device")
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
    is_admin = models.BooleanField(default=False, help_text="Designates whether the user has administrative access")
    
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
    uan_number = models.CharField(max_length=12, blank=True, null=True, verbose_name="UAN Number")
    esi_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="ESI Number")

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
            from datetime import timedelta
            probation_end = self.date_of_joining + timedelta(days=30 * self.probation_period_months)
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


# ==================== EMPLOYEE DOCUMENT MODEL ====================

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


# ==================== EMPLOYEE EDUCATION MODEL ====================

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


# ==================== EMPLOYEE EXPERIENCE MODEL ====================

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


# ==================== INVITE CODE MODEL ====================

class InviteCode(BaseModel):
    """Employee invitation codes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(db_index=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invite_codes'
    )
    
    # Employee details (if known)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    
    # Status
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_invites'
    )
    
    # Expiry
    expires_at = models.DateTimeField()
    
    # Invite type
    role = models.CharField(
        max_length=50,
        default='employee',
        help_text="admin, manager, employee, etc."
    )
    
    # Metadata
    sent_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['code', 'is_used']),
            models.Index(fields=['email', 'organization']),
            models.Index(fields=['expires_at', 'is_used']),
        ]
        
    def __str__(self):
        return f"{self.code} - {self.email}"
    
    @property
    def is_expired(self):
        """Check if invite code is expired"""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if invite code is valid"""
        return not self.is_used and not self.is_expired


class NotificationPreference(BaseModel):
    """User notification preferences"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email notifications
    email_subscription_expiry = models.BooleanField(default=True)
    email_payment_success = models.BooleanField(default=True)
    email_payment_failed = models.BooleanField(default=True)
    email_feature_updates = models.BooleanField(default=True)
    email_weekly_reports = models.BooleanField(default=False)
    
    # In-app notifications
    inapp_subscription_alerts = models.BooleanField(default=True)
    inapp_payment_alerts = models.BooleanField(default=True)
    inapp_system_updates = models.BooleanField(default=True)
    
    # SMS notifications
    sms_payment_alerts = models.BooleanField(default=False)
    sms_critical_alerts = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = 'Notification Preferences'
        
    def __str__(self):
        return f"Preferences for {self.user.email}"


# ==================== PERMISSION MODELS ====================

class Module(BaseModel):
    """Business modules/domains in the HRMS"""
    MODULE_CHOICES = (
        ('core', 'Core Management'),
        ('employee', 'Employee Management'),
        ('attendance', 'Attendance & Time Tracking'),
        ('leave', 'Leave Management'),
        ('shift', 'Shift Management'),
        ('payroll', 'Payroll'),
        ('recruitment', 'Recruitment'),
        ('performance', 'Performance Management'),
        ('training', 'Training & Development'),
        ('assets', 'Asset Management'),
        ('documents', 'Document Management'),
        ('reports', 'Reports & Analytics'),
        ('settings', 'System Settings'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True, choices=MODULE_CHOICES)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class name")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['sort_order', 'name']
        
    def __str__(self):
        return self.name


class Permission(BaseModel):
    """Granular permissions within modules"""
    ACTION_CHOICES = (
        ('view', 'View/Read'),
        ('create', 'Create'),
        ('edit', 'Edit/Update'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('process', 'Process'),
        ('manage', 'Full Management'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='permissions')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True, db_index=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    
    # System permission - cannot be deleted
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['module', 'action', 'name']
        unique_together = ['module', 'code']
        indexes = [
            models.Index(fields=['module', 'is_active']),
            models.Index(fields=['code']),
        ]
        
    def __str__(self):
        return f"{self.module.name} - {self.name}"


class DataScope(BaseModel):
    """Define data access scope for permissions"""
    SCOPE_CHOICES = (
        ('self', 'Self Only'),
        ('team', 'Team/Subordinates'),
        ('department', 'Department'),
        ('branch', 'Branch/Location'),
        ('company', 'Company'),
        ('organization', 'Organization (All Companies)'),
        ('global', 'Global/All'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True, choices=SCOPE_CHOICES)
    description = models.TextField(blank=True)
    level = models.PositiveIntegerField(
        help_text="Hierarchy level: 1=Self, 2=Team, 3=Department, etc."
    )
    
    class Meta:
        ordering = ['level']
        
    def __str__(self):
        return self.name


class Role(BaseModel):
    """Roles that group permissions together"""
    ROLE_TYPE_CHOICES = (
        ('system', 'System Role'),
        ('custom', 'Custom Role'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        related_name='roles',
        null=True,
        blank=True,
        help_text="Null for system-wide roles"
    )
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    role_type = models.CharField(max_length=20, choices=ROLE_TYPE_CHOICES, default='custom')
    
    # Default scope for this role
    default_scope = models.ForeignKey(
        DataScope,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roles'
    )
    
    # Many-to-many with permissions
    permissions = models.ManyToManyField(
        Permission,
        through='RolePermission',
        related_name='roles'
    )
    
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False, help_text="System roles cannot be deleted")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_roles'
    )
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['code']),
        ]
        unique_together = [('organization', 'code')]
        
    def __str__(self):
        return self.name
    
    def clean(self):
        from django.core.exceptions import ValidationError
        # System roles must not have organization
        if self.role_type == 'system' and self.organization:
            raise ValidationError("System roles cannot be organization-specific")
        # Custom roles must have organization
        if self.role_type == 'custom' and not self.organization:
            raise ValidationError("Custom roles must be organization-specific")


class RolePermission(models.Model):
    """Through model for Role-Permission with custom scope"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    # Override scope for this specific permission in this role
    scope = models.ForeignKey(
        DataScope,
        on_delete=models.CASCADE,
        help_text="Data access scope for this permission"
    )
    
    # Additional conditions (JSON)
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional conditions: {'status': 'active', 'employment_type': 'permanent'}"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['role', 'permission']
        indexes = [
            models.Index(fields=['role', 'permission']),
        ]
        
    def __str__(self):
        return f"{self.role.name} - {self.permission.name} ({self.scope.name})"


class DesignationPermission(models.Model):
    """Through model for Designation-Permission (Designation IS the role)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    designation = models.ForeignKey('Designation', on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    # Data access scope for this permission
    scope = models.ForeignKey(
        DataScope,
        on_delete=models.CASCADE,
        help_text="Data access scope for this permission"
    )
    
    # Additional conditions (JSON)
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional conditions for this permission"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['designation', 'permission']
        indexes = [
            models.Index(fields=['designation', 'permission']),
        ]
        
    def __str__(self):
        return f"{self.designation.name} - {self.permission.name} ({self.scope.name})"

class UserRole(models.Model):
    """Assign roles to users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_assignments')
    
    # Optional: Override scope for specific user-role assignment
    scope_override = models.ForeignKey(
        DataScope,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Override default role scope for this user"
    )
    
    # Context - where this role applies
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='user_role_assignments'
    )
    department = models.ForeignKey(
        'Department',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='user_role_assignments',
        help_text="Role applies to this department only"
    )
    
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_roles'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['organization', 'is_active']),
        ]
        unique_together = [('user', 'role', 'organization', 'department')]
        
    def __str__(self):
        return f"{self.user.email} - {self.role.name}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        # If department is set, organization must be set
        if self.department and not self.organization:
            raise ValidationError("Organization must be set when department is specified")
        
        # If department is set, it must belong to the organization
        if self.department and self.organization:
            if self.department.company_id != self.organization.id:
                raise ValidationError("Department must belong to the specified organization")


class UserPermission(models.Model):
    """Direct permission assignment to users (rare, for exceptions)"""
    GRANT_TYPE_CHOICES = (
        ('grant', 'Grant'),
        ('revoke', 'Revoke'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='direct_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    grant_type = models.CharField(
        max_length=10,
        choices=GRANT_TYPE_CHOICES,
        default='grant',
        help_text="Grant gives permission, Revoke removes it even if role has it"
    )
    
    scope = models.ForeignKey(DataScope, on_delete=models.CASCADE)
    
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    reason = models.TextField(blank=True, help_text="Why this direct permission?")
    
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_permissions'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['permission', 'grant_type']),
        ]
        unique_together = [('user', 'permission', 'organization')]
        
    def __str__(self):
        return f"{self.user.email} - {self.permission.name} ({self.grant_type})"


# ==================== AUDIT LOG ====================

class PermissionAuditLog(models.Model):
    """Track permission checks and changes"""
    ACTION_CHOICES = (
        ('check', 'Permission Check'),
        ('grant', 'Permission Granted'),
        ('revoke', 'Permission Revoked'),
        ('role_assign', 'Role Assigned'),
        ('role_remove', 'Role Removed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permission_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    permission = models.ForeignKey(
        Permission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    result = models.BooleanField(help_text="True if allowed, False if denied")
    scope_used = models.CharField(max_length=50, blank=True)
    
    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['permission', 'result']),
            models.Index(fields=['action', 'created_at']),
        ]
        
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.result}"


# ==================== ORGANIZATION REGISTRATION MODEL ====================

class OrganizationRegistration(BaseModel):
    """Pending organization registrations awaiting super admin approval"""
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Organization Details
    organization_name = models.CharField(max_length=150)
    domain = models.CharField(max_length=100, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    employee_scale = models.CharField(max_length=50, default='1-50')
    
    # Admin Details
    admin_name = models.CharField(max_length=200)
    admin_email = models.EmailField()
    admin_phone = models.CharField(max_length=20, blank=True)
    
    # Multi-company support
    is_multi_company = models.BooleanField(default=False)
    subsidiaries = models.JSONField(default=list, blank=True)
    
    # Plan
    plan = models.CharField(max_length=50, default='pro')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    # Approval Details
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_registrations'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Created Organization (after approval)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registration'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['admin_email']),
        ]
    
    def __str__(self):
        return f"{self.organization_name} - {self.status}"

class SecurityProfile(BaseModel):
    """User security profile for PIN and clearance levels"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='security_profile'
    )
    
    # Secure PIN (stored hashed for security)
    # Using a string to store the hashed value
    pin_hash = models.CharField(max_length=255, blank=True, null=True)
    is_pin_enabled = models.BooleanField(default=False)
    
    # Clearance Level for sensitive tasks
    # 1: Basic, 2: Standard, 3: High, 4: Critical
    CLEARANCE_LEVELS = (
        (1, 'Level 1 - Basic'),
        (2, 'Level 2 - Standard'),
        (3, 'Level 3 - High'),
        (4, 'Level 4 - Critical'),
    )
    clearance_level = models.PositiveSmallIntegerField(
        choices=CLEARANCE_LEVELS,
        default=1
    )
    
    last_pin_change = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Security Profile'
        verbose_name_plural = 'Security Profiles'
        
    def __str__(self):
        return f"Security Profile for {self.user.username}"

    def set_pin(self, raw_pin):
        """Hashes the pin before saving (simple hashing for 4 digits)"""
        from django.contrib.auth.hashers import make_password
        self.pin_hash = make_password(raw_pin)
        self.last_pin_change = timezone.now()
        self.save()

    def check_pin(self, raw_pin):
        """Check if the provided PIN is correct"""
        from django.contrib.auth.hashers import check_password
        if not self.pin_hash:
            return False
        
        # Check lock status
        if self.locked_until and self.locked_until > timezone.now():
            return False
            
        is_correct = check_password(raw_pin, self.pin_hash)
        
        if is_correct:
            self.failed_attempts = 0
            self.locked_until = None
        else:
            self.failed_attempts += 1
            if self.failed_attempts >= 5:
                # Lock for 15 minutes after 5 failures
                self.locked_until = timezone.now() + timezone.timedelta(minutes=15)
        
        self.save()
        return is_correct
