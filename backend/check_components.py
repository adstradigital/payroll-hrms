import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import SalaryComponent, SalaryStructure, SalaryStructureComponent

print("--- SALARY COMPONENTS ---")
for sc in SalaryComponent.objects.all():
    print(f"ID: {sc.id} | Name: {sc.name} | Code: {sc.code}")

print("\n--- SALARY STRUCTURES ---")
for ss in SalaryStructure.objects.all():
    print(f"Structure: {ss.name} (ID: {ss.id})")
    for ssc in ss.components.all():
        print(f"  - Component: {ssc.component.name} (ID: {ssc.component.id})")
