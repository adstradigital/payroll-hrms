import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee, Organization

print("--- RECENT USERS AND PROFILES ---")
# List users who have logged in or were created recently
for user in User.objects.all().order_by('-last_login'):
    emp = getattr(user, 'employee_profile', None)
    print(f"User: {user.username} (ID: {user.id}) | Last Login: {user.last_login}")
    if emp:
        print(f"  -> Employee: {emp.full_name} | Company: {emp.company.name if emp.company else 'NONE'}")
    else:
        print(f"  -> NO EMPLOYEE PROFILE")

print("\n--- ALL ORGANIZATIONS ---")
for org in Organization.objects.all():
    print(f"Org: {org.name} (ID: {org.id})")
