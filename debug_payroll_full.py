
import os
import django
import sys

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.models import EmployeeSalary, EmployeeSalaryComponent, SalaryComponent
from apps.accounts.models import Employee, Organization
from django.contrib.auth import get_user_model

User = get_user_model()

def debug_payroll_generation():
    print("--- Detailed Payroll Generation Debug ---")
    
    user = User.objects.filter(username='kirankishor_d734252d').first()
    if not user:
        print("User not found")
        return

    company = None
    if hasattr(user, 'employee_profile') and user.employee_profile:
        company = user.employee_profile.company
    elif hasattr(user, 'organization') and user.organization:
        company = user.organization

    print(f"Detected Company: {company.name if company else 'None'}")
    
    if not company:
        return

    # Filter exactly as the view does
    employees = Employee.objects.filter(
        company=company,
        status='active'
    )
    print(f"Active Employees found in company: {employees.count()}")
    
    for emp in employees:
        print(f"\nChecking Employee: {emp.full_name} ({emp.employee_id})")
        
        # Check current salary
        salaries = EmployeeSalary.objects.filter(employee=emp, is_current=True)
        print(f"  Current Salary Records: {salaries.count()}")
        
        for salary in salaries:
            print(f"    Salary ID: {salary.id}")
            print(f"    Basic: {salary.basic_salary}, Net: {salary.net_salary}, Gross: {salary.gross_salary}")
            
            # Check components
            components = salary.components.all()
            print(f"    Components count: {components.count()}")
            for comp in components:
                print(f"      - {comp.component.name}: {comp.amount} ({comp.component.calculation_type})")

    # Check for existing PayrollPeriod
    from apps.payroll.models import PayrollPeriod, PaySlip
    periods = PayrollPeriod.objects.filter(company=company, month=1, year=2026)
    print(f"\n--- Payroll Periods (Jan 2026) ---")
    print(f"Count: {periods.count()}")
    for p in periods:
        print(f"  Period ID: {p.id}, Status: {p.status}, Total Net: {p.total_net}")
        payslips = PaySlip.objects.filter(payroll_period=p)
        print(f"  Payslips count: {payslips.count()}")
        for ps in payslips:
            print(f"    - Employee: {ps.employee.full_name}, Net: {ps.net_salary}")

if __name__ == "__main__":
    debug_payroll_generation()
