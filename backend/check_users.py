
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee

def check_users_and_employees():
    users = User.objects.all()
    print(f"--- Users ({users.count()}) ---")
    for u in users:
        emp = getattr(u, 'employee_profile', None)
        emp_info = f"Emp: {emp.full_name} ({emp.company.name if emp.company else 'NONE'})" if emp else "No Profile"
        print(f"User: {u.username}, Email: {u.email}, {emp_info}")

if __name__ == "__main__":
    check_users_and_employees()
