import os
import django
import sys
from unittest.mock import MagicMock

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'payroll_hrms.settings')
django.setup()

from apps.leave.views import leave_request_list_create
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from apps.accounts.models import Employee, Organization

def test_invalid_uuid():
    factory = APIRequestFactory()
    user = User.objects.first()
    if not user:
        print("No user found for testing")
        return

    # Mock request with invalid employee ID (like 'admin-2')
    request = factory.get('/api/leave/requests/', {'employee': 'admin-2'})
    force_authenticate(request, user=user)
    
    try:
        response = leave_request_list_create(request)
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            print("✓ SUCCESS: Backend handled invalid UUID without crashing.")
        else:
            print(f"✗ FAILED: Backend returned {response.status_code}")
    except Exception as e:
        print(f"✗ CRASHED: Backend failed with error: {str(e)}")

if __name__ == "__main__":
    test_invalid_uuid()
