from apps.attendance.models import Holiday
from datetime import date

holidays_2026 = Holiday.objects.filter(date__year=2026)
print(f"Total holidays in DB for 2026: {holidays_2026.count()}")
for h in holidays_2026:
    print(f"- {h.name} ({h.date})")
