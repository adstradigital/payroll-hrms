import os
import django
from django.utils import timezone
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.models import Attendance
from apps.accounts.models import Employee

# Simulate a Client Admin (assuming 'Sam' has access)
# We'll just look for employees in the same company as 'Sam'
emp = Employee.objects.filter(first_name__icontains="Sam").first()
if not emp:
    print("User 'Sam' not found/linked to employee.")
    exit()

print(f"Logged in as (simulated): {emp.full_name} ({emp.id})")
print(f"Company: {emp.company.name}")

# Dates to check
today = timezone.localdate()
yesterday = today - timedelta(days=1)
day_before = today - timedelta(days=2)

dates_to_check = [today, yesterday, day_before]

print("\nChecking filtering logic:")
for d in dates_to_check:
    print(f"\n--- Checking Date: {d} ---")
    
    # Simulate view logic
    queryset = Attendance.objects.filter(employee__company=emp.company)
    
    # Filter by date (mimicking view)
    queryset = queryset.filter(date=d)
    
    count = queryset.count()
    print(f"  Records found: {count}")
    
    for att in queryset:
        print(f"    - {att.employee.full_name}: {att.status} (In: {att.check_in_time})")

# Check if there are ANY records for yesterday/day before irrespective of filter
# to see if data exists at all
print("\n--- Verifying Data Existence (Raw check) ---")
for d in dates_to_check:
    count = Attendance.objects.filter(employee__company=emp.company, date=d).count()
    print(f"  Raw Count for {d}: {count}")
