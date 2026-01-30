from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, Sum, Count, Avg
from datetime import datetime, timedelta, time
import uuid

from apps.accounts.models import Employee, Company, Department


class AttendancePolicy(models.Model):
    """Company-wide or department-specific attendance policies"""
    POLICY_TYPE_CHOICES = (
        ('company', 'Company Wide'),
        ('department', 'Department Specific'),
    )
    
    WORKING_DAYS_CHOICES = (
        ('5_days', '5 Days (Mon-Fri)'),
        ('6_days', '6 Days (Mon-Sat)'),
        ('custom', 'Custom'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='attendance_policies')
    department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='attendance_policies',
        help_text='Leave blank for company-wide policy'
    )
    
    name = models.CharField(max_length=200)
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPE_CHOICES, default='company')
    
    # Working hours
    working_days = models.CharField(max_length=20, choices=WORKING_DAYS_CHOICES, default='5_days')
    work_start_time = models.TimeField(default=time(9, 0))
    work_end_time = models.TimeField(default=time(18, 0))
    
    # Custom working days (for 'custom' option)
    monday = models.BooleanField(default=True)
    tuesday = models.BooleanField(default=True)
    wednesday = models.BooleanField(default=True)
    thursday = models.BooleanField(default=True)
    friday = models.BooleanField(default=True)
    saturday = models.BooleanField(default=False)
    sunday = models.BooleanField(default=False)
    
    # Break times
    lunch_break_start = models.TimeField(default=time(13, 0))
    lunch_break_end = models.TimeField(default=time(14, 0))
    
    # Grace period and overtime
    grace_period_minutes = models.PositiveIntegerField(default=15)
    half_day_hours = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=4.0,
        help_text='Minimum hours for half day'
    )
    full_day_hours = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=8.0,
        help_text='Minimum hours for full day'
    )
    
    # Overtime settings
    overtime_applicable = models.BooleanField(default=True)
    overtime_rate_multiplier = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=1.5,
        help_text='Multiplier for overtime pay (e.g., 1.5 for time-and-a-half)'
    )
    
    # Late arrival and early departure
    max_late_arrivals_per_month = models.PositiveIntegerField(default=3)
    late_arrival_penalty_minutes = models.PositiveIntegerField(
        default=0,
        help_text='Deduction in minutes per late arrival'
    )
    
    # Attendance tracking
    auto_mark_absent = models.BooleanField(
        default=True,
        help_text='Automatically mark as absent if no check-in'
    )
    require_checkout = models.BooleanField(default=True)
    allow_mobile_checkin = models.BooleanField(default=True)
    enable_geo_fencing = models.BooleanField(default=False)
    
    # Geo-fencing (if enabled)
    office_latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True
    )
    office_longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True
    )
    geo_fence_radius_meters = models.PositiveIntegerField(
        default=100,
        help_text='Radius in meters for geo-fencing'
    )
    
    # Feature Toggles
    enable_shift_system = models.BooleanField(default=True, help_text='Allow multiple work shifts')
    track_break_time = models.BooleanField(default=True, help_text='Record break duration')
    allow_flexible_hours = models.BooleanField(default=False, help_text='Employees can adjust timing')
    overtime_after_minutes = models.PositiveIntegerField(default=480, help_text='Minutes after which overtime counts')
    
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Attendance Policies'
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['department', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.company.name}"

    def clean(self):
        """Validate policy"""
        if self.effective_to and self.effective_to < self.effective_from:
            raise ValidationError('Effective to date cannot be before effective from date')
        
        if self.work_end_time <= self.work_start_time:
            raise ValidationError('Work end time must be after work start time')
        
        if self.policy_type == 'department' and not self.department:
            raise ValidationError('Department is required for department-specific policy')

    def get_working_hours(self):
        """Calculate total working hours per day"""
        start = datetime.combine(datetime.today(), self.work_start_time)
        end = datetime.combine(datetime.today(), self.work_end_time)
        break_start = datetime.combine(datetime.today(), self.lunch_break_start)
        break_end = datetime.combine(datetime.today(), self.lunch_break_end)
        
        total_hours = (end - start).total_seconds() / 3600
        break_hours = (break_end - break_start).total_seconds() / 3600
        
        return total_hours - break_hours

    def is_working_day(self, date):
        """Check if given date is a working day"""
        weekday = date.weekday()  # 0=Monday, 6=Sunday
        day_map = {
            0: self.monday,
            1: self.tuesday,
            2: self.wednesday,
            3: self.thursday,
            4: self.friday,
            5: self.saturday,
            6: self.sunday,
        }
        return day_map.get(weekday, False)


