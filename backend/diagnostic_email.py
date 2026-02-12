
import os
import django
import logging

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.leave.models import LeaveRequest
from apps.accounts.models import Employee, Department
from apps.leave.emails import send_leave_request_to_dept_head

# Enable logging to console for debug
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('apps.leave.emails')

def diagnostic():
    # Get the latest leave request
    leave_request = LeaveRequest.objects.order_by('-created_at').first()
    
    if not leave_request:
        print("No leave requests found.")
        return

    employee = leave_request.employee
    print(f"--- Diagnostic for Leave Request {leave_request.id} ---")
    print(f"Employee: {employee.full_name}")
    print(f"Employee Company: {employee.company.name if employee.company else 'NONE'}")
    print(f"Employee Dept: {employee.department.name if employee.department else 'NONE'}")
    
    print("\n--- Searching for Notification Recipient ---")
    dept_head = None
    if employee.department and employee.department.head:
        dept_head = employee.department.head
        print(f"Found Dept Head: {dept_head.full_name} ({dept_head.email})")
    else:
        print("No Dept Head found.")
        
    if not dept_head:
        if employee.reporting_manager:
            dept_head = employee.reporting_manager
            print(f"Found Reporting Manager: {dept_head.full_name} ({dept_head.email})")
        else:
            print("No Reporting Manager found.")
            
    if not dept_head:
        print("Looking for Client Admin...")
        admin = Employee.objects.filter(company=employee.company, is_admin=True, status='active').first()
        if admin:
            print(f"Found Client Admin fallback: {admin.full_name} ({admin.email})")
            dept_head = admin
        else:
            print("CRITICAL: No active Client Admin found for this company.")

    if dept_head:
        print(f"\n--- Simulating Email Send to {dept_head.email} ---")
        success = send_leave_request_to_dept_head(leave_request)
        print(f"Send status: {'SUCCESS' if success else 'FAILED'}")
    else:
        print("\n--- Skipping Email Simulation (No Recipient) ---")

if __name__ == "__main__":
    diagnostic()
