import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee, Organization

print("--- ADMIN INVESTIGATION ---")
try:
    user = User.objects.get(username='admin')
    print(f"User: {user.username} (ID: {user.id})")
    
    # Try to find employee by OneToOne
    emp = getattr(user, 'employee_profile', None)
    if emp:
        print(f"Employee (via related_name): {emp.full_name} (ID: {emp.id})")
        print(f"Status: {emp.status}")
        print(f"Company: {emp.company.name if emp.company else 'NONE'}")
        if emp.company:
            print(f"Root Parent: {emp.company.get_root_parent().name}")
    else:
        print("Employee profile (via related_name) NOT FOUND.")

    # Try to find employee by filter
    emp_filter = Employee.objects.filter(user=user).first()
    if emp_filter:
        print(f"Employee (via filter): {emp_filter.full_name} (ID: {emp_filter.id})")
        print(f"User relationship: {emp_filter.user.username} (ID: {emp_filter.user.id})")
    else:
        print("Employee (via filter) NOT FOUND.")

except User.DoesNotExist:
    print("User 'admin' does not exist in DB.")
except Exception as e:
    import traceback
    print(f"Error: {str(e)}")
    traceback.print_exc()

print("--- ALL ORGANIZATIONS ---")
for org in Organization.objects.all():
    print(f"Org: {org.name} (ID: {org.id}) - Active: {org.is_active}")
