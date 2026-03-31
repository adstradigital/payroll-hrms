from decimal import Decimal
from django.db import models as djmodels
from ..models_commission import CommissionRule, SalesRecord, CommissionHistory


class CommissionCalculator:
    """
    Service class to handle sales commission calculations.
    """

    @staticmethod
    def _get_models():
        """Lazy import to avoid circular dependencies."""
        from ..models import AdhocPayment, PayrollPeriod, SalaryComponent
        from apps.accounts.models import Employee
        return AdhocPayment, PayrollPeriod, SalaryComponent, Employee

    @staticmethod
    def calculate_for_employee(employee, period):
        """
        Calculates commission for a single employee for a given period.
        """
        # 1. Fetch sales for the period
        sales = SalesRecord.objects.filter(
            employee=employee,
            date__range=(period.start_date, period.end_date)
        )

        total_sales = sales.aggregate(total=djmodels.Sum('amount'))['total'] or Decimal('0.00')

        if total_sales <= 0:
            return None

        # 2. Find applicable rule (Priority: Employee > Designation > Global)
        rule = CommissionRule.objects.filter(employee=employee, is_active=True).first()
        if not rule and hasattr(employee, 'designation') and employee.designation:
            rule = CommissionRule.objects.filter(designation=employee.designation, is_active=True).first()

        if not rule:
            return None

        # 3. Calculate amount
        calculated_amount = Decimal('0.00')
        if rule.rule_type == 'PERCENTAGE':
            calculated_amount = (total_sales * rule.value) / Decimal('100.00')
        elif rule.rule_type == 'FLAT':
            calculated_amount = rule.value

        # 4. Create or update CommissionHistory
        history, created = CommissionHistory.objects.update_or_create(
            employee=employee,
            period=period,
            defaults={
                'total_sales': total_sales,
                'calculated_amount': calculated_amount,
                'status': 'PENDING',
                'notes': f"Calculated via {rule.name} ({rule.value} {rule.get_rule_type_display()})"
            }
        )

        return history

    @classmethod
    def process_period(cls, period):
        """
        Calculates commissions for all active employees for a given period.
        """
        _, _, _, Employee = cls._get_models()
        employees = Employee.objects.filter(status='active')
        results = []
        for emp in employees:
            result = cls.calculate_for_employee(emp, period)
            if result:
                results.append(result)
        return results

    @classmethod
    def approve_commission(cls, history_id):
        """
        Approves a commission and creates an AdhocPayment.
        """
        AdhocPayment, _, SalaryComponent, _ = cls._get_models()

        history = CommissionHistory.objects.get(id=history_id)
        if history.status != 'PENDING':
            return history

        # Try to find a suitable 'Commission' or 'Bonus' salary component
        component = SalaryComponent.objects.filter(name__icontains='Commission').first()
        if not component:
            component = SalaryComponent.objects.filter(name__icontains='Bonus').first()

        # Create AdhocPayment – must include company (required field)
        payment = AdhocPayment.objects.create(
            company=history.employee.company,           # Required FK
            employee=history.employee,
            payroll_period=history.period,
            name=f"Sales Commission - {history.period}",
            amount=history.calculated_amount,
            component=component,
            date=history.period.end_date,               # Ensures it's picked up in the right payroll run
            status='pending',
            notes=history.notes
        )

        history.status = 'APPROVED'
        history.adhoc_payment = payment
        history.save()

        return history
