from django.db import models
from apps.accounts.models import Organization, Employee, BaseModel
from decimal import Decimal
import uuid
from django.utils import timezone


class SalaryComponent(BaseModel):
    """Earning or Deduction components"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    TYPE_CHOICES = [
        ('earning', 'Earning'),
        ('deduction', 'Deduction'),
    ]
    
    CALCULATION_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage of Basic'),
        ('formula', 'Custom Formula'),
        ('attendance_prorated', 'Attendance Prorated'),
        ('per_day', 'Per Present Day'),
    ]
    
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='salary_components')
    name = models.CharField(max_length=100)  # Basic, HRA, Conveyance, PF, etc.
    code = models.CharField(max_length=20)
    component_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Calculation settings
    calculation_type = models.CharField(max_length=20, choices=CALCULATION_CHOICES, default='fixed')
    percentage_of = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        help_text='For percentage-based calculation'
    )
    default_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    default_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Tax settings
    is_taxable = models.BooleanField(default=True)
    is_statutory = models.BooleanField(default=False, help_text='Statutory deduction like PF, ESI')
    statutory_type = models.CharField(
        max_length=20, blank=True,
        choices=[('pf', 'PF'), ('esi', 'ESI'), ('pt', 'Professional Tax'), ('tds', 'TDS')]
    )
    
    # Display
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['company', 'code']
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.component_type})"


class SalaryStructure(BaseModel):
    """Template for employee salary composition"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='salary_structures')
    name = models.CharField(max_length=100)  # Manager Grade, Executive Grade, etc.
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['company', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class SalaryStructureComponent(BaseModel):
    """Components included in a salary structure"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.CASCADE, related_name='components'
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    
    # Override defaults
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        unique_together = ['salary_structure', 'component']

    def __str__(self):
        return f"{self.salary_structure.name} - {self.component.name}"

class EmployeeSalary(BaseModel):
    """Actual salary assigned to an employee"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salaries')
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.SET_NULL, null=True, blank=True
    )
    
    # Salary amounts
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    ctc = models.DecimalField(max_digits=12, decimal_places=2, help_text='Cost to Company (annual)')
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['-effective_from']
        verbose_name_plural = 'Employee Salaries'

    def __str__(self):
        return f"{self.employee.employee_id} - ₹{self.gross_salary}/month"

    def save(self, *args, **kwargs):
        # Mark previous salary as not current
        if self.is_current:
            EmployeeSalary.objects.filter(
                employee=self.employee, is_current=True
            ).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class EmployeeSalaryComponent(BaseModel):
    """Individual component breakup for employee's salary"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_salary = models.ForeignKey(
        EmployeeSalary, on_delete=models.CASCADE, related_name='components'
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ['employee_salary', 'component']

    def __str__(self):
        return f"{self.employee_salary.employee.employee_id} - {self.component.name}: ₹{self.amount}"


class PayrollPeriod(BaseModel):
    """Monthly payroll batch"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payroll_periods')
    name = models.CharField(max_length=50)  # January 2026, etc.
    month = models.PositiveIntegerField()  # 1-12
    year = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Totals
    total_employees = models.PositiveIntegerField(default=0)
    total_gross = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_net = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Granular Totals
    total_lop = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_statutory = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_advance_recovery = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    processed_by = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payrolls'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['company', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class PaySlip(BaseModel):
    """Individual employee payslip"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    STATUS_CHOICES = [
        ('generated', 'Generated'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='payslips')
    employee_salary = models.ForeignKey(
        EmployeeSalary, on_delete=models.SET_NULL, null=True, related_name='payslips'
    )
    
    # Attendance summary
    working_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    present_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    leave_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    absent_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    lop_days = models.DecimalField(max_digits=4, decimal_places=1, default=0, help_text='Loss of Pay days')
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Salary summary
    gross_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Granular deductions
    lop_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statutory_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    advance_recovery = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Payment details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generated')
    payment_date = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(
        max_length=20, blank=True,
        choices=[('bank', 'Bank Transfer'), ('cheque', 'Cheque'), ('cash', 'Cash')]
    )
    transaction_ref = models.CharField(max_length=100, blank=True)
    
    remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ['employee', 'payroll_period']
        ordering = ['-payroll_period__year', '-payroll_period__month']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.payroll_period.name}"
    
    def calculate_salary(self):
        """
        Calculate salary based on attendance and component types.
        
        Logic:
        1. Determine working days and paid days.
        2. Iterate through EmployeeSalary components:
           - fixed: Full amount
           - percentage: (Amount * Ratio)
           - attendance_prorated: Amount * Ratio
           - per_day: Amount * Paid Days
        3. Generate/Update PaySlipComponent objects.
        4. Update PaySlip totals.
        """
        if not self.employee_salary:
            return

        # 1. Determine Days
        working_days_val = Decimal(self.working_days) if self.working_days > 0 else Decimal(1)
        
        # Calculate derived paid days
        # paid_days = working_days - lop_days
        if self.working_days > 0:
            paid_days = Decimal(self.working_days) - Decimal(self.lop_days)
        else:
            paid_days = Decimal(0)
            
        proration_ratio = paid_days / working_days_val if working_days_val > 0 else Decimal(0)
        
        # Clean up existing calculated components to regenerate them
        # Only delete components that are NOT manual
        self.components.filter(is_manual=False).delete()
        # Detach any EMIs linked to this payslip (they will be re-attached if still valid)
        EMI.objects.filter(payslip=self).update(payslip=None)
        
        # Get components from employee salary
        components = self.employee_salary.components.select_related('component').all()
        
        total_earnings = Decimal(0)
        total_deductions = Decimal(0)
        final_basic = Decimal(0)
        
        # 2b. Process Basic Salary (Always Prorated)
        basic_salary = self.employee_salary.basic_salary
        if basic_salary > 0:
            final_basic = basic_salary * proration_ratio
            final_basic = final_basic.quantize(Decimal('0.01'))
            total_earnings += final_basic
            
            # Create a PaySlipComponent for Basic if a component named 'Basic' or similar exists
            basic_component = SalaryComponent.objects.filter(company=self.employee.company, name__icontains='Basic', is_active=True).first()
            if basic_component:
                PaySlipComponent.objects.get_or_create(
                    payslip=self,
                    component=basic_component,
                    defaults={'amount': final_basic}
                )
            
        statutory_deductions_val = Decimal(0)
        advance_recovery_val = Decimal(0)
        
        for comp in components:
            calc_type = comp.component.calculation_type
            base_amount = comp.amount
            final_amount = Decimal(0)
            
            # Apply Calculation Logic
            if calc_type == 'fixed':
                final_amount = base_amount
                
            elif calc_type == 'percentage':
                # Assumption: Percentage components (like PF) are prorated.
                final_amount = base_amount * proration_ratio
                
            elif calc_type == 'attendance_prorated':
                final_amount = base_amount * proration_ratio
                
            elif calc_type == 'per_day':
                # Assumes the EmployeeSalaryComponent.amount is the DAILY RATE
                final_amount = base_amount * paid_days
                
            else:
                # Default to fixed if unknown or formula (for now)
                final_amount = base_amount
 
            # Round to 2 decimal places
            final_amount = final_amount.quantize(Decimal('0.01'))
            
            # Create PaySlipComponent
            PaySlipComponent.objects.create(
                payslip=self,
                component=comp.component,
                amount=final_amount,
                is_manual=False
            )
            
            # Add to totals
            if comp.component.component_type == 'earning':
                total_earnings += final_amount
            else:
                total_deductions += final_amount
                if comp.component.is_statutory:
                    statutory_deductions_val += final_amount
        
        # Add Manual Components to totals
        manual_components = self.components.filter(is_manual=True)
        for mc in manual_components:
            if mc.component.component_type == 'earning':
                total_earnings += mc.amount
            else:
                total_deductions += mc.amount
                if mc.component.is_statutory:
                    statutory_deductions_val += mc.amount
                
        # 4. Update Totals
        self.gross_earnings = total_earnings + self.overtime_amount
        self.total_deductions = total_deductions
        self.net_salary = self.gross_earnings - self.total_deductions
        
        # Determine LOP Deduction Amount for display calculation
        # LOP Deduction = (Total Potential Earnings) - (Actual Earnings)
        # Potential Earnings (as if 100% attendance)
        potential_earnings = self.employee_salary.basic_salary # Start with Basic
        for comp in components:
            if comp.component.component_type == 'earning':
                potential_earnings += comp.amount
                
        self.lop_deduction = (potential_earnings - total_earnings).quantize(Decimal('0.01'))
 
        # 5. Handle Statutory Deductions based on settings
        settings = PayrollSettings.objects.filter(company=self.employee.company).first()
        if settings:
            # PF Calculation
            if settings.pf_enabled:
                pf_component = SalaryComponent.objects.filter(company=self.employee.company, statutory_type='pf', is_active=True).first()
                if pf_component and not self.components.filter(component=pf_component).exists():
                    pf_base = final_basic if basic_salary > 0 else Decimal(0)
                    if settings.pf_is_restricted_basic:
                        pf_base = min(pf_base, settings.pf_wage_ceiling)
                    
                    pf_emp_amount = (pf_base * settings.pf_contribution_rate_employee / 100).quantize(Decimal('0.01'))
                    if pf_emp_amount > 0:
                        PaySlipComponent.objects.create(payslip=self, component=pf_component, amount=pf_emp_amount, is_manual=False)
                        self.total_deductions += pf_emp_amount
                        statutory_deductions_val += pf_emp_amount
 
            # ESI Calculation
            if settings.esi_enabled:
                esi_component = SalaryComponent.objects.filter(company=self.employee.company, statutory_type='esi', is_active=True).first()
                if esi_component and not self.components.filter(component=esi_component).exists():
                    # ESI is usually on Gross Earning
                    if self.gross_earnings <= settings.esi_wage_ceiling:
                        esi_emp_amount = (self.gross_earnings * settings.esi_contribution_rate_employee / 100).quantize(Decimal('0.01'))
                        if esi_emp_amount > 0:
                            PaySlipComponent.objects.create(payslip=self, component=esi_component, amount=esi_emp_amount, is_manual=False)
                            self.total_deductions += esi_emp_amount
                            statutory_deductions_val += esi_emp_amount
 
            # TDS logic (existing but refactored to use fetched settings)
            if not settings.enable_auto_tds:
                tds_comps = self.components.filter(component__statutory_type='tds')
                for tc in tds_comps:
                    if tc.component.component_type == 'deduction':
                        self.total_deductions -= tc.amount
                        statutory_deductions_val -= tc.amount # Safe subtract
                tds_comps.delete()
        
        # 5. Process Loan EMIs
        unpaid_emis = EMI.objects.filter(
            loan__employee=self.employee,
            month=self.payroll_period.month,
            year=self.payroll_period.year,
            status='unpaid',
            payslip__isnull=True
        )
        
        # Aggregate by type to avoid duplicates and distinguish Advance
        emi_aggregates = {} # code -> {'amount': ..., 'name': ..., 'emis': []}
        
        for emi in unpaid_emis:
            is_advance = emi.loan.loan_type in ['advance', 'Salary Advance']
            
            comp_code = 'SALARY_ADVANCE' if is_advance else 'LOAN_EMI'
            comp_name = 'Salary Advance Recovery' if is_advance else 'Loan EMI'
            
            if comp_code not in emi_aggregates:
                emi_aggregates[comp_code] = {
                    'amount': Decimal(0),
                    'name': comp_name,
                    'emis': []
                }
            
            emi_aggregates[comp_code]['amount'] += emi.amount
            emi_aggregates[comp_code]['emis'].append(emi)
            
        for code, data in emi_aggregates.items():
            amount = data['amount']
            
            # Get or Create Component
            loan_component = SalaryComponent.objects.filter(
                company=self.employee.company, 
                code=code
            ).first()
            
            if not loan_component:
                loan_component = SalaryComponent.objects.create(
                    company=self.employee.company,
                    name=data['name'],
                    code=code,
                    component_type='deduction',
                    statutory_type='other'
                )
            
            if not self.components.filter(component=loan_component).exists():
                PaySlipComponent.objects.create(
                    payslip=self,
                    component=loan_component,
                    amount=amount,
                    is_manual=False
                )
                self.total_deductions += amount
                
                if code == 'SALARY_ADVANCE':
                    advance_recovery_val += amount
                
                for emi in data['emis']:
                    emi.payslip = self
                    emi.save()

        # 6. Process Adhoc Payments (Bonuses, Incentives)
        # Fetch pending payments for this employee
        # If payroll_period is specified in AdhocPayment, it must match current period
        # If payroll_period is None, it's picked up by the first available payroll
        pending_adhoc_payments = AdhocPayment.objects.filter(
            employee=self.employee,
            status='pending'
        ).filter(
            models.Q(payroll_period=self.payroll_period) | models.Q(payroll_period__isnull=True)
        )
        
        for payment in pending_adhoc_payments:
            # Determine component to use
            comp_to_use = payment.component
            if not comp_to_use:
                # Default to a generic "Bonus" or "Incentive" component if not duplicate
                # Try to find one by name based on payment name, otherwise generic
                comp_to_use = SalaryComponent.objects.filter(
                    company=self.employee.company,
                    name__icontains='Bonus',
                    component_type='earning'
                ).first()
                
                if not comp_to_use:
                     # Create a temporary/adhoc component if needed, or error out.
                     # For safety, let's look for ANY earning component
                     comp_to_use = SalaryComponent.objects.filter(
                        company=self.employee.company,
                        component_type='earning'
                    ).first()
            
            if comp_to_use:
                # Add to payslip components
                # Check if we already added a component of this type? 
                # Adhoc payments might be multiple of same type, so we might need to aggregate or allow duplicates.
                # PaySlipComponent unique_together is (payslip, component).
                # So we must aggregate if multiple payments map to same component.
                
                existing_item = PaySlipComponent.objects.filter(
                    payslip=self, 
                    component=comp_to_use
                ).first()
                
                if existing_item:
                    existing_item.amount += payment.amount
                    existing_item.save()
                else:
                    PaySlipComponent.objects.create(
                        payslip=self,
                        component=comp_to_use,
                        amount=payment.amount
                    )
                
                if comp_to_use.component_type == 'earning':
                    self.gross_earnings += payment.amount
                else:
                    self.total_deductions += payment.amount
                    
                # Link payment to this payslip
                payment.processed_in_payslip = self
                # We do NOT change status to processed here yet, usually done when Payslip is finalized/approved.
                # However, for calculation purposes, we just link it.
                # If we want to prevent re-calculation picking it up again, we rely on the link.
                payment.save()
 
        # Update granular fields
        self.statutory_deductions = statutory_deductions_val
        self.advance_recovery = advance_recovery_val
        # Final Net Salary Update
        self.net_salary = self.gross_earnings - self.total_deductions


class PaySlipComponent(BaseModel):
    """Line items in a payslip"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payslip = models.ForeignKey(PaySlip, on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_manual = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['payslip', 'component']

    def __str__(self):
        return f"{self.payslip} - {self.component.name}: ₹{self.amount}"



