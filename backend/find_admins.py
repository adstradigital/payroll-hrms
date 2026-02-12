
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee

def find_admins():
    admins = Employee.objects.filter(is_admin=True, status='active')
    print(f"--- Admins ({admins.count()}) ---")
    for a in admins:
        print(f"Admin: {a.full_name}, Email: {a.email}")

if __name__ == "__main__":
    find_admins()
