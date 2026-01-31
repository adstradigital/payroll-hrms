from rest_framework import serializers
from .models import DocumentRequest, ShiftRequest, WorkTypeRequest

class DocumentRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DocumentRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_code', 'employee_email',
            'direction', 'direction_display', 'document_type', 'reason',
            'status', 'status_display', 'document_file', 'submitted_at',
            'approver', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ShiftRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = ShiftRequest
        fields = '__all__'

class WorkTypeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = WorkTypeRequest
        fields = '__all__'

from .models import ReimbursementRequest, EncashmentRequest

class ReimbursementRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = ReimbursementRequest
        fields = '__all__'

class EncashmentRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = EncashmentRequest
        fields = '__all__'
