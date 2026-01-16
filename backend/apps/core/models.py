from django.db import models
from django.contrib.auth.models import User


class Company(models.Model):
    """Organization/Company model - supports multi-tenant setup"""
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    
    # Indian Tax IDs
    gstin = models.CharField(max_length=15, blank=True, verbose_name='GSTIN')
    pan = models.CharField(max_length=10, blank=True, verbose_name='PAN')
    tan = models.CharField(max_length=10, blank=True, verbose_name='TAN')
    
    # PF/ESI Registration
    pf_registration_number = models.CharField(max_length=50, blank=True)
    esi_registration_number = models.CharField(max_length=50, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    """Department within a company"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'code']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Designation(models.Model):
    """Job title/designation"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='designations')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    level = models.PositiveIntegerField(default=1, help_text='Hierarchy level (1=highest)')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'code']
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Employee(models.Model):
    """Central Employee model - used by all modules"""
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
        ('probation', 'Probation'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
        ('resigned', 'Resigned'),
    ]
    
    # Basic Info
    employee_id = models.CharField(max_length=20, unique=True, help_text='Unique employee code like EMP001')
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')
    
    # Company Relations
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reportees')
    
    # Personal Info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    profile_photo = models.ImageField(upload_to='employee_photos/', blank=True, null=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Employment Details
    date_of_joining = models.DateField()
    date_of_leaving = models.DateField(null=True, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Indian Tax IDs
    pan = models.CharField(max_length=10, blank=True, verbose_name='PAN')
    aadhaar = models.CharField(max_length=12, blank=True, verbose_name='Aadhaar')
    uan = models.CharField(max_length=12, blank=True, verbose_name='UAN (PF)')
    esi_number = models.CharField(max_length=17, blank=True, verbose_name='ESI Number')
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['employee_id']

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class BankDetails(models.Model):
    """Employee bank account details for salary credit"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=100)
    branch = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20)
    ifsc_code = models.CharField(max_length=11, verbose_name='IFSC Code')
    account_type = models.CharField(max_length=20, default='Savings')
    is_primary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Bank Details'

    def __str__(self):
        return f"{self.employee.employee_id} - {self.bank_name} ({self.account_number[-4:]})"

    def save(self, *args, **kwargs):
        # Ensure only one primary account per employee
        if self.is_primary:
            BankDetails.objects.filter(employee=self.employee, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
