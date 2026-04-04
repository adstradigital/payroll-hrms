import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee

print("--- USERS AND EMPLOYEES ---")
for user in User.objects.all():
    emp = getattr(user, 'employee_profile', None)
    print(f"User: {user.username} (ID: {user.id}) | Employee: {emp.full_name if emp else 'NONE'} (ID: {emp.id if emp else 'NONE'})")
