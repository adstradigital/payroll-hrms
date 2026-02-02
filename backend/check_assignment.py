import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import EmployeeSalary, EmployeeSalaryComponent

assign_id = "df706e6e-0035-466c-abe1-b20b4be8167a"
try:
    assign = EmployeeSalary.objects.get(id=assign_id)
    print(f"Salary Assignment: {assign.id} | Employee: {assign.employee.full_name}")
    print("Components:")
    for comp in assign.components.all():
        print(f"  - ID: {comp.id} | Component ID: {comp.component.id} | Name: {comp.component.name} | Amount: {comp.amount}")
except EmployeeSalary.DoesNotExist:
    print("Assignment not found")
