from django.contrib import admin
from .models import Shift, Attendance, Holiday


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'start_time', 'end_time', 'is_night_shift', 'is_active']
    list_filter = ['company', 'is_night_shift', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status', 'check_in', 'check_out', 'work_hours', 'is_late']
    list_filter = ['status', 'is_late', 'date', 'employee__department']
    search_fields = ['employee__employee_id', 'employee__first_name', 'employee__last_name']
    date_hierarchy = 'date'


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'company', 'is_optional']
    list_filter = ['company', 'is_optional', 'date']
    search_fields = ['name']
    date_hierarchy = 'date'
