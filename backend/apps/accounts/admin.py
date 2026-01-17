from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Organization, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience,
    InviteCode, NotificationPreference
)


# ==================== ORGANIZATION ADMIN ====================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_parent', 'parent', 'employee_count', 'is_verified', 'is_active', 'created_at']
    list_filter = ['is_parent', 'is_active', 'is_verified', 'country', 'created_at']
    search_fields = ['name', 'email', 'slug', 'gstin', 'pan']
    readonly_fields = ['slug', 'created_at', 'updated_at', 'verified_at']
    
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'slug', 'email', 'phone', 'website', 'logo')}),
        ('Address', {'fields': ('address', 'city', 'state', 'country', 'pincode')}),
        ('Legal Information', {'fields': ('gstin', 'pan', 'tax_id')}),
        ('Hierarchy', {'fields': ('is_parent', 'parent')}),
        ('Status', {'fields': ('is_active', 'is_verified', 'verified_at')}),
        ('Metadata', {'fields': ('employee_count', 'established_date', 'industry', 'settings')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# ==================== INVITE CODE ADMIN ====================

@admin.register(InviteCode)
class InviteCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'email', 'organization', 'role', 'is_used', 'is_expired_display', 'expires_at', 'created_at']
    list_filter = ['is_used', 'role', 'created_at', 'expires_at']
    search_fields = ['code', 'email', 'organization__name']
    readonly_fields = ['created_at', 'updated_at', 'is_valid', 'is_expired']
    
    fieldsets = (
        ('Invite Details', {'fields': ('code', 'email', 'organization', 'role')}),
        ('Employee Information', {'fields': ('first_name', 'last_name', 'designation', 'department')}),
        ('Status', {'fields': ('is_used', 'used_at', 'used_by', 'expires_at')}),
        ('Computed', {'fields': ('is_valid', 'is_expired'), 'classes': ('collapse',)}),
        ('Communication', {'fields': ('sent_at', 'reminder_sent_at'), 'classes': ('collapse',)}),
    )
    
    def is_expired_display(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red;">Expired</span>')
        return format_html('<span style="color: green;">Valid</span>')
    is_expired_display.short_description = 'Status'


# ==================== DEPARTMENT ADMIN ====================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'parent', 'head', 'is_active', 'employee_count_display']
    list_filter = ['is_active', 'company', 'created_at']
    search_fields = ['name', 'code', 'company__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {'fields': ('company', 'name', 'code', 'description')}),
        ('Hierarchy', {'fields': ('parent', 'head')}),
        ('Contact', {'fields': ('email', 'phone')}),
        ('Budget', {'fields': ('budget', 'cost_center_code')}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    def employee_count_display(self, obj):
        return obj.get_employee_count()
    employee_count_display.short_description = 'Employees'


# ==================== DESIGNATION ADMIN ====================

@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'level', 'job_grade', 'is_managerial', 'is_active']
    list_filter = ['is_active', 'is_managerial', 'level', 'company']
    search_fields = ['name', 'code', 'company__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {'fields': ('company', 'name', 'code', 'description')}),
        ('Level & Grade', {'fields': ('level', 'job_grade', 'is_managerial')}),
        ('Salary Range', {'fields': ('min_salary', 'max_salary')}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# ==================== EMPLOYEE ADMIN ====================

class EmployeeDocumentInline(admin.TabularInline):
    model = EmployeeDocument
    extra = 0
    fields = ['document_type', 'title', 'document_file', 'is_verified']


class EmployeeEducationInline(admin.TabularInline):
    model = EmployeeEducation
    extra = 0
    fields = ['degree', 'institution', 'start_date', 'end_date', 'is_current']


class EmployeeExperienceInline(admin.TabularInline):
    model = EmployeeExperience
    extra = 0
    fields = ['company_name', 'designation', 'start_date', 'end_date', 'is_current']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'company', 'department', 'designation', 'status', 'date_of_joining']
    list_filter = ['status', 'employment_type', 'gender', 'company', 'department', 'designation', 'date_of_joining']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email', 'phone', 'pan_number', 'aadhar_number']
    readonly_fields = ['full_name', 'age', 'tenure_in_days', 'is_on_probation', 'created_at', 'updated_at']
    
    inlines = [EmployeeDocumentInline, EmployeeEducationInline, EmployeeExperienceInline]
    
    fieldsets = (
        ('Basic Information', {'fields': ('user', 'company', 'employee_id', 'first_name', 'middle_name', 'last_name', 'full_name')}),
        ('Organization Details', {'fields': ('department', 'designation', 'reporting_manager')}),
        ('Contact Information', {'fields': ('email', 'personal_email', 'phone', 'alternate_phone')}),
        ('Personal Details', {'fields': ('date_of_birth', 'age', 'gender', 'marital_status', 'blood_group', 'nationality')}),
        ('Current Address', {'fields': ('current_address', 'current_city', 'current_state', 'current_country', 'current_pincode'), 'classes': ('collapse',)}),
        ('Permanent Address', {'fields': ('permanent_address', 'permanent_city', 'permanent_state', 'permanent_country', 'permanent_pincode'), 'classes': ('collapse',)}),
        ('Employment Details', {'fields': ('status', 'employment_type', 'date_of_joining', 'confirmation_date', 'probation_period_months', 'is_on_probation', 'tenure_in_days', 'notice_period_days')}),
        ('Separation Details', {'fields': ('resignation_date', 'last_working_date', 'termination_date', 'termination_reason'), 'classes': ('collapse',)}),
        ('Documents', {'fields': ('profile_photo', 'resume'), 'classes': ('collapse',)}),
        ('Identification', {'fields': ('pan_number', 'aadhar_number', 'passport_number', 'driving_license'), 'classes': ('collapse',)}),
        ('Bank Details', {'fields': ('bank_name', 'bank_account_number', 'bank_ifsc_code', 'bank_branch'), 'classes': ('collapse',)}),
        ('Salary', {'fields': ('current_ctc', 'basic_salary'), 'classes': ('collapse',)}),
        ('Emergency Contact', {'fields': ('emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone'), 'classes': ('collapse',)}),
        ('Additional Information', {'fields': ('is_remote_employee', 'work_location', 'skills', 'highest_qualification', 'notes'), 'classes': ('collapse',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# ==================== NOTIFICATION PREFERENCE ADMIN ====================

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_subscription_expiry', 'email_payment_success', 'sms_critical_alerts']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']