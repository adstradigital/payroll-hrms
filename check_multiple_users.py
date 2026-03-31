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

email = 'mishalmuhammed638@gmail.com'
users = User.objects.filter(email__iexact=email)

print(f"Checking for multiple users with email: {email}")
print(f"Count: {users.count()}")
for u in users:
    print(f"- ID: {u.id} | Username: {u.username} | Email: {u.email} | Active: {u.is_active}")

# Also check for the + alias
email_alias = 'mishalmuhammed638+mishal1@gmail.com'
users_alias = User.objects.filter(email__iexact=email_alias)
print(f"\nChecking for email alias: {email_alias}")
print(f"Count: {users_alias.count()}")
for u in users_alias:
    print(f"- ID: {u.id} | Username: {u.username} | Email: {u.email} | Active: {u.is_active}")
