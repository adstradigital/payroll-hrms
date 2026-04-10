import os
import django
import traceback
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import force_authenticate
from apps.leave.views import leave_type_list_create

def main():
    User = get_user_model()
    user = User.objects.get(email='jagath.krishnaakm@gmail.com')
    
    rf = RequestFactory()
    request = rf.get('/api/leave/types/')
    force_authenticate(request, user=user)
    
    try:
        response = leave_type_list_create(request)
        print("STATUS:", response.status_code)
        print("DATA TYPE:", type(response.data))
        if isinstance(response.data, list):
            print("DATA LENGTH:", len(response.data))
            if len(response.data) > 0:
                print("FIRST ITEM:", response.data[0])
        elif isinstance(response.data, dict):
            print("DATA KEYS:", response.data.keys())
            if 'results' in response.data:
                print("RESULTS LENGTH:", len(response.data['results']))
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    main()
