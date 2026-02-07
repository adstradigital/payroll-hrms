import os
import django
from django.utils import timezone
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.models import Attendance

target_date = date(2026, 2, 5)

print(f"Checking for ANY attendance records on {target_date}...")

global_count = Attendance.objects.filter(date=target_date).count()
print(f"Global Count: {global_count}")

if global_count > 0:
    print("\nSample records:")
    for att in Attendance.objects.filter(date=target_date)[:5]:
        print(f"  - {att.date} | Emp: {att.employee.full_name} | Company: {att.employee.company.name if att.employee.company else 'None'}")
