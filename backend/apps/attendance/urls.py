from django.urls import path
from .views import (
    AttendancePolicyViewSet,
    ShiftViewSet,
    EmployeeShiftAssignmentViewSet,
    AttendanceViewSet,
    HolidayViewSet,
    generate_monthly_summary
)

# AttendancePolicy URLs
attendance_policy_list = AttendancePolicyViewSet.as_view({'get': 'list', 'post': 'create'})
attendance_policy_detail = AttendancePolicyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

# Shift URLs
shift_list = ShiftViewSet.as_view({'get': 'list', 'post': 'create'})
shift_detail = ShiftViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

# Employee Shift Assignment URLs
assignment_list = EmployeeShiftAssignmentViewSet.as_view({'get': 'list', 'post': 'create'})
assignment_detail = EmployeeShiftAssignmentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

# Attendance URLs
attendance_list = AttendanceViewSet.as_view({'get': 'list', 'post': 'create'})
attendance_detail = AttendanceViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})
attendance_check_in = AttendanceViewSet.as_view({'post': 'check_in'})
attendance_check_out = AttendanceViewSet.as_view({'post': 'check_out'})
attendance_bulk_mark = AttendanceViewSet.as_view({'post': 'bulk_mark'})
attendance_daily_summary = AttendanceViewSet.as_view({'get': 'daily_summary'})
attendance_employee_monthly = AttendanceViewSet.as_view({'get': 'employee_monthly'})

# Holiday URLs
holiday_list = HolidayViewSet.as_view({'get': 'list', 'post': 'create'})
holiday_detail = HolidayViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})
holiday_upcoming = HolidayViewSet.as_view({'get': 'upcoming'})

urlpatterns = [
    # Attendance Policies
    path('api/attendance-policies/', attendance_policy_list, name='attendance_policy_list'),
    path('api/attendance-policies/<uuid:pk>/', attendance_policy_detail, name='attendance_policy_detail'),

    # Shifts
    path('api/shifts/', shift_list, name='shift_list'),
    path('api/shifts/<uuid:pk>/', shift_detail, name='shift_detail'),

    # Employee Shift Assignments
    path('api/shift-assignments/', assignment_list, name='assignment_list'),
    path('api/shift-assignments/<uuid:pk>/', assignment_detail, name='assignment_detail'),

    # Attendance
    path('api/attendance/', attendance_list, name='attendance_list'),
    path('api/attendance/<uuid:pk>/', attendance_detail, name='attendance_detail'),
    path('api/attendance/check-in/', attendance_check_in, name='attendance_check_in'),
    path('api/attendance/check-out/', attendance_check_out, name='attendance_check_out'),
    path('api/attendance/bulk-mark/', attendance_bulk_mark, name='attendance_bulk_mark'),
    path('api/attendance/daily-summary/', attendance_daily_summary, name='attendance_daily_summary'),
    path('api/attendance/employee-monthly/', attendance_employee_monthly, name='attendance_employee_monthly'),

    # Holidays
    path('api/holidays/', holiday_list, name='holiday_list'),
    path('api/holidays/<uuid:pk>/', holiday_detail, name='holiday_detail'),
    path('api/holidays/upcoming/', holiday_upcoming, name='holiday_upcoming'),

    # Attendance Summary
    path('api/attendance-summary/', generate_monthly_summary, name='generate_monthly_summary'),
]
