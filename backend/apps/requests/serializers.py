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
        extra_kwargs = {
            'current_shift': {'required': False}
        }
    
    def to_internal_value(self, data):
        # Create a mutable copy if it's a QueryDict
        if hasattr(data, 'copy'):
            data = data.copy()
        
        # Handle date format issues from and to frontend
        if 'effective_date' in data and data['effective_date']:
            date_str = data['effective_date']
            import datetime
            # Common formats seen in browsers/inputs
            for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y'):
                try:
                    dt = datetime.datetime.strptime(date_str, fmt)
                    data['effective_date'] = dt.strftime('%Y-%m-%d')
                    break
                except (ValueError, TypeError):
                    continue
        return super().to_internal_value(data)

    def create(self, validated_data):
        if 'current_shift' not in validated_data or not validated_data['current_shift']:
            employee = validated_data.get('employee')
            # Import here to avoid circular imports
            from apps.attendance.models import EmployeeShiftAssignment
            current_assignment = EmployeeShiftAssignment.objects.filter(
                employee=employee, 
                is_active=True
            ).order_by('-effective_from').first()
            
            validated_data['current_shift'] = current_assignment.shift.name if (current_assignment and current_assignment.shift) else "Default"
            
        return super().create(validated_data)

class WorkTypeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = WorkTypeRequest
        fields = '__all__'
        extra_kwargs = {
            'current_type': {'required': False}
        }

    def to_internal_value(self, data):
        # Create a mutable copy if it's a QueryDict
        if hasattr(data, 'copy'):
            data = data.copy()
            
        # Handle date format issues
        if 'effective_date' in data and data['effective_date']:
            date_str = data['effective_date']
            import datetime
            for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y'):
                try:
                    dt = datetime.datetime.strptime(date_str, fmt)
                    data['effective_date'] = dt.strftime('%Y-%m-%d')
                    break
                except (ValueError, TypeError):
                    continue
        return super().to_internal_value(data)

    def create(self, validated_data):
        if 'current_type' not in validated_data or not validated_data['current_type']:
            employee = validated_data.get('employee')
            # Determine from profile
            validated_data['current_type'] = 'Remote' if employee.is_remote_employee else 'On-Site'
            
        return super().create(validated_data)

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