class Shift(models.Model):
    """Shift management for employees"""
    SHIFT_TYPE_CHOICES = (
        ('morning', 'Morning Shift'),
        ('evening', 'Evening Shift'),
        ('night', 'Night Shift'),
        ('general', 'General Shift'),
        ('rotational', 'Rotational'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('accounts.Organization', on_delete=models.CASCADE, related_name='shifts')
    name = models.CharField(max_length=100)
    shift_type = models.CharField(max_length=20, choices=SHIFT_TYPE_CHOICES, default='general')
    code = models.CharField(max_length=20)
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Break times
    break_duration_minutes = models.PositiveIntegerField(default=60)
    
    # Grace and buffer
    grace_period_minutes = models.PositiveIntegerField(
        default=15,
        help_text='Grace period for late arrival'
    )
    early_departure_grace_minutes = models.PositiveIntegerField(
        default=0,
        help_text='Grace period for early departure'
    )
    buffer_before_minutes = models.PositiveIntegerField(
        default=30,
        help_text='How early employees can check in (Early Come)'
    )
    buffer_after_minutes = models.PositiveIntegerField(
        default=30,
        help_text='How late employees can check out (Late Going)'
    )
    
    # Working days for this shift
    working_days = models.JSONField(
        default=list,
        help_text='List of working days: [0-6] where 0=Monday, 6=Sunday'
    )
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    color_code = models.CharField(max_length=7, default='#3B82F6', help_text='Hex color code')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'code')
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['company', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

    def get_shift_duration(self):
        """Calculate shift duration in hours"""
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        
        # Handle overnight shifts
        if end < start:
            end += timedelta(days=1)
        
        duration_seconds = (end - start).total_seconds()
        break_seconds = self.break_duration_minutes * 60
        
        return (duration_seconds - break_seconds) / 3600


class EmployeeShiftAssignment(models.Model):
    """Assign shifts to employees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shift_assignments')
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='employee_assignments')
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['employee', 'is_active']),
            models.Index(fields=['shift', 'is_active']),
            models.Index(fields=['effective_from', 'effective_to']),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.shift.name}"

    def clean(self):
        """Validate assignment"""
        if self.effective_to and self.effective_to < self.effective_from:
            raise ValidationError('Effective to date cannot be before effective from date')


class Attendance(models.Model):
    """Daily attendance records"""
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('holiday', 'Holiday'),
        ('week_off', 'Week Off'),
        ('work_from_home', 'Work From Home'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField(db_index=True)
    
    # Check-in/out times
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    # Actual shift for the day
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    
    # Hours calculation
    total_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        help_text='Total working hours'
    )

    overtime_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0
    )
    break_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0
    )
    
    # Flags
    is_late = models.BooleanField(default=False)
    is_early_departure = models.BooleanField(default=False)
    late_by_minutes = models.PositiveIntegerField(default=0)
    early_departure_minutes = models.PositiveIntegerField(default=0)
    
    # Location tracking
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Device info
    check_in_device = models.CharField(max_length=100, blank=True)
    check_out_device = models.CharField(max_length=100, blank=True)
    check_in_ip = models.GenericIPAddressField(null=True, blank=True)
    check_out_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Approval
    is_regularized = models.BooleanField(default=False)
    regularization_reason = models.TextField(blank=True)
    regularized_by = models.ForeignKey(
        Employee, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='regularized_attendances'
    )
    regularized_at = models.DateTimeField(null=True, blank=True)
    
    # System fields
    remarks = models.TextField(blank=True)
    is_auto_marked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
            models.Index(fields=['employee', 'status']),
        ]
        verbose_name_plural = 'Attendances'

    def __str__(self):
        return f"{self.employee.full_name} - {self.date} - {self.status}"

    def calculate_hours(self):
        """Calculate total working hours"""
        # Recalculate break hours from related AttendanceBreak objects
        if self.pk:
            total_break_seconds = 0
            completed_breaks = self.breaks.filter(break_end__isnull=False)
            for brk in completed_breaks:
                duration = brk.break_end - brk.break_start
                total_break_seconds += duration.total_seconds()
            
            self.break_hours = round(total_break_seconds / 3600, 2)
        
        if self.check_in_time and self.check_out_time:
            duration = self.check_out_time - self.check_in_time
            total_seconds = duration.total_seconds()
            
            # Subtract break hours
            break_seconds = float(self.break_hours) * 3600
            working_seconds = max(0, total_seconds - break_seconds) # Ensure non-negative
            
            self.total_hours = round(working_seconds / 3600, 2)
            
            # Calculate overtime if shift is assigned
            if self.shift:
                expected_hours = self.shift.get_shift_duration()
                # Check overtime threshold from policy or default
                policy = self.employee.company.attendance_policies.filter(is_active=True).first()
                overtime_threshold = policy.overtime_after_minutes / 60 if (policy and policy.overtime_after_minutes) else expected_hours
                
                if self.total_hours > overtime_threshold:
                    self.overtime_hours = round(self.total_hours - expected_hours, 2)
            
            # Determine status based on hours
            policy = self.employee.company.attendance_policies.filter(is_active=True).first()
            if policy:
                if self.total_hours >= float(policy.full_day_hours):
                    self.status = 'present'
                elif self.total_hours >= float(policy.half_day_hours):
                    self.status = 'half_day'
                else:
                    self.status = 'absent'

    def check_late_arrival(self):
        """Check if employee arrived late"""
        if self.check_in_time and self.shift:
            expected_time = datetime.combine(
                self.date, 
                self.shift.start_time
            )
            
            # Add grace period
            grace_time = expected_time + timedelta(minutes=self.shift.grace_period_minutes)
            
            # Make timezone aware if needed
            if timezone.is_aware(self.check_in_time):
                grace_time = timezone.make_aware(grace_time)
            
            if self.check_in_time > grace_time:
                self.is_late = True
                self.late_by_minutes = int((self.check_in_time - grace_time).total_seconds() / 60)
            else:
                self.is_late = False
                self.late_by_minutes = 0

    def check_early_departure(self):
        """Check if employee left early"""
        if self.check_out_time and self.shift:
            expected_time = datetime.combine(
                self.date,
                self.shift.end_time
            )
            
            # Handle overnight shifts
            if self.shift.end_time < self.shift.start_time:
                expected_time += timedelta(days=1)
            
            # Add early departure grace
            grace_time = expected_time - timedelta(minutes=self.shift.early_departure_grace_minutes)
            
            # Make timezone aware if needed
            if timezone.is_aware(self.check_out_time):
                grace_time = timezone.make_aware(grace_time)
            
            if self.check_out_time < grace_time:
                self.is_early_departure = True
                self.early_departure_minutes = int((expected_time - self.check_out_time).total_seconds() / 60)
            else:
                self.is_early_departure = False
                self.early_departure_minutes = 0

    def save(self, *args, **kwargs):
        """Override save to calculate hours"""
        self.calculate_hours()
        self.check_late_arrival()
        self.check_early_departure()
        super().save(*args, **kwargs)


class AttendanceBreak(models.Model):
    """Track multiple breaks during a day"""
    BREAK_TYPE_CHOICES = (
        ('lunch', 'Lunch Break'),
        ('tea', 'Tea Break'),
        ('personal', 'Personal Break'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='breaks')
    break_type = models.CharField(max_length=20, choices=BREAK_TYPE_CHOICES, default='lunch')
    
    break_start = models.DateTimeField()
    break_end = models.DateTimeField(null=True, blank=True)
    
    duration_minutes = models.PositiveIntegerField(default=0)
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['break_start']

    def __str__(self):
        return f"{self.attendance.employee.full_name} - {self.break_type} - {self.break_start.strftime('%H:%M')}"

    def calculate_duration(self):
        """Calculate break duration"""
        if self.break_start and self.break_end:
            duration = self.break_end - self.break_start
            self.duration_minutes = int(duration.total_seconds() / 60)

    def save(self, *args, **kwargs):
        """Override save to calculate duration"""
        self.calculate_duration()
        super().save(*args, **kwargs)


class Holiday(models.Model):
    """Company holidays"""
    HOLIDAY_TYPE_CHOICES = (
        ('public', 'Public Holiday'),
        ('restricted', 'Restricted Holiday'),
        ('optional', 'Optional Holiday'),
        ('working', 'Working Day'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=200)
    date = models.DateField(db_index=True)
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPE_CHOICES, default='public')
    description = models.TextField(blank=True)
    recurring = models.BooleanField(default=False)
    
    # Department specific (optional)
    departments = models.ManyToManyField(
        Department,
        blank=True,
        related_name='holidays',
        help_text='Leave blank for company-wide holiday'
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'date', 'name')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['company', 'date']),
            models.Index(fields=['date', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"


class AttendanceRegularizationRequest(models.Model):
    """Requests to regularize attendance"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance = models.ForeignKey(
        Attendance, 
        on_delete=models.CASCADE, 
        related_name='regularization_requests'
    )
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='regularization_requests')
    
    request_type = models.CharField(
        max_length=50,
        choices=(
            ('missed_checkin', 'Missed Check-in'),
            ('missed_checkout', 'Missed Check-out'),
            ('late_arrival', 'Late Arrival'),
            ('early_departure', 'Early Departure'),
            ('full_day', 'Full Day Regularization'),
        )
    )
    
    # Requested times
    requested_check_in = models.DateTimeField(null=True, blank=True)
    requested_check_out = models.DateTimeField(null=True, blank=True)
    
    reason = models.TextField()
    supporting_document = models.FileField(
        upload_to='attendance/regularization/',
        null=True,
        blank=True
    )
    
    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_regularizations'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_comments = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.request_type} - {self.attendance.date}"


