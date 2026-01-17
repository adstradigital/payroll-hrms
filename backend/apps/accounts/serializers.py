from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Organization, Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience,
    InviteCode, NotificationPreference
)


# ==================== USER SERIALIZERS ====================

class UserSerializer(serializers.ModelSerializer):
    """User Serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


# ==================== ORGANIZATION SERIALIZERS ====================

class OrganizationListSerializer(serializers.ModelSerializer):
    """Organization List Serializer - minimal fields"""
    active_employees = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'email', 'phone', 'city', 'country',
            'is_parent', 'is_active', 'is_verified', 'employee_count',
            'active_employees', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'active_employees', 'created_at']
    
    def get_active_employees(self, obj):
        return obj.get_active_employees_count()


class OrganizationDetailSerializer(serializers.ModelSerializer):
    """Organization Detail Serializer - all fields"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    active_employees = serializers.SerializerMethodField()
    total_departments = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'email', 'phone', 'address', 'city',
            'state', 'country', 'pincode', 'gstin', 'pan', 'tax_id',
            'logo', 'website', 'is_parent', 'parent', 'parent_name',
            'is_active', 'is_verified', 'verified_at', 'employee_count',
            'active_employees', 'total_departments', 'established_date',
            'industry', 'settings', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'slug', 'verified_at', 'active_employees', 'total_departments',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
    
    def get_active_employees(self, obj):
        return obj.get_active_employees_count()
    
    def get_total_departments(self, obj):
        return obj.departments.filter(is_active=True).count()


class OrganizationWithSubsidiariesSerializer(OrganizationDetailSerializer):
    """Organization with subsidiaries list"""
    subsidiaries = OrganizationListSerializer(many=True, read_only=True)
    
    class Meta(OrganizationDetailSerializer.Meta):
        fields = OrganizationDetailSerializer.Meta.fields + ['subsidiaries']


# ==================== COMPANY SERIALIZERS (Backward Compatibility) ====================

class CompanyListSerializer(OrganizationListSerializer):
    """Company List Serializer - alias for OrganizationListSerializer"""
    pass


class CompanyDetailSerializer(OrganizationDetailSerializer):
    """Company Detail Serializer - alias for OrganizationDetailSerializer"""
    pass


# ==================== DEPARTMENT SERIALIZERS ====================

