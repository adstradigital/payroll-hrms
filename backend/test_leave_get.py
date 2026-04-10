import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.leave.views import leave_request_list_create
from django.test import RequestFactory

def main():
    User = get_user_model()
    # Find a user who is not a superuser but has an profile
    user = User.objects.filter(is_superuser=False).first()
    if not user:
        user = User.objects.first()
    print("Testing with user:", user.email)

    from rest_framework.test import force_authenticate
    rf = RequestFactory()
    request = rf.get('/api/leave/requests/')
    force_authenticate(request, user=user)

    try:
        response = leave_request_list_create(request)
        if hasattr(response, 'render'):
            response.render()
        print("STATUS:", response.status_code)
        if response.status_code == 500:
            print("CONTENT:", response.content)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
