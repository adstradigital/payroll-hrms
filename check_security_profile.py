import os
import sys
import django

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import SecurityProfile
from django.contrib.auth.models import User

user = User.objects.filter(email='mishalmuhammed638@gmail.com').first()
if user:
    sp = SecurityProfile.objects.filter(user=user).first()
    print(f"User: {user.email}")
    if sp:
        print(f"Security Profile found.")
        print(f"Failed attempts: {sp.failed_attempts}")
        print(f"Locked until: {sp.locked_until}")
        print(f"Password updated at: {sp.password_updated_at}")
    else:
        print("No Security Profile found for this user.")
else:
    print("User not found.")
