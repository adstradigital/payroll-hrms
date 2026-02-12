
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee

def check_admin_companies():
    admins = Employee.objects.filter(is_admin=True, status='active')
    print(f"--- All Active Admins ({admins.count()}) ---")
    for a in admins:
        company_name = a.company.name if a.company else "NONE"
        print(f"Admin: {a.full_name}, Email: {a.email}, Company: {company_name}")

if __name__ == "__main__":
    check_admin_companies()
