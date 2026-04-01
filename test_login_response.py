import os
import sys
import django
from django.test import Client
from django.conf import settings

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Override ALLOWED_HOSTS for test
settings.ALLOWED_HOSTS = ['*']

c = Client()
email = 'mishalmuhammed638@gmail.com'
password = 'wrong-password'

print(f"Testing login for {email} with wrong password...")
response = c.post('/api/account/auth/login/', 
                 data={'email': email, 'password': password}, 
                 content_type='application/json')

print(f"Status Code: {response.status_code}")
try:
    print(f"Response Data: {response.json()}")
except:
    print(f"Response Content (raw): {response.content[:500]}")
