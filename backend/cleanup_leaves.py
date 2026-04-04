
import os
import django
import sys

# Setup Django environment
sys.path.append('c:/Users/misha/Desktop/payroll-hrms/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Organization
from apps.leave.models import LeaveRequest, GlobalLeaveSettings

def cleanup_pending_short_leaves():
    print("--- Cleaning up Pending Short Leaves ---")
    
    # Resolve any pending 1-day leaves where the company has auto-approve enabled
    pending = LeaveRequest.objects.filter(days_count__lte=1.0, status='pending')
    count = 0
    
    for lr in pending:
        settings, _ = GlobalLeaveSettings.objects.get_or_create(company=lr.employee.company)
        if settings.auto_approve_short_leave:
            print(f"Auto-approving Request {lr.id} for {lr.employee.full_name} ({lr.days_count} days)")
            lr.approve(None)
            count += 1
            
    print(f"Total processed: {count}")

if __name__ == "__main__":
    cleanup_pending_short_leaves()
