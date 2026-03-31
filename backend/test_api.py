import os
import sys
import json
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

def run():
    client = APIClient()
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.first()
    
    print(f"Testing as user: {user.username}")
    client.force_authenticate(user=user)
    
    data = {
        "name": "Integration Test Scale 5",
        "min_value": 0,
        "max_value": 5,
        "description": "testing",
        "is_active": True
    }
    
    response = client.post('/api/performance/rating-scales/', data=data, format='json', HTTP_HOST='localhost')
    print("Status Code:", response.status_code)
    try:
        print("Response Content:", json.dumps(response.json(), indent=2))
    except:
        print("Response Content (raw):", response.content.decode('utf-8', errors='replace'))

if __name__ == '__main__':
    run()
