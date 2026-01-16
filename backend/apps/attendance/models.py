from django.db import models
from apps.core.models import Company, Employee
from datetime import timedelta


class Shift(models.Model):
    """Work shift timings"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='shifts')
    name = models.CharField(max_length=50)  # General, Morning, Night, etc.
    code = models.CharField(max_length=10, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_duration = models.PositiveIntegerField(default=60, help_text='Break duration in minutes')
    grace_period = models.PositiveIntegerField(default=15, help_text='Late grace period in minutes')
    half_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=4.0, help_text='Hours for half day')
    full_day_hours = models.DecimalField(max_digits=4, decimal_places=2, default=8.0, help_text='Hours for full day')
    is_night_shift = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'code']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"
    
    @property
    def working_hours(self):
        """Calculate expected working hours (excluding break)"""
        from datetime import datetime
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        if self.is_night_shift:
            end += timedelta(days=1)
        duration = (end - start).seconds / 3600
        return duration - (self.break_duration / 60)


class Attendance(models.Model):
    """Daily attendance record"""
    
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('week_off', 'Week Off'),
        ('holiday', 'Holiday'),
        ('on_leave', 'On Leave'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Punch times
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    
    # Calculated fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    work_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Actual hours worked')
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Flags
    is_late = models.BooleanField(default=False)
    is_early_leave = models.BooleanField(default=False)
    late_minutes = models.PositiveIntegerField(default=0)
    early_leave_minutes = models.PositiveIntegerField(default=0)
    
    # Additional info
    remarks = models.TextField(blank=True)
    source = models.CharField(max_length=20, default='manual', help_text='manual/biometric/api')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date', 'employee']
        verbose_name_plural = 'Attendances'

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} - {self.status}"
    
    def calculate_hours(self):
        """Calculate work hours from check-in and check-out"""
        if self.check_in and self.check_out:
            duration = self.check_out - self.check_in
            hours = duration.total_seconds() / 3600
            # Subtract break if shift is assigned
            if self.shift:
                hours -= (self.shift.break_duration / 60)
            self.work_hours = max(0, round(hours, 2))
    
    def check_late_status(self):
        """Check if employee was late"""
        if self.check_in and self.shift:
            from datetime import datetime
            shift_start = datetime.combine(self.date, self.shift.start_time)
            grace_end = shift_start + timedelta(minutes=self.shift.grace_period)
            
            if self.check_in.replace(tzinfo=None) > grace_end:
                self.is_late = True
                self.late_minutes = int((self.check_in.replace(tzinfo=None) - shift_start).seconds / 60)
    
    def save(self, *args, **kwargs):
        self.calculate_hours()
        self.check_late_status()
        
        # Auto-set status based on hours
        if self.check_in and self.check_out and self.shift:
            if self.work_hours >= float(self.shift.full_day_hours):
                self.status = 'present'
            elif self.work_hours >= float(self.shift.half_day_hours):
                self.status = 'half_day'
        
        super().save(*args, **kwargs)


class Holiday(models.Model):
    """Company holidays"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_optional = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['company', 'date']
        ordering = ['date']

    def __str__(self):
        return f"{self.name} - {self.date}"
