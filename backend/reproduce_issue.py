import os
import django
import sys
from datetime import date

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.models import Attendance, AttendanceRegularizationRequest
from apps.accounts.models import Employee
from apps.attendance.serializers import AttendanceRegularizationRequestSerializer
import json

def run_test():
    # 1. Find a valid employee
    employee = Employee.objects.first()
    if not employee:
        print("ERROR: No employees found in database.")
        return

    print(f"Testing with Employee: {employee.full_name} ({employee.id})")

    # 2. Construct simulated payload
    data = {
        "employee": str(employee.id),
        "request_type": "missed_checkin",
        "requested_check_in": "2026-01-22T10:35:00.000Z",
        "requested_check_out": "2026-01-22T11:35:00.000Z",
        "reason": "Test reason",
        "attendance_date": "2026-01-22"
    }
    
    print("\n--- Original Payload ---")
    print(json.dumps(data, indent=2))

    # 3. Simulate View Logic
    mutable_data = data.copy()

    if 'attendance_date' in mutable_data and 'employee' in mutable_data:
        attendance_date = mutable_data.pop('attendance_date')
        if isinstance(attendance_date, list):
            attendance_date = attendance_date[0]
        
        employee_id = mutable_data.get('employee')
        
        print(f"\n--- View Logic: Get/Create Attendance for {attendance_date} ---")
        attendance, created = Attendance.objects.get_or_create(
            employee_id=employee_id,
            date=attendance_date,
            defaults={'status': 'absent'}
        )
        print(f"Attendance ID: {attendance.id}")
        print(f"Created New: {created}")
        
        mutable_data['attendance'] = str(attendance.id)
    
    print("\n--- Data Passed to Serializer ---")
    print(json.dumps(mutable_data, indent=2))

    # 4. Serialize
    serializer = AttendanceRegularizationRequestSerializer(data=mutable_data)
    
    if serializer.is_valid():
        print("\nSUCCESS: Serializer is valid!")
        # validate() method might still raise error if we save?
        # serializer.save() 
    else:
        print("\nFAILURE: Serializer Errors:")
        print(json.dumps(serializer.errors, indent=2))

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        import traceback
        traceback.print_exc()
