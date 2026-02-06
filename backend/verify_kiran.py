import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee

print("Current State verification:")

# Check Sam
sam = Employee.objects.filter(first_name__icontains="Sam").first()
if sam:
    print(f"User: {sam.full_name} is in '{sam.company.name}' (ID: {sam.company.id})")

# Check Kirans
print("\nEmployees named 'Kiran':")
kirans = Employee.objects.filter(first_name__icontains="Kiran")
for k in kirans:
    print(f"- {k.full_name} ({k.employee_id}) is in '{k.company.name}' (ID: {k.company.id})")
    # Check if this Kiran has attendance for Feb 5
    has_att = k.attendances.filter(date__year=2026, date__month=2, date__day=5).exists()
    print(f"  > Has attendance for Feb 5? {'YES' if has_att else 'No'}")
