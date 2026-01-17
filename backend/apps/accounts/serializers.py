from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience
)


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class CompanyListSerializer(serializers.ModelSerializer):
    """Company List Serializer - minimal fields"""
    active_employees = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'email', 'phone', 'city', 
            'is_active', 'active_employees', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_active_employees(self, obj):
        return obj.get_active_employees_count()


class CompanyDetailSerializer(serializers.ModelSerializer):
    """Company Detail Serializer - all fields"""
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    active_employees = serializers.SerializerMethodField()
    total_departments = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_active_employees(self, obj):
        return obj.get_active_employees_count()

    def get_total_departments(self, obj):
        return obj.departments.filter(is_active=True).count()


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
        read_only_fields = ['id']

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
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return DepartmentListSerializer(children, many=True).data

    def get_employee_count(self, obj):
        return obj.get_employee_count()


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
        read_only_fields = ['id']

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
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_employee_count(self, obj):
        return obj.employees.filter(status='active').count()


class EmployeeListSerializer(serializers.ModelSerializer):
    """Employee List Serializer - minimal fields for lists"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'company', 'company_name', 
            'department', 'department_name', 'designation', 'designation_name',
            'reporting_manager', 'manager_name', 'status', 'employment_type',
            'date_of_joining', 'profile_photo'
        ]
        read_only_fields = ['id', 'full_name']


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Employee Detail Serializer - all fields"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    manager_name = serializers.CharField(source='reporting_manager.full_name', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    # Computed fields
    age = serializers.ReadOnlyField()
    tenure_in_days = serializers.ReadOnlyField()
    is_on_probation = serializers.ReadOnlyField()
    subordinates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
            'full_name', 'age', 'tenure_in_days', 'is_on_probation'
        ]

    def get_subordinates_count(self, obj):
        return obj.get_subordinates_count()

    def validate_email(self, value):
        """Validate email uniqueness"""
        instance = self.instance
        if Employee.objects.filter(email=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Employee with this email already exists.")
        return value

    def validate_employee_id(self, value):
        """Validate employee_id uniqueness"""
        instance = self.instance
        if Employee.objects.filter(employee_id=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Employee with this ID already exists.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Validate that department and designation belong to the same company
        company = data.get('company', self.instance.company if self.instance else None)
        department = data.get('department', self.instance.department if self.instance else None)
        designation = data.get('designation', self.instance.designation if self.instance else None)
        
        if department and department.company != company:
            raise serializers.ValidationError({
                'department': 'Department must belong to the same company.'
            })
        
        if designation and designation.company != company:
            raise serializers.ValidationError({
                'designation': 'Designation must belong to the same company.'
            })
        
        # Validate date logic
        date_of_joining = data.get('date_of_joining', self.instance.date_of_joining if self.instance else None)
        resignation_date = data.get('resignation_date')
        last_working_date = data.get('last_working_date')
        
        if resignation_date and date_of_joining and resignation_date < date_of_joining:
            raise serializers.ValidationError({
                'resignation_date': 'Resignation date cannot be before joining date.'
            })
        
        if last_working_date and resignation_date and last_working_date < resignation_date:
            raise serializers.ValidationError({
                'last_working_date': 'Last working date cannot be before resignation date.'
            })
        
        return data


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """Employee Document Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = EmployeeDocument
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']


class EmployeeEducationSerializer(serializers.ModelSerializer):
    """Employee Education Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    
    class Meta:
        model = EmployeeEducation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate date logic"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_current = data.get('is_current', False)
        
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })
        
        if not is_current and not end_date:
            raise serializers.ValidationError({
                'end_date': 'End date is required if not currently pursuing.'
            })
        
        return data


class EmployeeExperienceSerializer(serializers.ModelSerializer):
    """Employee Experience Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    duration_in_days = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeExperience
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_duration_in_days(self, obj):
        """Calculate duration in days"""
        if obj.start_date:
            from django.utils import timezone
            end_date = obj.end_date or timezone.now().date()
            return (end_date - obj.start_date).days
        return 0

    def validate(self, data):
        """Validate date logic"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_current = data.get('is_current', False)
        
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })
        
        if not is_current and not end_date:
            raise serializers.ValidationError({
                'end_date': 'End date is required if not current position.'
            })
        
        return data


class EmployeeWithRelationsSerializer(EmployeeDetailSerializer):
    """Employee with all related data"""
    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    education = EmployeeEducationSerializer(many=True, read_only=True)
    experience = EmployeeExperienceSerializer(many=True, read_only=True)
    subordinates = EmployeeListSerializer(many=True, read_only=True)
    
    class Meta(EmployeeDetailSerializer.Meta):
        fields = EmployeeDetailSerializer.Meta.fields + [
            'documents', 'education', 'experience', 'subordinates'
        ]