import os
import django
import json

# Setup Django environment so we can use its models and views
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.payroll.views import calculate_ctc

def test_ctc_algorithm():
    print("Starting CTC Algorithm Test...\n")
    
    from rest_framework.test import APIRequestFactory, force_authenticate
    factory = APIRequestFactory()
    
    # We will test the algorithm by giving it an Annual CTC of ₹12,00,000 (12 LPA)
    test_payload = {
        "annual_ctc": 1200000
    }
    print(f"Input Payload: {test_payload}\n")
    
    request = factory.post('/api/payroll/calculate-ctc/', data=test_payload, format='json')
    
    # 2. To pass the @permission_classes([IsAuthenticated]) check, 
    # we need to attach an existing user to our fake request.
    User = get_user_model()
    # Try to find a user that has a company attached
    user = User.objects.filter(is_superuser=False).first()
    if user and not getattr(user, 'company', None):
        # Fallback to any user
        user = User.objects.first()
    
    if not user:
        print("Error: Could not find a test user in the database.")
        return

    force_authenticate(request, user=user)
    print(f"Authenticated as: {user.email}\n")
    
    # 3. Call the view function directly!
    response = calculate_ctc(request)
    
    # 4. Print the output
    print("=== ALGORITHM OUTPUT ===\n")
    if response.status_code == 200:
        print(json.dumps(response.data, indent=4))
    else:
        print(f"Error {response.status_code}: {response.data}")

if __name__ == '__main__':
    test_ctc_algorithm()
