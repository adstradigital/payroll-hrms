import os
import sys
import django

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee, Organization

email = 'mishalmuhammed638@gmail.com'
user = User.objects.filter(email=email).first()

print(f"User check for: {email}")
if user:
    print(f"User exists: True")
    print(f"User username: {user.username}")
    print(f"User active: {user.is_active}")
    print(f"Is Superuser: {user.is_superuser}")
    
    emp = Employee.objects.filter(user=user).select_related('company').first()
    if emp:
        print(f"Employee found: {emp.employee_id}")
        print(f"Employee status: {emp.status}")
        print(f"Company: {emp.company.name if emp.company else 'None'}")
        print(f"Company Active: {emp.company.is_active if emp.company else 'N/A'}")
    else:
        print("No Employee profile found for this user.")
        
    # Check Organization if this user is a creator
    org = Organization.objects.filter(created_by=user).first()
    if org:
        print(f"Organization created by user: {org.name}")
        print(f"Organization status: {'Active' if org.is_active else 'Inactive'}")
else:
    print("User NOT found in database.")

# List first 5 users just to be sure what's there
print("\nRecent users in DB:")
for u in User.objects.all().order_by('-date_joined')[:5]:
    print(f"- {u.email} ({u.username})")
