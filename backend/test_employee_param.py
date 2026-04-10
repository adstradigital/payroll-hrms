import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.leave.views import leave_request_list_create

def main():
    User = get_user_model()
    # Try the user jagath.krishnaakm@gmail.com
    user = User.objects.filter(email='jagath.krishnaakm@gmail.com').first()
    if not user:
        user = User.objects.filter(is_superuser=False).first()
    
    rf = RequestFactory()
    
    # 1. getAllLeaves() -> /api/leave/requests/?employee=2 (User ID instead of UUID)
    request = rf.get(f'/api/leave/requests/?employee={user.id}')
    force_authenticate(request, user=user)
    try:
        response = leave_request_list_create(request)
        if hasattr(response, 'render'): response.render()
        print("LEAVES STATUS (with user.id):", response.status_code)
        if response.status_code >= 400: print(response.content)
    except Exception as e:
        print("LEAVES EXCEPTION:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
