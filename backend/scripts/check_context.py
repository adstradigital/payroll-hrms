import os
import django
import sys

# Setup context
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Organization
from apps.payroll.views import get_client_company

def check_users_context():
    print("--- User Context Check ---")
    users = User.objects.all()
    for user in users:
        company = get_client_company(user)
        has_employee = hasattr(user, 'employee_profile') and user.employee_profile is not None
        has_org = hasattr(user, 'organization') and user.organization is not None
        
        print(f"User: {user.username} (ID: {user.id})")
        print(f"  Is Superuser: {user.is_superuser}")
        print(f"  Has Employee Profile: {has_employee}")
        print(f"  Has Org Link: {has_org}")
        print(f"  Detected Company: {company.name if company else 'NONE'}")
        print("-" * 30)

if __name__ == "__main__":
    check_users_context()
