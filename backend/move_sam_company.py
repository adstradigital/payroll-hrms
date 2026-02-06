import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Company

print("Moving Sam to Adstra DigitaL...")

sam = Employee.objects.filter(first_name__icontains="Sam", company__name="Adstra").first()
target_company = Company.objects.filter(name="Adstra DigitaL").first()

if not sam:
    print("User 'Sam' in 'Adstra' not found (maybe already moved?).")
    # Check if already moved
    sam_moved = Employee.objects.filter(first_name__icontains="Sam", company__name="Adstra DigitaL").first()
    if sam_moved:
         print(f"Sam is already in {sam_moved.company.name}")
else:
    if target_company:
        print(f"Moving {sam.full_name} from {sam.company.name} to {target_company.name}...")
        sam.company = target_company
        sam.save()
        print("Success! Sam Moved.")
    else:
        print("Target company 'Adstra DigitaL' not found.")
