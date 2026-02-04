import os
import django
from datetime import date
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.performance.models import ReviewPeriod

def create_default_period():
    current_year = timezone.now().year
    
    period, created = ReviewPeriod.objects.get_or_create(
        name=f"Annual Review {current_year}",
        defaults={
            'review_type': 'annual',
            'start_date': date(current_year, 1, 1),
            'end_date': date(current_year, 12, 31),
            'submission_deadline': date(current_year, 12, 15),
            'status': 'active',
            'description': f'Default annual review period for {current_year}'
        }
    )
    
    if created:
        print(f"Created new Review Period: {period.name} (ID: {period.id})")
    else:
        # Ensure it is active
        period.status = 'active'
        period.save()
        print(f"Found existing Review Period: {period.name} (ID: {period.id}) - Set to Active")

if __name__ == "__main__":
    create_default_period()
