from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    AttendancePolicy, Shift, EmployeeShiftAssignment,
    Attendance, AttendanceBreak, Holiday,
    AttendanceRegularizationRequest, AttendanceSummary
)
from apps.accounts.models import Employee


class AttendancePolicyListSerializer(serializers.ModelSerializer):
    """Attendance Policy List Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    working_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendancePolicy
        fields = [
            'id', 'company', 'company_name', 'department', 'department_name',
            'name', 'policy_type', 'working_days', 'work_start_time',
            'work_end_time', 'working_hours', 'is_active', 'effective_from'
        ]
        read_only_fields = ['id']

    def get_working_hours(self, obj):
        return obj.get_working_hours()


class AttendancePolicyDetailSerializer(serializers.ModelSerializer):
    """Attendance Policy Detail Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    working_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendancePolicy
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_working_hours(self, obj):
        return obj.get_working_hours()

    def validate(self, data):
        """Validate policy data"""
        if data.get('effective_to') and data.get('effective_from'):
            if data['effective_to'] < data['effective_from']:
                raise serializers.ValidationError({
                    'effective_to': 'Effective to date cannot be before effective from date'
                })
        
        work_start = data.get('work_start_time')
        work_end = data.get('work_end_time')
        if work_start and work_end and work_end <= work_start:
            raise serializers.ValidationError({
                'work_end_time': 'Work end time must be after work start time'
            })
        
        return data


class ShiftListSerializer(serializers.ModelSerializer):
    """Shift List Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    assigned_employees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Shift
        fields = [
            'id', 'company', 'company_name', 'name', 'shift_type',
            'code', 'start_time', 'end_time', 'duration_hours',
            'grace_period_minutes', 'assigned_employees_count',
            'is_active', 'color_code'
        ]
        read_only_fields = ['id']

    def get_duration_hours(self, obj):
        return obj.get_shift_duration()

    def get_assigned_employees_count(self, obj):
        return obj.employee_assignments.filter(is_active=True).count()


class ShiftDetailSerializer(serializers.ModelSerializer):
    """Shift Detail Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Shift
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_duration_hours(self, obj):
        return obj.get_shift_duration()


class EmployeeShiftAssignmentSerializer(serializers.ModelSerializer):
    """Employee Shift Assignment Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    shift_timing = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeShiftAssignment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_shift_timing(self, obj):
        if obj.shift:
            return f"{obj.shift.start_time.strftime('%H:%M')} - {obj.shift.end_time.strftime('%H:%M')}"
        return None

    def validate(self, data):
        """Validate shift assignment"""
        if data.get('effective_to') and data.get('effective_from'):
            if data['effective_to'] < data['effective_from']:
                raise serializers.ValidationError({
                    'effective_to': 'Effective to date cannot be before effective from date'
                })
        
        # Check for overlapping assignments
        employee = data.get('employee')
        effective_from = data.get('effective_from')
        effective_to = data.get('effective_to')
        
        if employee and effective_from:
            overlapping = EmployeeShiftAssignment.objects.filter(
                employee=employee,
                is_active=True
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            for assignment in overlapping:
                if assignment.effective_to is None or assignment.effective_to >= effective_from:
                    if effective_to is None or assignment.effective_from <= effective_to:
                        raise serializers.ValidationError(
                            'Employee already has an active shift assignment for this period'
                        )
        
        return data


class AttendanceBreakSerializer(serializers.ModelSerializer):
    """Attendance Break Serializer"""
    class Meta:
        model = AttendanceBreak
        fields = '__all__'
        read_only_fields = ['id', 'duration_minutes', 'created_at']


class AttendanceListSerializer(serializers.ModelSerializer):
    """Attendance List Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'date',
            'check_in_time', 'check_out_time', 'shift', 'shift_name',
            'status', 'total_hours', 'overtime_hours', 'is_late',
            'is_early_departure', 'late_by_minutes', 'is_regularized'
        ]
        read_only_fields = ['id', 'total_hours', 'overtime_hours']


