from django.contrib import admin
from .models import (
    AttendancePolicy,
    Shift,
    EmployeeShiftAssignment,
    Attendance,
    AttendanceBreak,
    Holiday,
    AttendanceRegularizationRequest,
    AttendanceSummary
)
from apps.accounts.models import Employee, Company, Department


# -----------------------------
# Attendance Policy Admin
# -----------------------------
@admin.register(AttendancePolicy)
class AttendancePolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'department', 'policy_type', 'is_active', 'effective_from', 'effective_to')
    list_filter = ('company', 'department', 'policy_type', 'is_active')
    search_fields = ('name', 'company__name', 'department__name')
    ordering = ('-effective_from',)
    date_hierarchy = 'effective_from'


# -----------------------------
# Shift Admin
# -----------------------------
@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'shift_type', 'code', 'start_time', 'end_time', 'is_active')
    list_filter = ('company', 'shift_type', 'is_active')
    search_fields = ('name', 'code', 'company__name')
    ordering = ('start_time',)


# -----------------------------
# Employee Shift Assignment Admin
# -----------------------------
@admin.register(EmployeeShiftAssignment)
class EmployeeShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'shift', 'effective_from', 'effective_to', 'is_active')
    list_filter = ('shift', 'is_active')
    search_fields = ('employee__full_name', 'shift__name')
    ordering = ('-effective_from',)


# -----------------------------
# AttendanceBreak Inline for Attendance
# -----------------------------
class AttendanceBreakInline(admin.TabularInline):
    model = AttendanceBreak
    extra = 0
    readonly_fields = ('duration_minutes',)


# -----------------------------
# Attendance Admin
# -----------------------------
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'date', 'status', 'total_hours', 'overtime_hours',
        'is_late', 'is_early_departure', 'check_in_time', 'check_out_time'
    )
    list_filter = ('status', 'is_late', 'is_early_departure', 'date')
    search_fields = ('employee__full_name', 'employee__employee_id')
    ordering = ('-date',)
    inlines = [AttendanceBreakInline]


# -----------------------------
# Holiday Admin
# -----------------------------
@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'date', 'holiday_type', 'is_active')
    list_filter = ('company', 'holiday_type', 'is_active')
    search_fields = ('name', 'company__name')
    ordering = ('-date',)
    filter_horizontal = ('departments',)


# -----------------------------
# Attendance Regularization Request Admin
# -----------------------------
@admin.register(AttendanceRegularizationRequest)
class AttendanceRegularizationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance', 'request_type', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'request_type', 'created_at')
    search_fields = ('employee__full_name', 'attendance__employee__full_name')
    ordering = ('-created_at',)


# -----------------------------
# Attendance Summary Admin
# -----------------------------
@admin.register(AttendanceSummary)
class AttendanceSummaryAdmin(admin.ModelAdmin):
    list_display = (
        'employee', 'year', 'month', 'total_working_days', 'present_days',
        'absent_days', 'half_days', 'leave_days', 'attendance_percentage', 'is_finalized'
    )
    list_filter = ('year', 'month', 'is_finalized')
    search_fields = ('employee__full_name',)
    ordering = ('-year', '-month')
