from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveEncashment, LeaveSettings, GlobalLeaveSettings


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


class LeaveSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveSettings
        fields = '__all__'


class GlobalLeaveSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalLeaveSettings
        fields = '__all__'


class LeaveEncashmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    employee_id_display = serializers.ReadOnlyField(source='employee.employee_id')
    leave_type_name = serializers.ReadOnlyField(source='leave_type.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.full_name')

    class Meta:
        model = LeaveEncashment
        fields = '__all__'


class LeaveEncashmentProcessSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'mark_paid'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