class DepartmentListSerializer(serializers.ModelSerializer):
    """Department List Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'company', 'company_name', 'name', 'code',
            'parent', 'parent_name', 'is_active', 'employee_count'
        ]
        read_only_fields = ['id', 'company_name', 'parent_name', 'employee_count']
    
    def get_employee_count(self, obj):
        return obj.get_employee_count()


class DepartmentDetailSerializer(serializers.ModelSerializer):
    """Department Detail Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    head_name = serializers.CharField(source='head.full_name', read_only=True)
    children = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Department
        fields = [
            'id', 'company', 'company_name', 'name', 'code', 'description',
            'parent', 'parent_name', 'head', 'head_name', 'is_active',
            'email', 'phone', 'budget', 'cost_center_code', 'children',
            'employee_count', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'company_name', 'parent_name', 'head_name', 'children',
            'employee_count', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return DepartmentListSerializer(children, many=True).data
    
    def get_employee_count(self, obj):
        return obj.get_employee_count()


# ==================== DESIGNATION SERIALIZERS ====================

class DesignationListSerializer(serializers.ModelSerializer):
    """Designation List Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Designation
        fields = [
            'id', 'company', 'company_name', 'name', 'code',
            'level', 'job_grade', 'is_active', 'employee_count'
        ]
        read_only_fields = ['id', 'company_name', 'employee_count']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class DesignationDetailSerializer(serializers.ModelSerializer):
    """Designation Detail Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Designation
        fields = [
            'id', 'company', 'company_name', 'name', 'code', 'description',
            'level', 'min_salary', 'max_salary', 'job_grade', 'is_active',
            'is_managerial', 'employee_count', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'company_name', 'employee_count', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]
    
    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


# ==================== EMPLOYEE SERIALIZERS ====================

class EmployeeListSerializer(serializers.ModelSerializer):
    """Employee List Serializer - minimal fields"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'company', 'company_name', 'department',
            'department_name', 'designation', 'designation_name', 'status',
            'employment_type', 'date_of_joining', 'profile_photo'
        ]
        read_only_fields = [
            'id', 'full_name', 'company_name', 'department_name', 'designation_name'
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Employee Detail Serializer - all fields"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    reporting_manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    tenure_in_days = serializers.IntegerField(read_only=True)
    is_on_probation = serializers.BooleanField(read_only=True)
    subordinates_count = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'company', 'company_name', 'department', 'department_name',
            'designation', 'designation_name', 'reporting_manager', 'reporting_manager_name',
            'employee_id', 'first_name', 'middle_name', 'last_name', 'full_name',
            'email', 'personal_email', 'phone', 'alternate_phone', 'date_of_birth',
            'age', 'gender', 'marital_status', 'blood_group', 'nationality',
            'current_address', 'current_city', 'current_state', 'current_country',
            'current_pincode', 'permanent_address', 'permanent_city', 'permanent_state',
            'permanent_country', 'permanent_pincode', 'status', 'employment_type',
            'date_of_joining', 'confirmation_date', 'probation_period_months',
            'is_on_probation', 'resignation_date', 'last_working_date',
            'termination_date', 'termination_reason', 'profile_photo', 'resume',
            'pan_number', 'aadhar_number', 'passport_number', 'driving_license',
            'bank_name', 'bank_account_number', 'bank_ifsc_code', 'bank_branch',
            'current_ctc', 'basic_salary', 'emergency_contact_name',
            'emergency_contact_relation', 'emergency_contact_phone',
            'notice_period_days', 'is_remote_employee', 'work_location',
            'skills', 'highest_qualification', 'notes', 'tenure_in_days',
            'subordinates_count', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'full_name', 'age', 'tenure_in_days', 'is_on_probation',
            'company_name', 'department_name', 'designation_name',
            'reporting_manager_name', 'subordinates_count',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
    
    def get_subordinates_count(self, obj):
        return obj.get_subordinates_count()


# ==================== EMPLOYEE DOCUMENT SERIALIZERS ====================

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Employee Document Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'employee', 'employee_name', 'document_type', 'title',
            'document_file', 'description', 'issue_date', 'expiry_date',
            'is_verified', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'employee_name', 'created_at', 'updated_at',
                          'created_by', 'updated_by']


# ==================== EMPLOYEE EDUCATION SERIALIZERS ====================

class EmployeeEducationSerializer(serializers.ModelSerializer):
    """Employee Education Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = EmployeeEducation
        fields = [
            'id', 'employee', 'employee_name', 'degree', 'institution',
            'field_of_study', 'start_date', 'end_date', 'grade', 'is_current',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'employee_name', 'created_at', 'updated_at',
                          'created_by', 'updated_by']


# ==================== EMPLOYEE EXPERIENCE SERIALIZERS ====================

class EmployeeExperienceSerializer(serializers.ModelSerializer):
    """Employee Experience Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = EmployeeExperience
        fields = [
            'id', 'employee', 'employee_name', 'company_name', 'designation',
            'start_date', 'end_date', 'is_current', 'responsibilities',
            'reason_for_leaving', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'employee_name', 'created_at', 'updated_at',
                          'created_by', 'updated_by']


# ==================== EMPLOYEE WITH RELATIONS SERIALIZER ====================

class EmployeeWithRelationsSerializer(EmployeeDetailSerializer):
    """Employee with related documents, education, and experience"""
    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    education = EmployeeEducationSerializer(many=True, read_only=True)
    experience = EmployeeExperienceSerializer(many=True, read_only=True)
    
    class Meta(EmployeeDetailSerializer.Meta):
        fields = EmployeeDetailSerializer.Meta.fields + ['documents', 'education', 'experience']


# ==================== INVITE CODE SERIALIZERS ====================

class InviteCodeListSerializer(serializers.ModelSerializer):
    """Invite Code List Serializer"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InviteCode
        fields = [
            'id', 'code', 'email', 'organization', 'organization_name',
            'first_name', 'last_name', 'role', 'is_used', 'is_valid',
            'is_expired', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'organization_name', 'is_valid',
                          'is_expired', 'is_used', 'created_at']


class InviteCodeDetailSerializer(serializers.ModelSerializer):
    """Invite Code Detail Serializer"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    used_by_email = serializers.EmailField(source='used_by.email', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = InviteCode
        fields = [
            'id', 'code', 'email', 'organization', 'organization_name',
            'first_name', 'last_name', 'designation', 'department',
            'is_used', 'used_at', 'used_by', 'used_by_email',
            'expires_at', 'role', 'sent_at', 'reminder_sent_at',
            'is_valid', 'is_expired', 'created_at', 'created_by'
        ]
        read_only_fields = [
            'id', 'code', 'organization_name', 'is_used', 'used_at',
            'used_by', 'used_by_email', 'is_valid', 'is_expired',
            'created_at', 'created_by'
        ]


class InviteCodeValidateSerializer(serializers.Serializer):
    """Serializer for validating invite codes"""
    code = serializers.CharField(max_length=20)
    email = serializers.EmailField()


# ==================== NOTIFICATION PREFERENCE SERIALIZERS ====================

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Notification Preference Serializer"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_email',
            'email_subscription_expiry', 'email_payment_success',
            'email_payment_failed', 'email_feature_updates', 'email_weekly_reports',
            'inapp_subscription_alerts', 'inapp_payment_alerts', 'inapp_system_updates',
            'sms_payment_alerts', 'sms_critical_alerts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'created_at', 'updated_at']