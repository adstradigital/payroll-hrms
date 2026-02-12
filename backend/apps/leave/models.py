from django.db import models
from apps.accounts.models import Organization, Employee
from datetime import date
import logging

logger = logging.getLogger(__name__)


class LeaveType(models.Model):
    """Types of leaves available in the company"""
    ACCRUAL_CHOICES = [
        ('full_year', 'Full Year (at Start)'),
        ('monthly', 'Monthly Accrual'),
        ('quarterly', 'Quarterly Accrual'),
    ]
    
    RESET_CHOICES = [
        ('calendar', 'Calendar Year (Jan-Dec)'),
        ('fiscal', 'Fiscal Year (Apr-Mar)'),
    ]
    
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=50)  # Casual Leave, Sick Leave, etc.
    code = models.CharField(max_length=10, null=True, blank=True)  # Optional CL, SL, EL, etc.
    description = models.TextField(blank=True)
    
    # Allocation settings
    days_per_year = models.DecimalField(max_digits=5, decimal_places=2, default=12)
    accrual_type = models.CharField(max_length=20, choices=ACCRUAL_CHOICES, default='full_year')
    reset_cycle = models.CharField(max_length=20, choices=RESET_CHOICES, default='calendar')
    max_consecutive_days = models.PositiveIntegerField(default=3, help_text='Max days allowed in one request')
    
    # Rules
    is_paid = models.BooleanField(default=True)
    is_carry_forward = models.BooleanField(default=False)
    max_carry_forward_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_encashable = models.BooleanField(default=False, help_text='Can be converted to money')
    
    # Eligibility
    applicable_after_months = models.PositiveIntegerField(default=0, help_text='Months after joining')
    requires_document = models.BooleanField(default=False, help_text='Requires medical certificate etc.')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class LeaveBalance(models.Model):
    """Employee's leave balance for each type"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.PositiveIntegerField()
    
    # Balance tracking
    allocated = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    used = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pending = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Pending approval')
    carry_forward = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'leave_type', 'year']
        ordering = ['employee', 'leave_type']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.code} ({self.year})"
    
    @property
    def available(self):
        return self.allocated + self.carry_forward - self.used - self.pending


class LeaveRequest(models.Model):
    """Leave application by employee"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    DAY_TYPE_CHOICES = [
        ('full', 'Full Day'),
        ('first_half', 'First Half'),
        ('second_half', 'Second Half'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    start_day_type = models.CharField(max_length=15, choices=DAY_TYPE_CHOICES, default='full')
    end_day_type = models.CharField(max_length=15, choices=DAY_TYPE_CHOICES, default='full')
    
    # Calculated
    days_count = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Request details
    reason = models.TextField()
    contact_during_leave = models.CharField(max_length=15, blank=True)
    document = models.FileField(upload_to='leave_documents/', blank=True, null=True)
    
    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type.code} ({self.start_date} to {self.end_date})"
    
    def calculate_days(self):
        """Calculate number of leave days excluding holidays and weekends"""
        from datetime import timedelta
        from decimal import Decimal
        from apps.attendance.models import Holiday, AttendancePolicy
        
        if self.start_date > self.end_date:
            return Decimal('0')
            
        # Get company holidays in the date range
        holidays = Holiday.objects.filter(
            company=self.employee.company,
            date__range=(self.start_date, self.end_date),
            is_active=True,
            holiday_type='public' # Usually only public holidays count against leave
        ).values_list('date', flat=True)
        
        # Get attendance policy for weekends
        policy = AttendancePolicy.objects.filter(
            company=self.employee.company,
            is_active=True
        ).first()
        
        total_days = Decimal('0')
        current_date = self.start_date
        
        while current_date <= self.end_date:
            is_holiday = current_date in holidays
            is_weekend = False
            
            if policy:
                is_weekend = not policy.is_working_day(current_date)
            else:
                # Fallback to Sat/Sun
                is_weekend = current_date.weekday() >= 5
                
            if not is_holiday and not is_weekend:
                # Normal work day
                day_value = Decimal('1.0')
                if current_date == self.start_date and self.start_day_type != 'full':
                    day_value = Decimal('0.5')
                elif current_date == self.end_date and self.end_day_type != 'full':
                    day_value = Decimal('0.5')
                
                total_days += day_value
            
            current_date += timedelta(days=1)
            
        return total_days
    
    def save(self, *args, **kwargs):
        # Auto-calculate days
        self.days_count = self.calculate_days()
        super().save(*args, **kwargs)
    
    def approve(self, approved_by_employee):
        """Approve the leave request"""
        from django.utils import timezone
        
        self.status = 'approved'
        self.approved_by = approved_by_employee
        self.approved_at = timezone.now()
        self.save()
        
        # Send notification
        try:
            from .emails import send_leave_status_email
            send_leave_status_email(self, 'approved')
        except Exception as e:
            logger.error(f"Failed to trigger leave approval email: {str(e)}")
        
        # Update leave balance
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=self.employee,
            leave_type=self.leave_type,
            year=self.start_date.year,
            defaults={'allocated': self.leave_type.days_per_year}
        )
        balance.pending -= self.days_count
        balance.used += self.days_count
        balance.save()
    
    def reject(self, rejection_reason):
        """Reject the leave request"""
        self.status = 'rejected'
        self.rejection_reason = rejection_reason
        self.save()
        
        # Send notification
        try:
            from .emails import send_leave_status_email
            send_leave_status_email(self, 'rejected')
        except Exception as e:
            logger.error(f"Failed to trigger leave rejection email: {str(e)}")
        
        # Remove from pending
        try:
            balance = LeaveBalance.objects.get(
                employee=self.employee,
                leave_type=self.leave_type,
                year=self.start_date.year
            )
            balance.pending -= self.days_count
            balance.save()
        except LeaveBalance.DoesNotExist:
            pass
