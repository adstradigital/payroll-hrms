import os
import sys
import django

# Add the backend directory to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.models import ActivityLog
from django.utils import timezone

print("Checking recent login activities in AuditLog...")
# Get recent 20 activities related to AUTH/LOGIN
logs = ActivityLog.objects.filter(module='AUTH').order_by('-timestamp')[:20]

if logs.exists():
    for log in logs:
        print(f"[{log.timestamp}] {log.action_type} | {log.user.email if log.user else 'Anonymous'} | {log.description}")
else:
    print("No recent AUTH logs found.")