class AttendanceSummary(models.Model):
    """Monthly attendance summary for employees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_summaries')
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    
    # Counts
    total_working_days = models.PositiveIntegerField(default=0)
    present_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)
    half_days = models.PositiveIntegerField(default=0)
    leave_days = models.PositiveIntegerField(default=0)
    holidays = models.PositiveIntegerField(default=0)
    week_offs = models.PositiveIntegerField(default=0)
    
    # Hours
    total_hours_worked = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    overtime_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    
    # Late/Early
    late_arrivals = models.PositiveIntegerField(default=0)
    early_departures = models.PositiveIntegerField(default=0)
    
    # Percentage
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    # Auto-generated
    is_finalized = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'year', 'month')
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['employee', 'year', 'month']),
        ]
        verbose_name_plural = 'Attendance Summaries'

    def __str__(self):
        return f"{self.employee.full_name} - {self.year}-{self.month:02d}"

    def calculate_summary(self):
        """Calculate attendance summary for the month"""
        from calendar import monthrange
        
        # Get all attendance records for the month
        attendances = Attendance.objects.filter(
            employee=self.employee,
            date__year=self.year,
            date__month=self.month
        )
        
        # Calculate counts
        self.present_days = attendances.filter(status='present').count()
        self.absent_days = attendances.filter(status='absent').count()
        self.half_days = attendances.filter(status='half_day').count()
        self.leave_days = attendances.filter(status='on_leave').count()
        self.holidays = attendances.filter(status='holiday').count()
        self.week_offs = attendances.filter(status='week_off').count()
        
        # Calculate hours
        self.total_hours_worked = attendances.aggregate(
            total=Sum('total_hours')
        )['total'] or 0
        self.overtime_hours = attendances.aggregate(
            total=Sum('overtime_hours')
        )['total'] or 0
        
        # Calculate late/early
        self.late_arrivals = attendances.filter(is_late=True).count()
        self.early_departures = attendances.filter(is_early_departure=True).count()
        
        # Calculate total working days (excluding holidays and week offs)
        total_days = monthrange(self.year, self.month)[1]
        self.total_working_days = total_days - self.holidays - self.week_offs
        
        # Calculate attendance percentage
        if self.total_working_days > 0:
            effective_present = self.present_days + (self.half_days * 0.5)
            self.attendance_percentage = round(
                (effective_present / self.total_working_days) * 100, 
                2
            )
        
        self.save()