import os
import django
import sys
import json
from unittest.mock import MagicMock

# Setup django
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.payroll.views import salary_structure_list_create
from rest_framework.test import APIRequestFactory, force_authenticate

def test_create_structure():
    print("--- Verifying Salary Structure Creation ---")
    factory = APIRequestFactory()
    user = User.objects.get(username='admin')
    
    data = {
        "name": "Verification Structure",
        "description": "Testing the fix",
        "is_active": True
    }
    
    request = factory.post('/api/payroll/salary-structures/', data, format='json')
    force_authenticate(request, user=user)
    
    response = salary_structure_list_create(request)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    if response.status_code == 201:
        print("SUCCESS: Salary Structure created successfully!")
    else:
        print("FAILED: Salary Structure creation failed.")

if __name__ == "__main__":
    test_create_structure()
