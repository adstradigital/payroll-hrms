import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from django.urls import resolve

def main():
    User = get_user_model()
    user = User.objects.filter(email='jagath.krishnaakm@gmail.com').first()
    
    rf = RequestFactory()
    request = rf.get('/api/account/employees/me/')
    force_authenticate(request, user=user)
    
    try:
        match = resolve('/api/account/employees/me/')
        response = match.func(request, *match.args, **match.kwargs)
        if hasattr(response, 'render'): response.render()
        print("PROFILE STATUS:", response.status_code)
        if response.status_code == 500:
            print("PROFILE FAILED:", response.content)
    except Exception as e:
        print("PROFILE EXCEPTION:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
