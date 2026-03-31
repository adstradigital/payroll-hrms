"""
TDS (Tax Deducted at Source) / Income Tax Calculation Service

Implements Indian Income Tax calculation for payroll:
- Supports New Regime and Old Regime
- Applies 80C/HRA/Other deductions for Old Regime
- Adds 4% Health & Education Cess
- Calculates monthly TDS = Annual Tax / Remaining Months
"""

from decimal import Decimal
from django.utils import timezone


class TDSCalculator:

    @staticmethod
    def calculate_hra_exemption(basic_salary: Decimal, hra_received: Decimal, rent_paid: Decimal, is_metro: bool = False) -> Decimal:
        """
        Calculate HRA exemption based on the least of:
        1. Actual HRA received
        2. 50% of Basic (Metro) or 40% of Basic (Non-Metro)
        3. Rent paid minus 10% of Basic
        """
        rule1 = hra_received
        rule2 = (basic_salary * Decimal('0.50' if is_metro else '0.40')).quantize(Decimal('0.01'))
        rule3 = max(rent_paid - (basic_salary * Decimal('0.10')), Decimal('0')).quantize(Decimal('0.01'))
        
        return min(rule1, rule2, rule3)

    @staticmethod
    def calculate_annual_tax(annual_income: Decimal, regime: str, tax_slabs, declaration_amount: Decimal = Decimal('0')) -> Decimal:
        """
        Calculate annual income tax from slabs with 87A Rebate.
        """
        taxable_income = annual_income

        # Apply deductions for old regime
        if regime == 'old':
            # Standard deduction (₹50,000)
            taxable_income -= Decimal('50000')
            # Apply declared deductions (80C, HRA Exemption, etc.)
            taxable_income -= declaration_amount
            taxable_income = max(taxable_income, Decimal('0'))
        else:
            # New regime: Standard deduction ₹75,000 (FY 2024-25+)
            taxable_income -= Decimal('75000')
            taxable_income = max(taxable_income, Decimal('0'))

        total_tax = Decimal('0')
        for slab in tax_slabs:
            slab_min = slab.min_income
            slab_max = slab.max_income

            if taxable_income <= slab_min:
                break

            if slab_max is None:
                income_in_slab = taxable_income - slab_min
            else:
                income_in_slab = min(taxable_income, slab_max) - slab_min

            if income_in_slab > 0:
                tax_in_slab = (income_in_slab * slab.tax_rate / 100).quantize(Decimal('0.01'))
                total_tax += tax_in_slab

        # --- Section 87A Rebate Logic ---
        # Old Regime: Income <= 5L -> max rebate 12,500
        if regime == 'old' and taxable_income <= Decimal('500000'):
            total_tax = max(total_tax - Decimal('12500'), Decimal('0'))
            
        # New Regime: Income <= 7L -> tax is NIL (rebate up to 25,000)
        # Note: Marginal relief applies for income slightly above 7L in New Regime (FY 24-25)
        # For now, we implement the primary cut-off for simplicity.
        elif regime == 'new' and taxable_income <= Decimal('700000'):
            total_tax = Decimal('0')

        return total_tax.quantize(Decimal('0.01'))

    @staticmethod
    def apply_cess(tax: Decimal, cess_rate: Decimal = Decimal('4')) -> Decimal:
        """Apply Health & Education Cess (default 4%)."""
        cess = (tax * cess_rate / 100).quantize(Decimal('0.01'))
        return (tax + cess).quantize(Decimal('0.01'))

    @classmethod
    def calculate_monthly_tds(cls, employee, payroll_period, gross_monthly_salary: Decimal) -> Decimal:
        """
        Calculate TDS for a single payroll month with HRA and 87A logic.
        """
        from apps.payroll.models import TaxSlab, TaxDeclaration, PayrollSettings, EmployeeSalaryComponent
        from django.db.models import Q

        settings = PayrollSettings.objects.filter(company=employee.company).first()
        if not settings or not settings.enable_auto_tds:
            return Decimal('0')

        # Determine financial year and remaining months
        period_month = payroll_period.month
        period_year = payroll_period.year

        if period_month >= 4:
            remaining_months = 12 - period_month + 4
        else:
            remaining_months = 4 - period_month

        remaining_months = max(remaining_months, 1)

        financial_year = settings.financial_year or f"{period_year}-{period_year + 1}"
        regime = settings.default_tax_regime

        declaration_amount = Decimal('0')
        hra_exemption = Decimal('0')
        
        try:
            declaration = TaxDeclaration.objects.filter(
                employee=employee,
                financial_year=financial_year,
                status='approved'
            ).first()
            
            if declaration:
                regime = declaration.regime
                # Base declaration amount (80C etc.)
                declaration_amount = declaration.total_declared_amount or Decimal('0')
                
                # If Old Regime, calculate HRA exemption
                if regime == 'old':
                    salary = getattr(employee, 'salary_structure', None)
                    if salary:
                        basic_monthly = salary.basic_salary
                        hra_component = EmployeeSalaryComponent.objects.filter(
                            employee_salary=salary,
                            component__code='HRA'
                        ).first()
                        hra_monthly = hra_component.amount if hra_component else Decimal('0')
                        
                        # Find rent in declarations JSON
                        rent_paid_annual = Decimal('0')
                        for item in declaration.declarations:
                            if 'rent' in item.get('type', '').lower() or 'rent' in item.get('description', '').lower():
                                rent_paid_annual = Decimal(str(item.get('amount', 0)))
                                break
                        
                        if rent_paid_annual > 0:
                            # Calculate annual exemption
                            # Assuming Non-Metro (40%) as default; could be fetched from employee profile if exists
                            hra_exemption = cls.calculate_hra_exemption(
                                basic_salary=basic_monthly * 12,
                                hra_received=hra_monthly * 12,
                                rent_paid=rent_paid_annual,
                                is_metro=False 
                            )
                            declaration_amount += hra_exemption
        except Exception as e:
            print(f"Error in TDS pre-calc: {e}")

        # Annualize salary
        annual_income = gross_monthly_salary * 12

        # Get tax slabs for this regime
        tax_slabs = TaxSlab.objects.filter(
            company=employee.company,
            regime=regime
        ).order_by('min_income')

        if not tax_slabs.exists():
            return Decimal('0')

        # Calculate annual tax
        annual_tax = cls.calculate_annual_tax(
            annual_income=annual_income,
            regime=regime,
            tax_slabs=tax_slabs,
            declaration_amount=declaration_amount
        )

        # Add cess
        annual_tax_with_cess = cls.apply_cess(annual_tax)

        # Monthly TDS = Annual Tax / Remaining Months
        monthly_tds = (annual_tax_with_cess / remaining_months).quantize(Decimal('0.01'))

        return monthly_tds

    @classmethod
    def compare_regimes(cls, company_id, annual_income: Decimal, declaration_amount: Decimal = Decimal('0')) -> dict:
        """
        Compare tax liability between Old and New regimes for a given income.
        """
        from apps.payroll.models import TaxSlab

        slabs_old = TaxSlab.objects.filter(company_id=company_id, regime='old').order_by('min_income')
        slabs_new = TaxSlab.objects.filter(company_id=company_id, regime='new').order_by('min_income')

        # Old Regime Calculation
        tax_old = cls.calculate_annual_tax(annual_income, 'old', slabs_old, declaration_amount)
        net_tax_old = cls.apply_cess(tax_old)

        # New Regime Calculation
        tax_new = cls.calculate_annual_tax(annual_income, 'new', slabs_new, Decimal('0'))
        net_tax_new = cls.apply_cess(tax_new)

        return {
            'old_regime': {
                'gross_income': float(annual_income),
                'taxable_income': float(max(annual_income - Decimal('50000') - declaration_amount, Decimal('0'))),
                'tax_before_cess': float(tax_old),
                'cess': float(net_tax_old - tax_old),
                'total_tax': float(net_tax_old)
            },
            'new_regime': {
                'gross_income': float(annual_income),
                'taxable_income': float(max(annual_income - Decimal('75000'), Decimal('0'))),
                'tax_before_cess': float(tax_new),
                'cess': float(net_tax_new - tax_new),
                'total_tax': float(net_tax_new)
            },
            'recommendation': 'Old Regime' if net_tax_old < net_tax_new else 'New Regime',
            'savings': float(abs(net_tax_old - net_tax_new))
        }