class AdhocPayment(BaseModel):
    """
    One-time payments like Bonuses, Incentives, Reimbursements, etc.
    These are processed in the next payroll run.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='adhoc_payments')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='adhoc_payments')
    
    name = models.CharField(max_length=200) # e.g. "Performance Bonus Q4"
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Optional: Link to a specific component for tax classification
    component = models.ForeignKey(SalaryComponent, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Optional: Lock to a specific payroll period (if null, picked up by next available payroll)
    payroll_period = models.ForeignKey('PayrollPeriod', on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date = models.DateField(default=timezone.now)
    
    # Link to the payslip that processed this payment
    processed_in_payslip = models.ForeignKey('PaySlip', on_delete=models.SET_NULL, null=True, blank=True, related_name='adhoc_payments')
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Adhoc Payment'
        verbose_name_plural = 'Adhoc Payments'
        
    def __str__(self):
        return f"{self.employee} - {self.name}: ₹{self.amount}"


class Loan(BaseModel):
    """Employee Loan and Advance tracking"""
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='loans')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='loans')
    
    loan_type = models.CharField(max_length=50) # Advance, Personal, etc.
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tenure_months = models.PositiveIntegerField()
    
    disbursement_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    remarks = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.total_payable or self.total_payable == 0:
            # Simple interest for now: P + (P * R * T / 100)
            # T is in years, tenure is in months
            interest = (self.principal_amount * self.interest_rate * self.tenure_months) / (12 * 100)
            self.total_payable = (self.principal_amount + interest).quantize(Decimal('0.01'))
            if not self.balance_amount or self.balance_amount == 0:
                self.balance_amount = self.total_payable
        super().save(*args, **kwargs)

    def generate_emis(self):
        """Generates EMI schedule"""
        if self.status not in ['approved', 'disbursed']:
            return
        
        if self.emis.exists():
            return
            
        emi_amount = (self.total_payable / self.tenure_months).quantize(Decimal('0.01'))
        
        # Determine Start Date
        start_date = self.disbursement_date or self.created_at.date()
        
        curr_month = start_date.month
        curr_year = start_date.year
        
        # Logic: 
        # Standard Loans -> Recovery starts Next Month
        # Salary Advance -> Recovery starts Same Month (usually)
        
        is_advance = self.loan_type in ['advance', 'Salary Advance']
        
        if is_advance:
            # We want the first loop to result in curr_month. 
            # Since the loop does `curr_month += 1`, we decrement it once here.
            curr_month -= 1
            if curr_month == 0:
                curr_month = 12
                curr_year -= 1
        
        for i in range(self.tenure_months):
            curr_month += 1
            if curr_month > 12:
                curr_month = 1
                curr_year += 1
            
            EMI.objects.create(
                loan=self,
                amount=emi_amount,
                month=curr_month,
                year=curr_year,
                status='unpaid'
            )

    def __str__(self):
        return f"{self.employee.full_name} - {self.loan_type} (₹{self.principal_amount})"


class EMI(BaseModel):
    """Monthly installment for a loan"""
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('skipped', 'Skipped'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='emis')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    payslip = models.ForeignKey('PaySlip', on_delete=models.SET_NULL, null=True, blank=True, related_name='loan_emis')
    
    class Meta:
        ordering = ['year', 'month']
        verbose_name_plural = 'EMIs'

    def __str__(self):
        return f"{self.loan.employee.full_name} - EMI ₹{self.amount} ({self.month}/{self.year})"


class TaxSlab(BaseModel):
    """Income Tax Slabs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='tax_slabs')
    
    REGIME_CHOICES = [
        ('new', 'New Regime'),
        ('old', 'Old Regime'),
    ]
    
    regime = models.CharField(max_length=10, choices=REGIME_CHOICES)
    min_income = models.DecimalField(max_digits=12, decimal_places=2)
    max_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage')
    cess = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Health and Education Cess %')
    
    class Meta:
        ordering = ['regime', 'min_income']
        verbose_name_plural = 'Tax Slabs'

    def __str__(self):
        max_val = f"₹{self.max_income}" if self.max_income else "Above"
        return f"{self.get_regime_display()}: ₹{self.min_income} - {max_val} @ {self.tax_rate}%"


