
import os
import django
import sys
from datetime import time, date

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import Organization, Employee
from apps.attendance.models import AttendancePolicy, Shift
from apps.leave.models import LeaveType, LeaveBalance

def audit():
    print("--- HRMS Audit ---")
    
    # Check Organizations
    orgs = Organization.objects.all()
    print(f"Organizations: {orgs.count()}")
    for org in orgs:
        print(f"  - {org.name} ({org.id})")
        
        # Check Attendance Policies
        policies = AttendancePolicy.objects.filter(company=org)
        print(f"    Attendance Policies: {policies.count()}")
        for p in policies:
            print(f"      * {p.name} (Active: {p.is_active})")
            
        # Check Shifts
        shifts = Shift.objects.filter(company=org)
        print(f"    Shifts: {shifts.count()}")
        for s in shifts:
            print(f"      * {s.name} ({s.code})")

        # Check Leave Types
        ltypes = LeaveType.objects.filter(company=org)
        print(f"    Leave Types: {ltypes.count()}")
        for lt in ltypes:
            print(f"      * {lt.name} ({lt.code}) - {lt.days_per_year} days/yr")

    # Check Employees
    employees = Employee.objects.all()
    print(f"Employees: {employees.count()}")
    for emp in employees:
        print(f"  - {emp.full_name} ({emp.employee_id})")
        # Check Balances
        balances = LeaveBalance.objects.filter(employee=emp)
        print(f"    Balances: {balances.count()}")
        for b in balances:
            print(f"      * {b.leave_type.name}: {b.available} available")

if __name__ == "__main__":
    audit()
