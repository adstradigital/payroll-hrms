from django.db import models
from apps.accounts.models import Organization, Employee
from decimal import Decimal


class SalaryComponent(models.Model):
    """Earning or Deduction components"""
    
    TYPE_CHOICES = [
        ('earning', 'Earning'),
        ('deduction', 'Deduction'),
    ]
    
    CALCULATION_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage of Basic'),
        ('formula', 'Custom Formula'),
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'code']
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.component_type})"


class SalaryStructure(models.Model):
    """Template for employee salary composition"""
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='salary_structures')
    name = models.CharField(max_length=100)  # Manager Grade, Executive Grade, etc.
    code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class SalaryStructureComponent(models.Model):
    """Components included in a salary structure"""
    salary_structure = models.ForeignKey(
        SalaryStructure, on_delete=models.CASCADE, related_name='components'
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    
    # Override defaults
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['salary_structure', 'component']

    def __str__(self):
        return f"{self.salary_structure.name} - {self.component.name}"


class EmployeeSalary(models.Model):
    """Actual salary assigned to an employee"""
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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


class EmployeeSalaryComponent(models.Model):
    """Individual component breakup for employee's salary"""
    employee_salary = models.ForeignKey(
        EmployeeSalary, on_delete=models.CASCADE, related_name='components'
    )
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['employee_salary', 'component']

    def __str__(self):
        return f"{self.employee_salary.employee.employee_id} - {self.component.name}: ₹{self.amount}"


class PayrollPeriod(models.Model):
    """Monthly payroll batch"""
    
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
    
    processed_by = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payrolls'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class PaySlip(models.Model):
    """Individual employee payslip"""
    
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
    
    # LOP/Overtime adjustments
    lop_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'payroll_period']
        ordering = ['-payroll_period__year', '-payroll_period__month']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.payroll_period.name}"
    
    def calculate_salary(self):
        """Calculate salary based on attendance"""
        if not self.employee_salary:
            return
        
        monthly_salary = self.employee_salary.gross_salary
        per_day_salary = monthly_salary / Decimal(self.working_days) if self.working_days else 0
        
        # Calculate LOP deduction
        self.lop_deduction = per_day_salary * Decimal(self.lop_days)
        
        # Get components from employee salary
        components = self.employee_salary.components.select_related('component').all()
        
        earnings = Decimal(0)
        deductions = Decimal(0)
        
        for comp in components:
            if comp.component.component_type == 'earning':
                earnings += comp.amount
            else:
                deductions += comp.amount
        
        # Adjust for LOP (proportionally reduce earnings)
        if self.lop_days > 0 and self.working_days > 0:
            lop_ratio = Decimal(self.lop_days) / Decimal(self.working_days)
            self.lop_deduction = earnings * lop_ratio
            earnings -= self.lop_deduction
        
        self.gross_earnings = earnings + self.overtime_amount
        self.total_deductions = deductions
        self.net_salary = self.gross_earnings - self.total_deductions


class PaySlipComponent(models.Model):
    """Line items in a payslip"""
    payslip = models.ForeignKey(PaySlip, on_delete=models.CASCADE, related_name='components')
    component = models.ForeignKey(SalaryComponent, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['payslip', 'component']

    def __str__(self):
        return f"{self.payslip} - {self.component.name}: ₹{self.amount}"
