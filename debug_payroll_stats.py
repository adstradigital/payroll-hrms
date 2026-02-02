
import os
import django
import sys

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import EmployeeSalary
from apps.accounts.models import Employee, Organization
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_payroll_stats():
    print("--- Payroll Stats Debug ---")
    
    # 1. Total EmployeeSalaries
    total_salaries = EmployeeSalary.objects.count()
    print(f"Total EmployeeSalaries in DB: {total_salaries}")
    
    # 2. Current Salaries for Active Employees
    current_active = EmployeeSalary.objects.filter(is_current=True, employee__status='active').count()
    print(f"Current Salaries for Active Employees: {current_active}")
    
    # 3. Check Organization context
    user = User.objects.filter(username='kirankishor_d734252d').first()
    if user:
        print(f"User found: {user.username}")
        org = getattr(user, 'organization', None)
        emp_profile = getattr(user, 'employee_profile', None)
        
        company = None
        if emp_profile:
            company = emp_profile.company
            print(f"User has EmployeeProfile. Company: {company.name if company else 'None'}")
        elif org:
            company = org
            print(f"User is Org Admin. Organization: {company.name if company else 'None'}")
        else:
            print("User has no Org or EmployeeProfile context!")
            
        if company:
            count = EmployeeSalary.objects.filter(employee__company=company, is_current=True, employee__status='active').count()
            print(f"Salaries for user's company ({company.name}): {count}")
            
            # Detailed breakdown
            salaries = EmployeeSalary.objects.filter(employee__company=company, is_current=True, employee__status='active')
            for s in salaries:
                print(f"  - Employee: {s.employee.full_name}, Net: {s.net_salary}, Gross: {s.gross_salary}")
    else:
        print("User kirankishor_d734252d not found.")

if __name__ == "__main__":
    debug_payroll_stats()
