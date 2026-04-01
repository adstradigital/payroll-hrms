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

today = timezone.now().date()
print(f"Checking logs for: {today}")
logs = ActivityLog.objects.filter(timestamp__date=today).order_by('-timestamp')

print(f"Count for today: {logs.count()}")
for l in logs[:20]:
    email = l.user.email if l.user else "Anonymous"
    print(f"[{l.timestamp}] {l.action_type} | {email} | {l.description}")
