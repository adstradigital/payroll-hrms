import os
import django
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import Employee
from django.utils import timezone

def fix_ids():
    # Find employees with empty employee_id
    # Note: employee_id is CharField, might be empty string. 
    # It might also be that the field is unique so only one can be empty?
    # Let's check for None or "
    
    # Check duplicate empty strings if any (if DB allows)
    employees = Employee.objects.all()
    print(f"Total employees: {employees.count()}")
    
    for emp in employees:
        print(f"Checking {emp.full_name}: ID='{emp.employee_id}'")
        
        if not emp.employee_id or emp.employee_id.strip() == "":
            print(f" -> Missing ID for {emp.full_name}. Generating...")
            
            # Generate new ID
            # Format: EMP-{CompanyHex}-{Random}
            company_segment = emp.company.id.hex[:6].upper() if emp.company else "NOCO"
            while True:
                rand_suffix = f"{random.randint(1000, 9999)}"
                new_id = f"EMP-{company_segment}-{rand_suffix}"
                if not Employee.objects.filter(employee_id=new_id).exists():
                    break
            
            print(f" -> Assigned: {new_id}")
            emp.employee_id = new_id
            emp.save()
            print(" -> Saved.")

if __name__ == "__main__":
    fix_ids()
