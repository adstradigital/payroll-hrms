import os
import django
import json
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from apps.attendance.views import attendance_logs

def test_attendance_logs():
    print("--- Testing Attendance Logs Endpoint ---")
    factory = APIRequestFactory()
    user = User.objects.filter(is_superuser=True).first()
    
    if not user:
        print("Error: No superuser found for testing.")
        return

    # Simulate GET request
    today_str = date.today().isoformat()
    request = factory.get(f'/api/attendance/logs/?date={today_str}')
    force_authenticate(request, user=user)
    
    try:
        response = attendance_logs(request)
        print(f"Status Code: {response.status_code}")
        # print(f"Response Data: {json.dumps(response.data, indent=2)}")
        
        if response.status_code == 200 and 'results' in response.data:
            print(f"Results Count: {len(response.data['results'])}")
            print("\nSUCCESS: Endpoint /attendance/logs/ is working correctly.")
        else:
            print(f"\nFAILURE: Status={response.status_code}, Keys={response.data.keys() if hasattr(response, 'data') else 'None'}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nCRITICAL ERROR: {str(e)}")

if __name__ == "__main__":
    test_attendance_logs()
