
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Department

def find_user_and_departments():
    # Let's look for employees with name similar to "Mishal" since the leave request was from "Mishal Muhammed"
    # Or just list all departments and their heads
    print("--- Departments and Heads ---")
    depts = Department.objects.all()
    for d in depts:
        head_name = d.head.full_name if d.head else "None"
        print(f"Dept: {d.name}, Head: {head_name}")
    
    print("\n--- Employee Assignments ---")
    # Using Mishal Muhammed as the sample employee from the previous debug
    employees = Employee.objects.filter(first_name__icontains="Mishal")
    for e in employees:
        print(f"Employee: {e.full_name}, Dept: {e.department.name if e.department else 'None'}, Manager: {e.reporting_manager.full_name if e.reporting_manager else 'None'}")

if __name__ == "__main__":
    find_user_and_departments()