class AttendanceDetailSerializer(serializers.ModelSerializer):
    """Attendance Detail Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    breaks = AttendanceBreakSerializer(many=True, read_only=True)
    regularized_by_name = serializers.CharField(source='regularized_by.full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = [
            'id', 'total_hours', 'overtime_hours', 'is_late',
            'is_early_departure', 'late_by_minutes', 'early_departure_minutes',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate attendance data"""
        check_in = data.get('check_in_time')
        check_out = data.get('check_out_time')
        date = data.get('date')
        
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError({
                'check_out_time': 'Check-out time must be after check-in time'
            })
        
        # Check for duplicate attendance
        employee = data.get('employee', self.instance.employee if self.instance else None)
        if employee and date:
            existing = Attendance.objects.filter(
                employee=employee,
                date=date
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'date': 'Attendance record already exists for this date'
                })
        
        return data


class CheckInSerializer(serializers.Serializer):
    """Serializer for check-in"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    device_info = serializers.CharField(max_length=100, required=False)
    remarks = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    """Serializer for check-out"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    device_info = serializers.CharField(max_length=100, required=False)
    remarks = serializers.CharField(required=False, allow_blank=True)


class HolidaySerializer(serializers.ModelSerializer):
    """Holiday Serializer"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Holiday
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_department_names(self, obj):
        return [dept.name for dept in obj.departments.all()]

    def validate(self, data):
        """Validate holiday data"""
        company = data.get('company')
        date = data.get('date')
        name = data.get('name')
        
        if company and date and name:
            # Check for duplicate
            existing = Holiday.objects.filter(
                company=company,
                date=date,
                name=name
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError(
                    'Holiday with this name already exists for this date'
                )
        
        return data


class AttendanceRegularizationRequestSerializer(serializers.ModelSerializer):
    """Attendance Regularization Request Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    attendance_date = serializers.DateField(source='attendance.date', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRegularizationRequest
        fields = '__all__'
        read_only_fields = [
            'id', 'reviewed_by', 'reviewed_at', 'reviewer_comments',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate regularization request"""
        requested_check_in = data.get('requested_check_in')
        requested_check_out = data.get('requested_check_out')
        
        if requested_check_in and requested_check_out:
            if requested_check_out <= requested_check_in:
                raise serializers.ValidationError({
                    'requested_check_out': 'Check-out time must be after check-in time'
                })
        
        return data


class ApproveRegularizationSerializer(serializers.Serializer):
    """Serializer for approving regularization"""
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    comments = serializers.CharField(required=False, allow_blank=True)


class AttendanceSummarySerializer(serializers.ModelSerializer):
    """Attendance Summary Serializer"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    month_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceSummary
        fields = '__all__'
        read_only_fields = ['id', 'generated_at']

    def get_month_name(self, obj):
        from calendar import month_name
        return month_name[obj.month]


class EmployeeAttendanceStatsSerializer(serializers.Serializer):
    """Serializer for employee attendance statistics"""
    employee_id = serializers.UUIDField()
    employee_name = serializers.CharField()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    leave_days = serializers.IntegerField()
    late_arrivals = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=7, decimal_places=2)
    overtime_hours = serializers.DecimalField(max_digits=7, decimal_places=2)
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking"""
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField()
    )

    def validate_attendances(self, value):
        """Validate attendance records"""
        for item in value:
            if 'employee_id' not in item or 'status' not in item:
                raise serializers.ValidationError(
                    'Each attendance record must have employee_id and status'
                )
        return value


# Aliases for views
AttendancePolicySerializer = AttendancePolicyDetailSerializer
ShiftSerializer = ShiftDetailSerializer
AttendanceRegularizationSerializer = AttendanceRegularizationRequestSerializer
AttendanceSerializer = AttendanceListSerializer

