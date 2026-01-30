import os
import sys

# Setup Django environment BEFORE importing anything that uses settings
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.accounts.models import Employee
from django.contrib.auth.models import User

def simulate_view_query(username):
    print(f"\n--- Simulating View Logic for user: {username} ---")
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        print("User not found")
        return

    current_employee = Employee.objects.filter(user=user).first()
    if not current_employee:
        print("No employee record for user.")
        return

    user_company_id = current_employee.company_id
    print(f"User Company ID: {user_company_id}")
    print(f"User Company Name: {current_employee.company.name}")

    # Mimic employee_list_create logic
    queryset = Employee.objects.select_related('company', 'department', 'designation')
    
    # "CRITICAL: Always filter by the user's company"
    queryset = queryset.filter(company_id=user_company_id)
    
    # Filter by status
    queryset = queryset.filter(status='active')
    
    count = queryset.count()
    print(f"Filtered Queryset Count: {count}")
    for emp in queryset:
        print(f" - Found: {emp.full_name} ({emp.id})")

if __name__ == '__main__':
    simulate_view_query('kirankishor_d734252d')
