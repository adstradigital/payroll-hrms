
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Department

def check_dept_details():
    depts = Department.objects.all()
    print(f"--- Departments ({depts.count()}) ---")
    for d in depts:
        head_name = d.head.full_name if d.head else "None"
        head_email = d.head.email if d.head else "None"
        company_name = d.company.name if d.company else "None"
        print(f"Dept: {d.name}, Company: {company_name}, Head: {head_name} ({head_email})")

if __name__ == "__main__":
    check_dept_details()
