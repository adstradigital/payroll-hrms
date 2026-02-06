import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Company

print("Checking Companies and Employees:")

sam = Employee.objects.filter(first_name__icontains="Sam").first()
if sam:
    print(f"\nUser: {sam.full_name}")
    print(f"Company: {sam.company.name} (ID: {sam.company.id})")
else:
    print("\nUser 'Sam' not found.")

kiran = Employee.objects.filter(first_name__icontains="Kiran").first()
if kiran:
    print(f"\nUser: {kiran.full_name}")
    print(f"Company: {kiran.company.name} (ID: {kiran.company.id})")
else:
    print("\nUser 'Kiran' not found.")

# List all companies to see if 'Adstra' and 'Adstra DigitaL' are duplicates
print("\nAll Companies:")
for c in Company.objects.all():
    print(f"- {c.name} (ID: {c.id})")
