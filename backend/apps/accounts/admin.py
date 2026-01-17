from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import (
    Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience
)


class BaseModelAdmin(admin.ModelAdmin):
    """Base admin class with common fields"""
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Company)
class CompanyAdmin(BaseModelAdmin):
    list_display = [
        'name', 'email', 'phone', 'city', 'gstin', 
        'is_active', 'is_verified', 'employee_count_display', 'created_at'
    ]
    list_filter = ['is_active', 'is_verified', 'country', 'state', 'created_at']
    search_fields = ['name', 'email', 'phone', 'gstin', 'pan', 'city']
    ordering = ['-created_at']
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'phone', 'website', 'logo')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'pincode')
        }),
        ('Legal Information', {
            'fields': ('gstin', 'pan', 'established_date')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified', 'employee_count')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def employee_count_display(self, obj):
        count = obj.get_active_employees_count()
        url = reverse('admin:hr_employee_changelist') + f'?company__id__exact={obj.id}&status__exact=active'
        return format_html('<a href="{}">{} Active</a>', url, count)
    employee_count_display.short_description = 'Employees'


class DepartmentChildrenInline(admin.TabularInline):
    model = Department
    fk_name = 'parent'
    extra = 0
    fields = ['name', 'code', 'is_active', 'employee_count']
    readonly_fields = ['employee_count']
    show_change_link = True
    
    def employee_count(self, obj):
        if obj.id:
            return obj.get_employee_count()
        return 0


@admin.register(Department)
class DepartmentAdmin(BaseModelAdmin):
    list_display = [
        'name', 'code', 'company', 'parent', 'head_display', 
        'employee_count_display', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'company', 'created_at']
    search_fields = ['name', 'code', 'description', 'company__name']
    ordering = ['company', 'name']
    list_per_page = 25
    autocomplete_fields = ['company', 'parent', 'head']
    inlines = [DepartmentChildrenInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'name', 'code', 'description', 'parent')
        }),
        ('Management', {
            'fields': ('head', 'email', 'phone')
        }),
        ('Financial', {
            'fields': ('budget', 'cost_center_code'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def head_display(self, obj):
        if obj.head:
            url = reverse('admin:hr_employee_change', args=[obj.head.id])
            return format_html('<a href="{}">{}</a>', url, obj.head.full_name)
        return '-'
    head_display.short_description = 'Department Head'
    
    def employee_count_display(self, obj):
        count = obj.get_employee_count()
        url = reverse('admin:hr_employee_changelist') + f'?department__id__exact={obj.id}&status__exact=active'
        return format_html('<a href="{}">{}</a>', url, count)
    employee_count_display.short_description = 'Active Employees'


@admin.register(Designation)
class DesignationAdmin(BaseModelAdmin):
    list_display = [
        'name', 'code', 'company', 'level', 'job_grade', 
        'salary_range_display', 'is_managerial', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'is_managerial', 'company', 'level', 'created_at']
    search_fields = ['name', 'code', 'description', 'company__name']
    ordering = ['company', 'level', 'name']
    list_per_page = 25
    autocomplete_fields = ['company']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'name', 'code', 'description')
        }),
        ('Hierarchy', {
            'fields': ('level', 'job_grade', 'is_managerial')
        }),
        ('Salary Range', {
            'fields': ('min_salary', 'max_salary'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def salary_range_display(self, obj):
        if obj.min_salary and obj.max_salary:
            return f'₹{obj.min_salary:,.0f} - ₹{obj.max_salary:,.0f}'
        elif obj.min_salary:
            return f'₹{obj.min_salary:,.0f}+'
        return '-'
    salary_range_display.short_description = 'Salary Range'


class EmployeeDocumentInline(admin.TabularInline):
    model = EmployeeDocument
    extra = 0
    fields = ['document_type', 'title', 'document_file', 'is_verified', 'issue_date']
    readonly_fields = ['created_at']
    show_change_link = True


class EmployeeEducationInline(admin.TabularInline):
    model = EmployeeEducation
    extra = 0
    fields = ['degree', 'institution', 'field_of_study', 'start_date', 'end_date', 'is_current']
    show_change_link = True


class EmployeeExperienceInline(admin.TabularInline):
    model = EmployeeExperience
    extra = 0
    fields = ['company_name', 'designation', 'start_date', 'end_date', 'is_current']
    show_change_link = True


@admin.register(Employee)
class EmployeeAdmin(BaseModelAdmin):
    list_display = [
        'employee_id', 'full_name_display', 'email', 'phone', 
        'company', 'department', 'designation', 'status', 
        'employment_type', 'date_of_joining', 'photo_display'
    ]
    list_filter = [
        'status', 'employment_type', 'company', 'department', 
        'designation', 'gender', 'is_remote_employee', 'date_of_joining'
    ]
    search_fields = [
        'employee_id', 'first_name', 'middle_name', 'last_name', 
        'email', 'phone', 'pan_number', 'aadhar_number'
    ]
    ordering = ['-date_of_joining']
    list_per_page = 25
    autocomplete_fields = ['company', 'department', 'designation', 'reporting_manager', 'user']
    inlines = [EmployeeDocumentInline, EmployeeEducationInline, EmployeeExperienceInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'employee_id', 'user', 'company', 'department', 
                'designation', 'reporting_manager', 'profile_photo'
            )
        }),
        ('Personal Details', {
            'fields': (
                ('first_name', 'middle_name', 'last_name'),
                ('email', 'personal_email'),
                ('phone', 'alternate_phone'),
                ('date_of_birth', 'gender', 'blood_group'),
                ('marital_status', 'nationality')
            )
        }),
        ('Current Address', {
            'fields': (
                'current_address', 
                ('current_city', 'current_state'),
                ('current_country', 'current_pincode')
            ),
            'classes': ('collapse',)
        }),
        ('Permanent Address', {
            'fields': (
                'permanent_address', 
                ('permanent_city', 'permanent_state'),
                ('permanent_country', 'permanent_pincode')
            ),
            'classes': ('collapse',)
        }),
        ('Employment Details', {
            'fields': (
                ('status', 'employment_type'),
                'date_of_joining', 
                ('confirmation_date', 'probation_period_months'),
                ('resignation_date', 'last_working_date'),
                ('termination_date', 'termination_reason'),
                ('is_remote_employee', 'work_location'),
                'notice_period_days'
            )
        }),
        ('Identification', {
            'fields': (
                ('pan_number', 'aadhar_number'),
                ('passport_number', 'driving_license')
            ),
            'classes': ('collapse',)
        }),
        ('Bank Details', {
            'fields': (
                'bank_name',
                ('bank_account_number', 'bank_ifsc_code'),
                'bank_branch'
            ),
            'classes': ('collapse',)
        }),
        ('Salary Information', {
            'fields': (
                ('current_ctc', 'basic_salary'),
            ),
            'classes': ('collapse',)
        }),
        ('Emergency Contact', {
            'fields': (
                'emergency_contact_name',
                ('emergency_contact_relation', 'emergency_contact_phone')
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': (
                'skills', 'highest_qualification', 'resume', 'notes'
            ),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def full_name_display(self, obj):
        url = reverse('admin:hr_employee_change', args=[obj.id])
        return format_html('<a href="{}">{}</a>', url, obj.full_name)
    full_name_display.short_description = 'Name'
    
    def photo_display(self, obj):
        if obj.profile_photo:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius: 50%;" />',
                obj.profile_photo.url
            )
        return '-'
    photo_display.short_description = 'Photo'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('company', 'department', 'designation', 'reporting_manager')


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(BaseModelAdmin):
    list_display = [
        'employee', 'document_type', 'title', 'issue_date', 
        'expiry_date', 'is_verified', 'created_at'
    ]
    list_filter = ['document_type', 'is_verified', 'created_at', 'issue_date']
    search_fields = ['title', 'description', 'employee__first_name', 'employee__last_name', 'employee__employee_id']
    ordering = ['-created_at']
    autocomplete_fields = ['employee']
    date_hierarchy = 'issue_date'
    
    fieldsets = (
        ('Document Information', {
            'fields': ('employee', 'document_type', 'title', 'description', 'document_file')
        }),
        ('Dates', {
            'fields': ('issue_date', 'expiry_date', 'is_verified')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeEducation)
class EmployeeEducationAdmin(BaseModelAdmin):
    list_display = [
        'employee', 'degree', 'institution', 'field_of_study', 
        'start_date', 'end_date', 'grade', 'is_current'
    ]
    list_filter = ['is_current', 'start_date', 'end_date']
    search_fields = [
        'degree', 'institution', 'field_of_study', 
        'employee__first_name', 'employee__last_name', 'employee__employee_id'
    ]
    ordering = ['-end_date', '-start_date']
    autocomplete_fields = ['employee']
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Education Information', {
            'fields': (
                'employee', 'degree', 'institution', 
                'field_of_study', 'grade', 'is_current'
            )
        }),
        ('Duration', {
            'fields': ('start_date', 'end_date')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeExperience)
class EmployeeExperienceAdmin(BaseModelAdmin):
    list_display = [
        'employee', 'company_name', 'designation', 
        'start_date', 'end_date', 'is_current'
    ]
    list_filter = ['is_current', 'start_date', 'end_date']
    search_fields = [
        'company_name', 'designation', 
        'employee__first_name', 'employee__last_name', 'employee__employee_id'
    ]
    ordering = ['-end_date', '-start_date']
    autocomplete_fields = ['employee']
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Experience Information', {
            'fields': (
                'employee', 'company_name', 'designation', 
                'is_current', 'responsibilities', 'reason_for_leaving'
            )
        }),
        ('Duration', {
            'fields': ('start_date', 'end_date')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


# Customize admin site headers
admin.site.site_header = "HR Management System"
admin.site.site_title = "HR Admin Portal"
admin.site.index_title = "Welcome to HR Management System"