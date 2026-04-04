from rest_framework import serializers
from .models import (
    LeaveType, LeaveBalance, LeaveRequest, 
    LeaveEncashment, LeaveSettings
)


class LeaveTypeSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveType
        fields = '__all__'

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_id_display = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.SerializerMethodField()
    leave_type_code = serializers.SerializerMethodField()
    available = serializers.ReadOnlyField()

    class Meta:
        model = LeaveBalance
        fields = '__all__'

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id if obj.employee else None

    def get_employee_name(self, obj):
        return obj.employee.full_name if obj.employee else None

    def get_leave_type_name(self, obj):
        return obj.leave_type.name if obj.leave_type else None

    def get_leave_type_code(self, obj):
        return obj.leave_type.code if obj.leave_type else None


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()
    leave_type_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['status', 'approved_by', 'approved_at', 'days_count']

    def get_employee_name(self, obj):
        return obj.employee.full_name if obj.employee else None

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id if obj.employee else None

    def get_leave_type_name(self, obj):
        return obj.leave_type.name if obj.leave_type else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.full_name if obj.approved_by else None


class LeaveRequestApprovalSerializer(serializers.Serializer):
    """For approving/rejecting leave requests"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class LeaveEncashmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()
    leave_type_name = serializers.SerializerMethodField()
    leave_type_code = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = LeaveEncashment
        fields = '__all__'
        read_only_fields = ['total_amount', 'status', 'approved_by', 'approved_at']

    def get_employee_name(self, obj):
        return obj.employee.full_name if obj.employee else None

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id if obj.employee else None

    def get_leave_type_name(self, obj):
        return obj.leave_type.name if obj.leave_type else None

    def get_leave_type_code(self, obj):
        return obj.leave_type.code if obj.leave_type else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.full_name if obj.approved_by else None

    def get_status_display(self, obj):
        return obj.get_status_display()


class LeaveEncashmentProcessSerializer(serializers.Serializer):
    """For processing (approve/reject/mark_paid) an encashment request"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'mark_paid'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class LeaveSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveSettings
        fields = ['id', 'is_encashment_enabled', 'fiscal_year_start', 'default_probation_months', 'allow_negative_balance']
        read_only_fields = ['id']

