import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory

def main():
    User = get_user_model()
    user = User.objects.filter(is_superuser=False).first()
    print("Testing with user:", user.email if user else "None")

    from rest_framework.test import force_authenticate
    rf = RequestFactory()
    
    # Test types
    from apps.leave.views import LeaveTypeViewSet
    view = LeaveTypeViewSet.as_view({'get': 'list'})
    request = rf.get('/api/leave/types/')
    force_authenticate(request, user=user)
    try:
        response = view(request)
        if hasattr(response, 'render'): response.render()
        print("TYPES STATUS:", response.status_code)
        if response.status_code == 500:
            print("TYPES CONTENT:", response.content)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
