import os
import django
import sys
from unittest.mock import MagicMock

# Set up Django environment
sys.path.append('c:\\Users\\jagat\\Documents\\payroll-hrms\\payroll-hrms\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.leave.serializers import LeaveRequestSerializer
from decimal import Decimal

def verify_fix():
    print("--- Verifying LeaveRequestSerializer Fix ---")
    
    # Create a mock objects to avoid database dependency
    mock_employee = MagicMock()
    mock_employee.full_name = "John Doe"
    mock_employee.employee_id = "EMP001"
    
    mock_leave_type = MagicMock()
    mock_leave_type.name = "Annual Leave"
    
    mock_request = MagicMock()
    mock_request.employee = mock_employee
    mock_request.leave_type = mock_leave_type
    mock_request.status = 'pending'
    mock_request.approved_by = None  # THIS IS THE TRIGGER
    mock_request.start_date = MagicMock()
    mock_request.end_date = MagicMock()
    mock_request.days_count = Decimal('2.0')
    mock_request.id = 999
    
    # Mocking fields that ModelSerializer Expects
    mock_request._meta.fields = []
    mock_request._meta.pk.name = 'id'
    
    print(f"Testing serialization with approved_by = {mock_request.approved_by}")
    
    try:
        serializer = LeaveRequestSerializer(mock_request)
        # We need to manually trigger the serialization of fields since it's a mock
        data = {
            'id': mock_request.id,
            'employee_name': serializer.get_employee_name(mock_request),
            'approved_by_name': serializer.get_approved_by_name(mock_request),
            'leave_type_name': serializer.get_leave_type_name(mock_request)
        }
        print("Success! Serialized data:")
        print(data)
        
        if data['approved_by_name'] is None:
            print("VERIFIED: approved_by_name is safely None.")
        else:
            print(f"UNEXPECTED: approved_by_name is {data['approved_by_name']}")
            
    except AttributeError as e:
        print(f"FAILED: Still getting AttributeError: {e}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")

if __name__ == "__main__":
    verify_fix()
