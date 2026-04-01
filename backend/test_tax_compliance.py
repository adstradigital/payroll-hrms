import os
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payroll.services.tds_calculator import TDSCalculator
from apps.payroll.models import TaxSlab, TaxDeclaration, Employee, Organization, EmployeeSalary, EmployeeSalaryComponent, SalaryComponent

def run_tax_compliance_tests():
    print("=== TAX COMPLIANCE TESTS (87A REBATE & HRA) ===\n")
    
    # 1. Setup Mock Data
    org = Organization.objects.first()
    if not org:
        print("Error: No organization found in DB.")
        return
        
    employee = Employee.objects.filter(company=org).first()
    if not employee:
        print("Error: No employee found in DB.")
        return

    # Ensure we have slabs for testing
    # FY 24-25 New Regime slabs (Simplified)
    # 0-3L: 0%
    # 3-7L: 5% (Effective 0% due to 87A)
    # 7-10L: 10%
    new_slabs = [
        {'min': 0, 'max': 300000, 'rate': 0},
        {'min': 300000, 'max': 700000, 'rate': 5},
        {'min': 700000, 'max': 1000000, 'rate': 10},
        {'min': 1000000, 'max': None, 'rate': 15},
    ]
    
    # Old Regime slabs
    # 0-2.5L: 0%
    # 2.5-5L: 5% (Effective 0% due to 87A)
    old_slabs = [
        {'min': 0, 'max': 250000, 'rate': 0},
        {'min': 250000, 'max': 500000, 'rate': 5},
        {'min': 500000, 'max': 1000000, 'rate': 20},
        {'min': 1000000, 'max': None, 'rate': 30},
    ]

    # Create slabs in DB if they don't exist
    TaxSlab.objects.filter(company=org).delete()
    for s in new_slabs:
        TaxSlab.objects.create(company=org, regime='new', min_income=s['min'], max_income=s['max'], tax_rate=s['rate'])
    for s in old_slabs:
        TaxSlab.objects.create(company=org, regime='old', min_income=s['min'], max_income=s['max'], tax_rate=s['rate'])

    slabs_new = TaxSlab.objects.filter(company=org, regime='new')
    slabs_old = TaxSlab.objects.filter(company=org, regime='old')

    print("--- SCENARIO 1: NEW REGIME (INCOME 6.5 LPA) ---")
    # Gross 6.5L - 75k Std Ded = 5.75L. Taxable < 7L, should be 0.
    tax = TDSCalculator.calculate_annual_tax(Decimal('650000'), 'new', slabs_new)
    print(f"Tax for 6.5L (New): INR {tax} (Expected: INR 0)")
    assert tax == 0

    print("\n--- SCENARIO 2: NEW REGIME (INCOME 8 LPA) ---")
    # Gross 8L - 75k Std Ded = 7.25L. 
    # 0-3L: 0
    # 3-7L: (4L * 5%) = 20,000
    # 7-7.25L: (25k * 10%) = 2,500
    # Total = 22,500
    tax = TDSCalculator.calculate_annual_tax(Decimal('800000'), 'new', slabs_new)
    print(f"Tax for 8L (New): INR {tax} (Expected: INR 22,500)")
    assert tax == Decimal('22500')

    print("\n--- SCENARIO 3: OLD REGIME (INCOME 4.8 LPA) ---")
    # Gross 4.8L - 50k Std Ded = 4.3L. Taxable < 5L, should be 0.
    tax = TDSCalculator.calculate_annual_tax(Decimal('480000'), 'old', slabs_old)
    print(f"Tax for 4.8L (Old): INR {tax} (Expected: INR 0)")
    assert tax == 0

    print("\n--- SCENARIO 4: HRA EXEMPTION TEST ---")
    # Basic: 30k/mo, HRA: 15k/mo, Rent: 20k/mo
    # Basic Annual: 3.6L, HRA Annual: 1.8L, Rent Annual: 2.4L
    # Least of:
    # 1. 1.8L
    # 2. 50% of 3.6L = 1.8L
    # 3. 2.4L - (10% of 3.6L) = 2.4L - 36k = 2.04L
    # Exemption = 1.8L (Full HRA)
    hra_ex = TDSCalculator.calculate_hra_exemption(
        basic_salary=Decimal('360000'),
        hra_received=Decimal('180000'),
        rent_paid=Decimal('240000'),
        is_metro=True
    )
    print(f"HRA Exemption: INR {hra_ex} (Expected: INR 180,000)")
    assert hra_ex == Decimal('180000')

    print("\nAll Tax Compliance tests passed!")

if __name__ == '__main__':
    run_tax_compliance_tests()
