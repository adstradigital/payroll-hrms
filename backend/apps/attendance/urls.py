from django.urls import path
from .views import (
    AttendancePolicyViewSet,
    ShiftViewSet,
    EmployeeShiftAssignmentViewSet,
    AttendanceViewSet,
    AttendanceRegularizationRequestViewSet,
    HolidayViewSet,
    AttendanceSummaryViewSet,
    generate_monthly_summary
)

# AttendancePolicy URLs
attendance_policy_list = AttendancePolicyViewSet.as_view({'get': 'list', 'post': 'create'})
attendance_policy_detail = AttendancePolicyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

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
attendance_dashboard_stats = AttendanceViewSet.as_view({'get': 'dashboard_stats'})
attendance_offline_employees = AttendanceViewSet.as_view({'get': 'offline_employees'})
attendance_on_break = AttendanceViewSet.as_view({'get': 'on_break'})
attendance_overtime_pending = AttendanceViewSet.as_view({'get': 'overtime_pending'})
attendance_to_validate = AttendanceViewSet.as_view({'get': 'to_validate', 'post': 'to_validate'})
attendance_analytics = AttendanceViewSet.as_view({'get': 'analytics'})
attendance_department_overtime = AttendanceViewSet.as_view({'get': 'department_overtime'})
attendance_department_overtime = AttendanceViewSet.as_view({'get': 'department_overtime'})
attendance_department_overtime = AttendanceViewSet.as_view({'get': 'department_overtime'})
attendance_my_dashboard = AttendanceViewSet.as_view({'get': 'my_dashboard'})
attendance_monthly_matrix = AttendanceViewSet.as_view({'get': 'monthly_matrix'})
attendance_start_break = AttendanceViewSet.as_view({'post': 'start_break'})
attendance_end_break = AttendanceViewSet.as_view({'post': 'end_break'})
attendance_regularize = AttendanceViewSet.as_view({'post': 'regularize'})


# Holiday URLs
holiday_list = HolidayViewSet.as_view({'get': 'list', 'post': 'create'})
holiday_detail = HolidayViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})
holiday_upcoming = HolidayViewSet.as_view({'get': 'upcoming'})
holiday_import = HolidayViewSet.as_view({'post': 'import_holidays'})
holiday_preview = HolidayViewSet.as_view({'post': 'preview'})
holiday_restore = HolidayViewSet.as_view({'post': 'restore'})
holiday_delete_all = HolidayViewSet.as_view({'post': 'delete_all'})

# Regularization Request URLs
regularization_list = AttendanceRegularizationRequestViewSet.as_view({'get': 'list', 'post': 'create'})
regularization_detail = AttendanceRegularizationRequestViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})
regularization_pending = AttendanceRegularizationRequestViewSet.as_view({'get': 'pending'})
regularization_approve = AttendanceRegularizationRequestViewSet.as_view({'post': 'approve'})
regularization_reject = AttendanceRegularizationRequestViewSet.as_view({'post': 'reject'})

# Attendance Summary URLs
summary_list = AttendanceSummaryViewSet.as_view({'get': 'list'})
summary_detail = AttendanceSummaryViewSet.as_view({'get': 'retrieve'})

urlpatterns = [
    # Attendance Policies
    path('policies/', attendance_policy_list, name='attendance_policy_list'),
    path('policies/<uuid:pk>/', attendance_policy_detail, name='attendance_policy_detail'),

    # Shifts
    path('shifts/', shift_list, name='shift_list'),
    path('shifts/<uuid:pk>/', shift_detail, name='shift_detail'),

    # Employee Shift Assignments
    path('shift-assignments/', assignment_list, name='assignment_list'),
    path('shift-assignments/<uuid:pk>/', assignment_detail, name='assignment_detail'),

    # Attendance
    path('', attendance_list, name='attendance_list'),
    path('<uuid:pk>/', attendance_detail, name='attendance_detail'),
    path('check-in/', attendance_check_in, name='attendance_check_in'),
    path('check-out/', attendance_check_out, name='attendance_check_out'),
    path('bulk-mark/', attendance_bulk_mark, name='attendance_bulk_mark'),
    path('daily-summary/', attendance_daily_summary, name='attendance_daily_summary'),
    path('employee-monthly/', attendance_employee_monthly, name='attendance_employee_monthly'),
    path('dashboard-stats/', attendance_dashboard_stats, name='attendance_dashboard_stats'),
    path('offline-employees/', attendance_offline_employees, name='attendance_offline_employees'),
    path('on-break/', attendance_on_break, name='attendance_on_break'),
    path('overtime-pending/', attendance_overtime_pending, name='attendance_overtime_pending'),
    path('to-validate/', attendance_to_validate, name='attendance_to_validate'),
    path('analytics/', attendance_analytics, name='attendance_analytics'),
    path('department-overtime/', attendance_department_overtime, name='attendance_department_overtime'),
    path('my_dashboard/', attendance_my_dashboard, name='attendance_my_dashboard'),
    path('monthly_matrix/', attendance_monthly_matrix, name='attendance_monthly_matrix'),
    path('start_break/', attendance_start_break, name='attendance_start_break'),
    path('end_break/', attendance_end_break, name='attendance_end_break'),
    path('<uuid:pk>/regularize/', attendance_regularize, name='attendance_regularize'),

    # Holidays
    path('holidays/', holiday_list, name='holiday_list'),
    path('holidays/<uuid:pk>/', holiday_detail, name='holiday_detail'),
    path('holidays/upcoming/', holiday_upcoming, name='holiday_upcoming'),
    path('holidays/import/', holiday_import, name='holiday_import'),
    path('holidays/preview/', holiday_preview, name='holiday_preview'),
    path('holidays/<uuid:pk>/restore/', holiday_restore, name='holiday_restore'),
    path('holidays/delete_all/', holiday_delete_all, name='holiday_delete_all'),

    # Regularization Requests
    path('regularization/', regularization_list, name='regularization_list'),
    path('regularization/<uuid:pk>/', regularization_detail, name='regularization_detail'),
    path('regularization/pending/', regularization_pending, name='regularization_pending'),
    path('regularization/<uuid:pk>/approve/', regularization_approve, name='regularization_approve'),
    path('regularization/<uuid:pk>/reject/', regularization_reject, name='regularization_reject'),

    # Attendance Summary
    path('summary/', generate_monthly_summary, name='generate_monthly_summary'),
    path('summaries/', summary_list, name='attendance_summary_list'),
    path('summaries/<uuid:pk>/', summary_detail, name='attendance_summary_detail'),
]
