
import os
import django
import sys
from decimal import Decimal
from datetime import date

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import Organization, Employee
from apps.payroll.models import (
    SalaryStructure, SalaryComponent, EmployeeSalary, 
    PayrollPeriod, PaySlip, AdhocPayment
)
from django.utils import timezone

def verify_adhoc_integration():
    print("Starting Adhoc Payment Integration Verification...")
    
    # 1. Setup Data
    # Create or get Organization
    org, _ = Organization.objects.get_or_create(name="Test Org Adhoc")
    
    # Create Employee
    employee, created = Employee.objects.get_or_create(
        email="adhoc_test@example.com",
        defaults={
            'first_name': "Adhoc",
            'last_name': "Tester",
            'company': org,
            'employee_id': "EMP-ADHOC-001",
            'date_of_joining': date(2025, 1, 1),
            'status': 'active'
        }
    )
    if not created:
        print(f"Using existing employee: {employee}")

    # Ensure Employee has Salary Structure
    structure, _ = SalaryStructure.objects.get_or_create(
        company=org, name="Standard Structure"
    )
    
    basic_comp, _ = SalaryComponent.objects.get_or_create(
        company=org, code="BASIC", defaults={'name': "Basic Salary", 'component_type': "earning"}
    )
    
    bonus_comp, _ = SalaryComponent.objects.get_or_create(
        company=org, code="BONUS", defaults={'name': "Performance Bonus", 'component_type': "earning"}
    )
    
    # Assign Salary
    EmployeeSalary.objects.filter(employee=employee).delete() # Reset
    ems = EmployeeSalary.objects.create(
        employee=employee,
        salary_structure=structure,
        basic_salary=Decimal('50000.00'),
        gross_salary=Decimal('50000.00'),
        net_salary=Decimal('50000.00'),
        is_current=True,
        effective_from=date(2025, 1, 1),
        ctc=Decimal('600000.00') # Required field
    )
    
    # 2. Create Adhoc Payment
    AdhocPayment.objects.filter(employee=employee).delete() # Reset
    bonus = AdhocPayment.objects.create(
        company=org,
        employee=employee,
        name="Performance Bonus",
        amount=Decimal('10000.00'),
        status='pending',
        date=date(2025, 2, 15)
    )
    print(f"Created pending bonus: {bonus.amount}")

    # 3. Create Payroll Period & Payslip
    period, _ = PayrollPeriod.objects.get_or_create(
        company=org,
        month=2,
        year=2025,
        defaults={
            'start_date': date(2025, 2, 1),
            'end_date': date(2025, 2, 28),
            'name': 'Feb 2025'
        }
    )
    
    PaySlip.objects.filter(employee=employee, payroll_period=period).delete()
    payslip = PaySlip.objects.create(
        employee=employee,
        payroll_period=period,
        employee_salary=ems,
        working_days=28,
        present_days=28 # Full attendance
    )
    
    # 4. Calculate Salary
    print("Calculating Salary...")
    payslip.calculate_salary()
    payslip.refresh_from_db()
    
    # 5. Verification
    print(f"Gross Earnings: {payslip.gross_earnings}")
    print(f"Components: {list(payslip.components.values_list('component__name', 'amount'))}")
    
    # Check if Bonus is included
    bonus_in_payslip = payslip.components.filter(amount=Decimal('10000.00')).exists() # Simple check by amount
    # Or strict check via linkage
    bonus.refresh_from_db()
    
    if bonus.processed_in_payslip == payslip:
        print("PASS: Bonus is linked to payslip.")
    else:
        print("FAIL: Bonus is NOT linked to payslip.")
        
    if bonus_in_payslip:
        print("PASS: Bonus component exists in payslip.")
    else:
        print("FAIL: Bonus component NOT found in payslip.")

    if payslip.gross_earnings >= Decimal('60000.00'):
         print("PASS: Gross earnings include bonus.")
    else:
         print(f"FAIL: Gross earnings {payslip.gross_earnings} mismatch (expected >= 60000).")

    # 6. Test Double Counting / Re-calculation
    print("Re-calculating Salary (Idempotency Test)...")
    payslip.calculate_salary()
    payslip.refresh_from_db()
    
    if payslip.gross_earnings == Decimal('60000.00'): # Basic 50k + Bonus 10k (assuming no other comps)
         print("PASS: Re-calculation did not double count.")
    else:
         print(f"FAIL: Re-calculation resulted in {payslip.gross_earnings} (Doubled?).")

    # 7. Test Race Condition (Second Payslip)
    # Create March Period
    period_mar, _ = PayrollPeriod.objects.get_or_create(
        company=org,
        month=3,
        year=2025,
        defaults={
            'start_date': date(2025, 3, 1),
            'end_date': date(2025, 3, 31),
            'name': 'Mar 2025'
        }
    )
    
    PaySlip.objects.filter(employee=employee, payroll_period=period_mar).delete()
    payslip_mar = PaySlip.objects.create(
        employee=employee,
        payroll_period=period_mar,
        employee_salary=ems,
        working_days=31,
        present_days=31
    )
    
    print("Calculating March Salary (Should NOT include Feb Bonus)...")
    payslip_mar.calculate_salary()
    payslip_mar.refresh_from_db()
    
    if payslip_mar.gross_earnings == Decimal('50000.00'):
        print("PASS: March payslip did NOT pick up already processed bonus.")
    else:
        print(f"FAIL: March payslip picked up bonus? Gross: {payslip_mar.gross_earnings}")
        # Check components
        print(f"March Components: {list(payslip_mar.components.values_list('component__name', 'amount'))}")

    print("Verification Completed.")

if __name__ == '__main__':
    verify_adhoc_integration()
