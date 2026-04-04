from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveEncashment, LeaveSettings, GlobalLeaveSettings


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'days_per_year', 'is_paid', 'is_carry_forward', 'is_active']
    list_filter = ['company', 'is_paid', 'is_carry_forward', 'is_active']
    search_fields = ['name', 'code']


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'year', 'allocated', 'used', 'pending', 'available']
    list_filter = ['leave_type', 'year']
    search_fields = ['employee__employee_id', 'employee__first_name']
    
    def available(self, obj):
        return obj.available
    available.short_description = 'Available'


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days_count', 'status', 'created_at']
    list_filter = ['status', 'leave_type', 'start_date']
    search_fields = ['employee__employee_id', 'employee__first_name']
    date_hierarchy = 'start_date'


@admin.register(LeaveSettings)
class LeaveSettingsAdmin(admin.ModelAdmin):
    list_display = ['company', 'is_encashment_enabled', 'updated_at']
    list_filter = ['is_encashment_enabled']


@admin.register(GlobalLeaveSettings)
class GlobalLeaveSettingsAdmin(admin.ModelAdmin):
    list_display = ['company', 'fiscal_year_start', 'auto_approve_short_leave', 'updated_at']


@admin.register(LeaveEncashment)
class LeaveEncashmentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'year', 'days_encashed', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'year', 'leave_type']
    search_fields = ['employee__employee_id', 'employee__first_name']
    readonly_fields = ['total_amount']
