import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.leave.views import leave_request_list_create, leave_type_list_create

def main():
    User = get_user_model()
    # Try the user jagath.krishnaakm@gmail.com
    user = User.objects.filter(email='jagath.krishnaakm@gmail.com').first()
    if not user:
        user = User.objects.filter(is_superuser=False).first()
    print("Testing with user:", getattr(user, 'email', 'None'))

    rf = RequestFactory()
    
    # 1. getAllLeaves() -> /api/leave/requests/
    request = rf.get('/api/leave/requests/')
    force_authenticate(request, user=user)
    try:
        response = leave_request_list_create(request)
        if hasattr(response, 'render'): response.render()
        print("LEAVES STATUS:", response.status_code)
        if response.status_code == 500: print(response.content)
    except Exception as e:
        print("LEAVES EXCEPTION:")
        traceback.print_exc()

    # 2. getLeaveTypes() -> /api/leave/types/
    request = rf.get('/api/leave/types/')
    force_authenticate(request, user=user)
    try:
        response = leave_type_list_create(request)
        if hasattr(response, 'render'): response.render()
        print("TYPES STATUS:", response.status_code)
        if response.status_code == 500: print(response.content)
    except Exception as e:
        print("TYPES EXCEPTION:")
        traceback.print_exc()

    # 3. getMyProfile() -> /api/accounts/profile/
    try:
        from django.urls import resolve
        request = rf.get('/api/accounts/profile/')
        force_authenticate(request, user=user)
        match = resolve('/api/accounts/profile/')
        response = match.func(request, *match.args, **match.kwargs)
        if hasattr(response, 'render'): response.render()
        print("PROFILE STATUS:", response.status_code)
        if response.status_code == 500: print(response.content)
    except Exception as e:
        print("PROFILE EXCEPTION:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
