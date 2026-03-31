from django.db import models
from django.core.validators import MinValueValidator

# NOTE: We do NOT import from apps.payroll.models here to avoid circular imports.
# All ForeignKey references use lazy string format 'app_label.ModelName'.
# app_label is the last segment of the AppConfig.name:
#   - 'apps.accounts' -> app_label = 'accounts'
#   - 'apps.payroll'  -> app_label = 'payroll'


class CommissionRule(models.Model):
    """
    Defines rules for commission calculation.
    Can be assigned to a specific employee or a designation.
    """
    RULE_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage of Sales'),
        ('FLAT', 'Flat Rate per Sale'),
    ]

    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES, default='PERCENTAGE')
    value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage (e.g. 5.00) or Flat Amount")

    # Optional assignment
    designation = models.ForeignKey(
        'accounts.Designation', on_delete=models.SET_NULL, null=True, blank=True
    )
    employee = models.ForeignKey(
        'accounts.Employee', on_delete=models.SET_NULL, null=True, blank=True
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.value} {self.get_rule_type_display()})"


class SalesRecord(models.Model):
    """
    Tracks sales transactions for commission calculation.
    """
    employee = models.ForeignKey(
        'accounts.Employee', on_delete=models.CASCADE, related_name='sales_records'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    date = models.DateField()
    description = models.TextField(blank=True)
    reference_number = models.CharField(max_length=50, blank=True, help_text="Invoice or Order ID")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale by {self.employee}: {self.amount} on {self.date}"


class CommissionHistory(models.Model):
    """
    Tracks calculated commissions for a specific payroll period.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PROCESSED', 'Processed (Added to Payroll)'),
    ]

    employee = models.ForeignKey('accounts.Employee', on_delete=models.CASCADE)
    period = models.ForeignKey('payroll.PayrollPeriod', on_delete=models.CASCADE)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2)
    calculated_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    adhoc_payment = models.OneToOneField(
        'payroll.AdhocPayment',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='commission_source'
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Commission Histories"
        unique_together = ['employee', 'period']

    def __str__(self):
        return f"Commission for {self.employee} ({self.period}): {self.calculated_amount}"
