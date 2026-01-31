import os
import django
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.utils import log_activity
from apps.accounts.models import Employee, Organization
from django.contrib.auth.models import User

def seed_logs():
    print("Starting log seeding...")
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()
    
    if not admin_user:
        print("No users found to attribute logs to.")
        return

    employees = Employee.objects.all()[:5]
    for emp in employees:
        log_activity(
            user=admin_user,
            action_type='CREATE',
            module='EMPLOYEE',
            description=f"Created employee profile for '{emp.full_name}' ({emp.employee_id})",
            reference_id=str(emp.id),
            new_value={'employee_id': emp.employee_id, 'email': emp.email, 'status': emp.status},
            status='SUCCESS'
        )
        print(f"Logged creation for {emp.full_name}")

    # Seed some payroll logs
    log_activity(
        user=admin_user,
        action_type='PROCESS',
        module='PAYROLL',
        description="Processed payroll for January 2026",
        status='SUCCESS'
    )
    print("Logged payroll processing")

    # Seed some login logs
    for user in User.objects.all()[:3]:
        log_activity(
            user=user,
            action_type='LOGIN',
            module='AUTH',
            description=f"User {user.username} logged in successfully",
            status='SUCCESS'
        )
        print(f"Logged login for {user.username}")

    print("Seeding completed!")

if __name__ == "__main__":
    seed_logs()
