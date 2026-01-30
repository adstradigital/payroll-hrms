import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, Organization
from django.contrib.auth.models import User

def inspect_data():
    print("--- Inspecting Employees ---")
    employees = Employee.objects.all()
    count = employees.count()
    print(f"Total Employees: {count}")

    if count == 0:
        print("!! NO EMPLOYEES FOUND !!")
    else:
        for emp in employees:
            print(f"ID: {emp.id} | Name: {emp.full_name} | Status: '{emp.status}' | Company: {emp.company.name} | User: {emp.user}")

    print("\n--- Inspecting Organizations ---")
    orgs = Organization.objects.all()
    for org in orgs:
        print(f"Org: {org.name} | ID: {org.id}")

    print("\n--- Inspecting Users ---")
    users = User.objects.all()
    for user in users:
        print(f"User: {user.username} | Email: {user.email}")

if __name__ == '__main__':
    inspect_data()
