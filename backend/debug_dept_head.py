
import os
import django
import logging

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.leave.models import LeaveRequest
from apps.accounts.models import Employee, Department

def debug_dept_head_logic():
    # Get the latest leave request
    leave_request = LeaveRequest.objects.order_by('-created_at').first()
    
    if not leave_request:
        print("No leave requests found.")
        return

    employee = leave_request.employee
    department = employee.department
    
    print(f"Leave Request ID: {leave_request.id}")
    print(f"Employee: {employee.full_name} ({employee.employee_id})")
    print(f"Employee Department: {department.name if department else 'None'}")
    
    if department:
        print(f"Department Head: {department.head.full_name if department.head else 'None'}")
        if department.head:
            print(f"Department Head Email: {department.head.email}")
    
    manager = employee.reporting_manager
    print(f"Reporting Manager: {manager.full_name if manager else 'None'}")
    if manager:
        print(f"Reporting Manager Email: {manager.email}")

    # Test the logic from apps/leave/emails.py
    print("\n--- Testing logic from emails.py ---")
    if not department or not department.head:
        print("Logic: No department head found. Falling back to reporting manager.")
        if not manager or not manager.email:
            print("Logic result: No manager/dept head email found.")
        else:
            print(f"Logic result: Would notify Reporting Manager ({manager.email})")
    else:
        print(f"Logic result: Would notify Dept Head ({department.head.email})")

if __name__ == "__main__":
    debug_dept_head_logic()
