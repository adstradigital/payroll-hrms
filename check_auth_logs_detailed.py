import os
import sys
import django

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.models import ActivityLog
from django.contrib.auth.models import User

print("Checking recent AUTH logs for all users...")
logs = ActivityLog.objects.filter(module='AUTH').order_by('-timestamp')[:50]
for l in logs:
    email = l.user.email if l.user else "Anonymous"
    print(f"[{l.timestamp}] {l.action_type} | {email} | {l.description}")

print("\nChecking if any Password Reset / Change happened for mishalmuhammed638@gmail.com")
user = User.objects.filter(email='mishalmuhammed638@gmail.com').first()
if user:
    reset_logs = ActivityLog.objects.filter(user=user, description__icontains='password').order_by('-timestamp')
    if reset_logs.exists():
        for l in reset_logs:
            print(f"[{l.timestamp}] {l.action_type} | {l.description}")
    else:
        print("No password related logs found for this user.")
else:
    print("User not found.")
