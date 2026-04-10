import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.leave.views import leave_balance_list_create
from apps.leave.models import LeaveType

def main():
    User = get_user_model()
    user = User.objects.filter(email='jagath.krishnaakm@gmail.com').first()
    
    rf = RequestFactory()
    leave_type = LeaveType.objects.first()
    if not leave_type: return
    
    request = rf.get('/api/leave/balances/', {'employee': user.employee_profile.id, 'leave_type': leave_type.id, 'year': 2026})
    force_authenticate(request, user=user)
    
    try:
        response = leave_balance_list_create(request)
        if hasattr(response, 'render'): response.render()
        print("BALANCE STATUS:", response.status_code)
        if response.status_code == 500:
            print("BALANCE CONTENT:", response.content)
    except Exception as e:
        print("BALANCE EXCEPTION:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
