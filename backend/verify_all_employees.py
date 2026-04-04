import os
import django
import sys
from decimal import Decimal
from datetime import date

# Set up Django environment
sys.path.append('c:\\Users\\jagat\\Documents\\payroll-hrms\\payroll-hrms\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee
from apps.leave.models import LeaveBalance

def verify_all():
    print("--- Verifying Summary Logic for ALL active employees ---")
    employees = Employee.objects.filter(status='active').select_related('department')
    year = date.today().year
    
    count = 0
    errors = 0
    
    for emp in employees:
        count += 1
        try:
            # Replicate view logic exactly
            balances = LeaveBalance.objects.filter(employee=emp, year=year).select_related('leave_type')
            leave_stats = []
            for bal in balances:
                allocated = bal.allocated or Decimal('0')
                carry_forward = bal.carry_forward or Decimal('0')
                used = bal.used or Decimal('0')
                pending = bal.pending or Decimal('0')
                
                try:
                    available = float(bal.available)
                except Exception:
                    available = float(allocated + carry_forward - used - pending)
                
                leave_stats.append({
                    'type': bal.leave_type.name if bal.leave_type else 'Unknown',
                    'total': float(allocated + carry_forward),
                    'used': float(used),
                    'pending': float(pending),
                    'available': available
                })
            
            data = {
                'employee_id': emp.employee_id,
                'employee_name': emp.full_name,
                'department': emp.department.name if emp.department else 'N/A',
                'leaves': leave_stats
            }
            # Test if it can be JSON serialized (simulating Response)
            import json
            json.dumps(data)
            
        except Exception as e:
            errors += 1
            print(f"FAILED for Employee {emp.employee_id} ({emp.full_name}): {str(e)}")
            import traceback
            traceback.print_exc()
            
    print(f"\nSummary: Processed {count} employees, found {errors} errors.")

if __name__ == "__main__":
    verify_all()
