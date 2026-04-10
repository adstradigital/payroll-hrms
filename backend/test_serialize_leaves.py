import os
import django
import traceback

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.leave.models import LeaveRequest
from apps.leave.serializers import LeaveRequestSerializer

def main():
    print("Testing serialization of all LeaveRequests...")
    requests = LeaveRequest.objects.all()
    count = 0
    fail_count = 0
    
    for req in requests:
        try:
            sz = LeaveRequestSerializer(req)
            data = sz.data
            count += 1
        except Exception as e:
            print(f"FAILED TO SERIALIZE Request ID {req.id}")
            traceback.print_exc()
            fail_count += 1
            
    print(f"Serialized {count} requests successfully. {fail_count} failed.")

if __name__ == "__main__":
    main()
