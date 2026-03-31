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
email = 'admin@example.com'
# I suspect the password for admin might be 'admin' or 'password'
passwords_to_try = ['admin', 'password', 'admin123', 'admin@123']

for password in passwords_to_try:
    print(f"Testing login for {email} with password: {password}")
    response = c.post('/api/account/auth/login/', 
                     data={'username': email, 'password': password}, 
                     content_type='application/json')

    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"SUCCESS with password: {password}")
        break
    else:
        try:
            print(f"Response Data: {response.json()}")
        except:
            print(f"Response Content (raw): {response.content[:100]}")
