import os
import django
import sys
from datetime import time, date

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.attendance.models import AttendancePolicy
from apps.accounts.models import Company, Employee, Organization
from apps.attendance.serializers import AttendancePolicySerializer
from rest_framework import serializers

def debug():
    try:
        users = User.objects.all()
        for user in users:
            print(f"\nTesting User: {user.username} (ID: {user.id})")
            
            company = None
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company = user.employee_profile.company
                print(f"  - Company from Employee Profile: {company}")
            elif hasattr(user, 'organization') and user.organization:
                company = user.organization
                print(f"  - Company from Organization: {company}")
            
            if not company:
                print("  - NO company found for this user. Skipping.")
                continue

            # Simulated payload from frontend
            data = {
                'name': 'Default Attendance Policy',
                'policy_type': 'company',
                'working_days': '5_days',
                'work_start_time': '09:00:00',
                'work_end_time': '18:00:00',
                'effective_from': str(date.today()),
                'grace_period_minutes': 15,
                'late_thresholds': [],
                'early_thresholds': [],
                'ip_restriction_enabled': False,
                'allowed_ips': '',
                'auto_clockout_enabled': False,
                'auto_clockout_time': '22:00',
                'max_regularization_attempts_per_month': 5
            }
            
            print("  - Testing Serializer Validation...")
            serializer = AttendancePolicySerializer(data=data)
            if serializer.is_valid():
                print("  - Serializer is valid!")
                try:
                    print("  - Testing Model Creation...")
                    policy = serializer.save(company=company)
                    print(f"  - SUCCESS: Policy created with ID: {policy.id}")
                    policy.delete()
                    print("  - Test policy deleted.")
                    return # Exit after first success
                except Exception as e:
                    print(f"  - ERROR during model save: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                print("  - Serializer validation FAILED:")
                print(f"  - {serializer.errors}")

        print("\nERROR: No suitable user-company pair found to test.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug()
