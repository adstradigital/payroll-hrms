import os
import django
from django.conf import settings
from django.utils import timezone
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.attendance.models import Attendance
from apps.accounts.models import Employee

print(f"Time: {timezone.now()}")
print(f"Local Date: {timezone.localdate()}")

employees = Employee.objects.filter(first_name__icontains="Sam") | Employee.objects.filter(last_name__icontains="Sam") | Employee.objects.filter(user__username__icontains="Sam")

print(f"\nFound {employees.count()} employees matching 'Sam':")

for emp in employees:
    print(f"\n--- {emp.full_name} ({emp.id}) ---")
    target_date = date(2026, 2, 5)
    recs = Attendance.objects.filter(employee=emp, date=target_date)
    
    if recs.exists():
        for r in recs:
            print(f"  [FOUND] Date: {r.date} | Status: {r.status} | In: {r.check_in_time} | Out: {r.check_out_time}")
    else:
        print(f"  [MISSING] No attendance record found for {target_date}")

    # Also check surrounding days for context
    surrounding = Attendance.objects.filter(employee=emp, date__range=[date(2026, 2, 4), date(2026, 2, 6)]).order_by('date')
    print("\n  Context (Feb 4-6):")
    for r in surrounding:
         print(f"  - {r.date}: {r.check_in_time} -> {r.check_out_time} ({r.status})")
        
    # Check for duplicates or anything weird
    today_recs = Attendance.objects.filter(employee=emp, date=timezone.localdate())
    print(f"  Records for TODAY ({timezone.localdate()}): {today_recs.count()}")
