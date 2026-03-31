
import os
import django
import sys
from datetime import time, date, timedelta
from django.utils import timezone
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Organization, Employee
from apps.attendance.models import AttendancePolicy, Shift
from apps.leave.models import LeaveType, LeaveBalance

def initialize():
    print("--- Initializing Attendance & Leave Data ---")
    
    organizations = Organization.objects.all()
    if not organizations.exists():
        print("Error: No organizations found. Please create one first.")
        return

    for org in organizations:
        print(f"Processing Organization: {org.name}")
        
        # 1. Create Default Attendance Policy
        policy, created = AttendancePolicy.objects.get_or_create(
            company=org,
            name="Standard Office Policy",
            defaults={
                'policy_type': 'company',
                'working_days': '5_days',
                'work_start_time': time(9, 0),
                'work_end_time': time(18, 0),
                'grace_period_minutes': 15,
                'half_day_hours': Decimal('4.0'),
                'full_day_hours': Decimal('8.0'),
                'overtime_applicable': True,
                'auto_mark_absent': True,
                'is_active': True,
                'effective_from': date(2026, 1, 1)
            }
        )
        if created:
            print(f"  [OK] Created Attendance Policy: {policy.name}")
        else:
            print(f"  - Policy already exists: {policy.name}")

        # 2. Create Default Shift
        shift, created = Shift.objects.get_or_create(
            company=org,
            code="GEN-0918",
            defaults={
                'name': "General Shift (9AM-6PM)",
                'shift_type': 'general',
                'start_time': time(9, 0),
                'end_time': time(18, 0),
                'grace_period_minutes': 15,
                'working_days': [0, 1, 2, 3, 4], # Mon-Fri
                'is_active': True,
                'is_default': True
            }
        )
        if created:
            print(f"  [OK] Created Shift: {shift.name}")
        else:
            print(f"  - Shift already exists: {shift.name}")

        # 3. Create Leave Types
        leave_types_data = [
            {'name': 'Casual Leave', 'code': 'CL', 'days': 12, 'accrual': 'full_year'},
            {'name': 'Sick Leave', 'code': 'SL', 'days': 12, 'accrual': 'full_year'},
            {'name': 'Earned Leave', 'code': 'EL', 'days': 15, 'accrual': 'monthly'},
        ]

        current_year = date.today().year

        for lt_data in leave_types_data:
            ltype, lt_created = LeaveType.objects.get_or_create(
                company=org,
                name=lt_data['name'],
                defaults={
                    'code': lt_data['code'],
                    'days_per_year': lt_data['days'],
                    'accrual_type': lt_data['accrual'],
                    'is_active': True
                }
            )
            if lt_created:
                print(f"  [OK] Created Leave Type: {ltype.name}")

            # 4. Allocate Balances to all employees
            employees = Employee.objects.filter(company=org)
            for emp in employees:
                balance, b_created = LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=ltype,
                    year=current_year,
                    defaults={
                        'allocated': ltype.days_per_year,
                        'used': 0,
                        'pending': 0,
                        'carry_forward': 0
                    }
                )
                if b_created:
                    print(f"    - Allocated {ltype.code} balance to {emp.full_name}")

    print("--- Initialization Complete ---")

if __name__ == "__main__":
    initialize()
