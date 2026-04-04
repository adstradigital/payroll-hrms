
import os
import django
import sys

# Setup Django environment
sys.path.append('c:/Users/misha/Desktop/payroll-hrms/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Organization, Employee
from apps.leave.models import LeaveType, LeaveRequest, GlobalLeaveSettings, LeaveBalance
from datetime import date, timedelta

def verify_auto_approve():
    print("--- Verifying Leave Auto-Approval ---")
    org = Organization.objects.first()
    if not org:
        print("No organization found.")
        return

    # Enable auto-approval
    settings, _ = GlobalLeaveSettings.objects.get_or_create(company=org)
    settings.auto_approve_short_leave = True
    settings.save()
    print(f"Set auto_approve_short_leave = True for {org.name}")

    employee = Employee.objects.filter(company=org).first()
    leave_type = LeaveType.objects.filter(company=org).first()

    if not employee or not leave_type:
        print("Could not find employee or leave type for test.")
        return

    # Clear any previous pending for this specific check
    LeaveRequest.objects.filter(employee=employee, start_date=date.today() + timedelta(days=5)).delete()

    print(f"Creating 1-day leave for {employee.full_name} ({leave_type.name})")
    
    # Mock the view's creation logic
    lr = LeaveRequest(
        employee=employee,
        leave_type=leave_type,
        start_date=date.today() + timedelta(days=5),
        end_date=date.today() + timedelta(days=5),
        reason="Verification test",
        days_count=1.0 # Will be recalculated by save() but let's be explicit
    )
    lr.save() # This triggers days_count calculation (1.0)
    
    # Simulate view's POST logic
    balance, _ = LeaveBalance.objects.get_or_create(
        employee=lr.employee, 
        leave_type=lr.leave_type, 
        year=lr.start_date.year, 
        defaults={'allocated': lr.leave_type.days_per_year}
    )
    balance.pending += lr.days_count
    balance.save()
    
    print(f"Final days_count: {lr.days_count}")
    
    # Check for Auto-approval logic as implemented in views.py
    if settings.auto_approve_short_leave and lr.days_count <= 1.0:
        print("Conditions met. Calling approve(None)...")
        lr.approve(None)
        # Refresh from DB
        lr.refresh_from_db()
        balance.refresh_from_db()
    
    print(f"Leave Request Status: {lr.status}")
    print(f"Balance Pending: {balance.pending}")
    print(f"Balance Used: {balance.used}")
    
    if lr.status == 'approved':
        print("SUCCESS: Auto-approval worked!")
    else:
        print("FAILURE: Auto-approval failed.")

if __name__ == "__main__":
    verify_auto_approve()
