import os
import django
import sys
from decimal import Decimal
from datetime import date, time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Organization, Employee
from apps.leave.models import LeaveType, LeaveBalance
from apps.attendance.models import AttendancePolicy

def seed_data():
    print("--- Seeding Leave Management Data ---")
    
    org = Organization.objects.first()
    if not org:
        print("ERROR: No organization found. Cannot seed data.")
        return
        
    print(f"Target Organization: {org.name}")
    
    # 1. Create Default Attendance Policy (Mon-Fri)
    policy, created = AttendancePolicy.objects.get_or_create(
        company=org,
        name="Standard Working Policy",
        defaults={
            'policy_type': 'company',
            'working_days': '5_days',
            'work_start_time': time(9, 0),
            'work_end_time': time(18, 0),
            'monday': True,
            'tuesday': True,
            'wednesday': True,
            'thursday': True,
            'friday': True,
            'saturday': False,
            'sunday': False,
            'effective_from': date(2026, 1, 1),
            'is_active': True
        }
    )
    if created:
        print(f"Created Attendance Policy: {policy.name}")
    else:
        print(f"Attendance Policy already exists: {policy.name}")

    # 2. Create Standard Leave Types
    leave_types_data = [
        {
            'name': 'Casual Leave',
            'code': 'CL',
            'days_per_year': Decimal('12.0'),
            'accrual_type': 'full_year',
            'is_paid': True,
            'is_carry_forward': False
        },
        {
            'name': 'Sick Leave',
            'code': 'SL',
            'days_per_year': Decimal('12.0'),
            'accrual_type': 'monthly',
            'is_paid': True,
            'is_carry_forward': False
        },
        {
            'name': 'Annual Leave',
            'code': 'EL',
            'days_per_year': Decimal('18.0'),
            'accrual_type': 'monthly',
            'is_paid': True,
            'is_carry_forward': True,
            'max_carry_forward_days': Decimal('30.0')
        }
    ]
    
    created_lt_count = 0
    for ldata in leave_types_data:
        lt, created = LeaveType.objects.get_or_create(
            company=org,
            name=ldata['name'],
            defaults={
                'code': ldata['code'],
                'days_per_year': ldata['days_per_year'],
                'accrual_type': ldata['accrual_type'],
                'is_paid': ldata['is_paid'],
                'is_carry_forward': ldata['is_carry_forward'],
                'max_carry_forward_days': ldata.get('max_carry_forward_days', 0)
            }
        )
        if created:
            created_lt_count += 1
            print(f"Created Leave Type: {lt.name}")
            
    print(f"Total Leave Types created: {created_lt_count}")

    # 3. Allocate Balances for Employees
    employees = Employee.objects.filter(company=org, status='active')
    current_year = date.today().year
    balance_count = 0
    
    for emp in employees:
        for lt in LeaveType.objects.filter(company=org):
            balance, created = LeaveBalance.objects.get_or_create(
                employee=emp,
                leave_type=lt,
                year=current_year,
                defaults={
                    'allocated': lt.days_per_year if lt.accrual_type == 'full_year' else (lt.days_per_year / 12 * date.today().month),
                    'used': Decimal('0'),
                    'pending': Decimal('0')
                }
            )
            if created:
                balance_count += 1
                
    print(f"Allocated {balance_count} leave balance records across {employees.count()} employees.")
    print("--- Seeding Completed Successfully ---")

if __name__ == "__main__":
    seed_data()
