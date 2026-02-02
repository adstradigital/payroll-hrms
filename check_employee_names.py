
import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee

def check_names():
    employees = Employee.objects.all()
    print(f"Found {employees.count()} employees:")
    print("-" * 50)
    print(f"{'ID':<15} | {'First Name':<15} | {'Last Name':<15} | {'Full Name'}")
    print("-" * 50)
    for emp in employees:
        print(f"{emp.employee_id:<15} | {emp.first_name:<15} | {emp.last_name:<15} | {emp.full_name}")

if __name__ == "__main__":
    check_names()
