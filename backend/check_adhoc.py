import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import AdhocPayment

payments = AdhocPayment.objects.all()
for p in payments:
    print(f"Employee: {p.employee.full_name} ({p.employee.id})")
    print(f"  Name: {p.name}")
    print(f"  Amount: {p.amount}")
    print(f"  Status: {p.status}")
    print(f"  Component: {p.component.name if p.component else 'None'} ({p.component.component_type if p.component else 'N/A'})")
    print("-" * 20)
