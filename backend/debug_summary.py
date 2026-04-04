import os
import django
import sys
from unittest.mock import MagicMock

# Set up Django environment
sys.path.append('c:\\Users\\jagat\\Documents\\payroll-hrms\\payroll-hrms\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.reports.views import LeaveReportViewSet
from rest_framework.test import APIRequestFactory

def debug_summary():
    factory = APIRequestFactory()
    view = LeaveReportViewSet()
    
    company_id = "7bfdb6d3-dcc0-4a5f-8408-53b7dfbbb3d8"
    request = factory.get(f'/api/reports/leave/summary/?company={company_id}&year=2025')
    
    request.user = MagicMock()
    request.user.is_authenticated = True
    
    print(f"--- Calling summary with company_id={company_id} ---")
    try:
        response = view.summary(request)
        print(f"Status: {response.status_code}")
        if response.status_code == 500:
            print(f"Data: {response.data}")
        else:
            print(f"Data length: {len(response.data)}")
            # Show a slice of data
            if len(response.data) > 0:
                print(f"First record: {response.data[0]}")
    except Exception as e:
        import traceback
        print(f"CRASH: {e}")
        print(traceback.format_exc())

if __name__ == "__main__":
    debug_summary()
