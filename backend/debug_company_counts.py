import os
import django
from django.db.models import Count

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Company

print("Employee Distribution:")

# Get company IDs for the relevant names
companies = Company.objects.filter(name__icontains="Adstra")

for comp in companies:
    count = Employee.objects.filter(company=comp).count()
    print(f"- {comp.name} (ID: {comp.id}): {count} employees")
    if count > 0 and count < 10:
        names = list(Employee.objects.filter(company=comp).values_list('first_name', flat=True))
        print(f"  Employees: {names}")
    elif count >= 10:
        print("  (Many employees)")
