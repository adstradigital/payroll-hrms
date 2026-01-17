from django.db import models
from django.conf import settings
from django.utils import timezone


class Shift(models.Model):
    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_night_shift = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class EmployeeShiftAssignment(models.Model):
    employee = models.ForeignKey('core.Employee', on_delete=models.CASCADE)
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)


class AttendancePolicy(models.Model):
    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    late_grace_minutes = models.PositiveIntegerField(default=0)
    half_day_after_minutes = models.PositiveIntegerField(default=0)


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('holiday', 'Holiday'),
        ('week_off', 'Week Off'),
        ('work_from_home', 'WFH'),
    )

    employee = models.ForeignKey('core.Employee', on_delete=models.CASCADE)
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    work_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    is_late = models.BooleanField(default=False)
    is_regularized = models.BooleanField(default=False)
    source = models.CharField(max_length=20, default='manual')

    def __str__(self):
        return f"{self.employee} - {self.date}"


class AttendancePunch(models.Model):
    attendance = models.ForeignKey(Attendance, related_name='punches', on_delete=models.CASCADE)
    punch_time = models.DateTimeField(default=timezone.now)
    punch_type = models.CharField(max_length=10)
    location = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=200, blank=True)
    remarks = models.TextField(blank=True)


class AttendanceRegularization(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE)
    employee = models.ForeignKey('core.Employee', on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    reviewed_by = models.ForeignKey(
        'core.Employee', null=True, blank=True,
        related_name='reviewed_regularizations',
        on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)


class Holiday(models.Model):
    company = models.ForeignKey('core.Company', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    date = models.DateField()
    holiday_type = models.CharField(max_length=50)
    is_optional = models.BooleanField(default=False)


class AttendanceSummary(models.Model):
    employee = models.ForeignKey('core.Employee', on_delete=models.CASCADE)
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    total_working_days = models.PositiveIntegerField(default=0)
    present_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)
    half_days = models.PositiveIntegerField(default=0)
    leave_days = models.PositiveIntegerField(default=0)
    total_work_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    total_overtime_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0)
