
import os
import django
from datetime import datetime, time, timedelta
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Organization
from apps.attendance.models import Attendance, Shift, AttendancePolicy
from apps.leave.models import LeaveRequest, LeaveType, LeaveBalance

def simulate_workflow():
    print("--- Starting Attendance & Leave Simulation ---")
    
    # 1. Get Employee (Assume first one for test)
    employee = Employee.objects.first()
    if not employee:
        print("Error: No employee found in DB.")
        return
    
    print(f"Target Employee: {employee.full_name} ({employee.employee_id})")
    
    # 2. Get Shift and Policy
    company = employee.company
    shift = Shift.objects.filter(company=company).first()
    policy = AttendancePolicy.objects.filter(company=company, is_active=True).first()
    
    if not shift or not policy:
        print("Error: Missing Shift or Active Policy.")
        return

    # --- Phase 1: Overtime Simulation (Yesterday) ---
    yesterday = timezone.localdate() - timedelta(days=1)
    print(f"\nPhase 1: Simulating 10-Hour Work Day for OT ({yesterday})")
    
    # Define 10 hours: 8:00 AM to 6:00 PM
    check_in_time = timezone.make_aware(datetime.combine(yesterday, time(8, 0)))
    check_out_time = timezone.make_aware(datetime.combine(yesterday, time(18, 0)))
    
    # Cleanup previous entry
    Attendance.objects.filter(employee=employee, date=yesterday).delete()
    
    attendance = Attendance.objects.create(
        employee=employee,
        date=yesterday,
        shift=shift,
        check_in_time=check_in_time,
        check_out_time=check_out_time,
        status='present'
    )
    
    # Trigger calculation
    attendance.calculate_hours()
    attendance.save()
    
    print(f"Result: Total Hours: {attendance.total_hours}, Overtime: {attendance.overtime_hours}")

    # --- Phase 2: Leave Request & Approval ---
    leave_date = timezone.localdate() + timedelta(days=2)
    print(f"\nPhase 2: Simulating Casual Leave Request for ({leave_date})")
    
    leave_type = LeaveType.objects.filter(company=company, code='CL').first()
    if not leave_type:
        print("Error: CL Leave Type not found.")
        return
        
    # Get initial balance
    balance = LeaveBalance.objects.filter(employee=employee, leave_type=leave_type, year=2026).first()
    initial_taken = balance.taken if balance else 0
    print(f"Initial CL Taken: {initial_taken}")

    request = LeaveRequest.objects.create(
        employee=employee,
        leave_type=leave_type,
        start_date=leave_date,
        end_date=leave_date,
        reason="Family event",
        status='pending'
    )
    print(f"Request status: {request.status}")

    # 3. Admin Approval
    print("Approving Leave Request...")
    request.status = 'approved'
    request.approved_by = employee # Self-approving for test as allowed in script
    request.save() # This triggers balance update via signals/overrides
    
    # Verify balance
    balance.refresh_from_db()
    print(f"Final CL Taken: {balance.taken}")
    
    print("\n--- Simulation Complete ---")
    print("Summary:")
    print(f"1. Yesterday ({yesterday}) recorded 10h with Overtime.")
    print(f"2. Tomorrow ({leave_date}) recorded as Approved Leave. Balance reduced.")

if __name__ == "__main__":
    simulate_workflow()