class TaxDeclaration(BaseModel):
    """Employee Tax Declarations (80C, HRA, etc)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='tax_declarations')
    
    REGIME_CHOICES = [
        ('new', 'New Regime'),
        ('old', 'Old Regime'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    financial_year = models.CharField(max_length=9, help_text='e.g., 2025-2026')
    regime = models.CharField(max_length=10, choices=REGIME_CHOICES, default='new')
    
    # Store dynamic declarations as JSON
    # Structure: [{'type': '80C', 'amount': 150000, 'description': 'LIC Premium'}, ...]
    declarations = models.JSONField(default=list)
    
    total_declared_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    verification_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_declarations'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['employee', 'financial_year']

    def __str__(self):
        return f"{self.employee.first_name} - {self.financial_year} ({self.status})"


class PayrollSettings(BaseModel):
    """Global payroll and tax settings for an organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='payroll_settings')
    
    # TDS Settings
    enable_auto_tds = models.BooleanField(default=True, help_text='Enable automatic TDS calculation during payroll')
    financial_year = models.CharField(max_length=9, default='2025-2026', help_text='Current financial year (e.g., 2025-2026)')
    
    REGIME_CHOICES = [
        ('new', 'New Regime'),
        ('old', 'Old Regime'),
    ]
    default_tax_regime = models.CharField(max_length=10, choices=REGIME_CHOICES, default='new')
    allow_manual_tds_override = models.BooleanField(default=False, help_text='Allow admin to manually override TDS amounts')
    apply_tds_monthly = models.BooleanField(default=True, help_text='Standard monthly TDS deduction')
    
    # PF Settings
    pf_enabled = models.BooleanField(default=True)
    pf_contribution_rate_employer = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('12.00'))
    pf_contribution_rate_employee = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('12.00'))
    pf_wage_ceiling = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('15000.00'))
    pf_is_restricted_basic = models.BooleanField(default=True, help_text='Restrict PF calculation to ceiling if basic > ceiling')
    pf_include_employer_share_in_ctc = models.BooleanField(default=True)

    # ESI Settings
    esi_enabled = models.BooleanField(default=True)
    esi_contribution_rate_employer = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('3.25'))
    esi_contribution_rate_employee = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.75'))
    esi_wage_ceiling = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('21000.00'))

    class Meta:
        verbose_name_plural = 'Payroll Settings'

    def __str__(self):
        return f"Payroll Settings- {self.company.name}"
