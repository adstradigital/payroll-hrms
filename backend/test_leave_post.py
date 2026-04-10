import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.leave.views import leave_request_list_create
from apps.leave.models import LeaveType

def main():
    User = get_user_model()
    # Find user
    user = User.objects.filter(email='jagath.krishnaakm@gmail.com').first()
    if not user:
        user = User.objects.filter(is_superuser=False, employee_profile__isnull=False).first()
    
    leave_type = LeaveType.objects.first()
    if not leave_type:
        print("No leave type found")
        return

    data = {
        'employee': str(user.employee_profile.id) if getattr(user, 'employee_profile', None) else '',
        'leave_type': leave_type.id,
        'start_date': '',
        'end_date': '',
        'start_day_type': 'full',
        'end_day_type': 'full',
        'reason': 'Test Reason'
    }

    import json
    rf = RequestFactory()
    request = rf.post('/api/leave/requests/', data=json.dumps(data), content_type='application/json')
    force_authenticate(request, user=user)
    
    try:
        response = leave_request_list_create(request)
        if hasattr(response, 'render'): response.render()
        print("POST STATUS:", response.status_code)
        if response.status_code == 500: 
            print("POST EXACT ERROR:")
            print(response.content.decode('utf-8', errors='ignore'))
        elif response.status_code >= 400:
            print("POST FAILED:", response.content)
    except Exception as e:
        print("POST EXCEPTION:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
