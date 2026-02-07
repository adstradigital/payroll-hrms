from django.urls import path
from .views import (
    policy_list, policy_detail,
    shift_list, shift_detail,
    assignment_list, assignment_detail,
    attendance_list, attendance_detail,
    check_in, check_out,
    regularize,
    start_break, end_break,
    bulk_mark,
    daily_summary,
    employee_monthly,
    dashboard_stats,
    offline_employees,
    on_break,
    overtime_pending,
    to_validate,
    analytics_data,
    department_overtime,
    my_dashboard,
    monthly_matrix,
    holiday_list, holiday_detail,
    holiday_restore, holiday_delete_all,
    holiday_upcoming, holiday_preview,
    holiday_import,
    summary_list,
    generate_monthly_summary,
    regularization_request_list,
    regularization_request_detail,
    regularization_pending,
    regularization_approve,
    regularization_reject
)

urlpatterns = [
    # Attendance Policies
    path('policies/', policy_list, name='attendance_policy_list'),
    path('policies/<uuid:pk>/', policy_detail, name='attendance_policy_detail'),

    # Shifts
    path('shifts/', shift_list, name='shift_list'),
    path('shifts/<uuid:pk>/', shift_detail, name='shift_detail'),

    # Employee Shift Assignments
    path('shift-assignments/', assignment_list, name='assignment_list'),
    path('shift-assignments/<uuid:pk>/', assignment_detail, name='assignment_detail'),

    # Attendance
    path('', attendance_list, name='attendance_list'),
    path('<uuid:pk>/', attendance_detail, name='attendance_detail'),
    path('check-in/', check_in, name='attendance_check_in'),
    path('check-out/', check_out, name='attendance_check_out'),
    path('bulk-mark/', bulk_mark, name='attendance_bulk_mark'),
    path('daily-summary/', daily_summary, name='attendance_daily_summary'),
    path('employee-monthly/', employee_monthly, name='attendance_employee_monthly'),
    path('dashboard-stats/', dashboard_stats, name='attendance_dashboard_stats'),
    path('offline-employees/', offline_employees, name='attendance_offline_employees'),
    path('on-break/', on_break, name='attendance_on_break'),
    path('overtime-pending/', overtime_pending, name='attendance_overtime_pending'),
    path('to-validate/', to_validate, name='attendance_to_validate'),
    path('analytics/', analytics_data, name='attendance_analytics'),
    path('department-overtime/', department_overtime, name='attendance_department_overtime'),
    path('my_dashboard/', my_dashboard, name='attendance_my_dashboard'),
    path('monthly_matrix/', monthly_matrix, name='attendance_monthly_matrix'),
    path('start_break/', start_break, name='attendance_start_break'),
    path('end_break/', end_break, name='attendance_end_break'),
    path('<uuid:pk>/regularize/', regularize, name='attendance_regularize'),

    # Holidays
    path('holidays/', holiday_list, name='holiday_list'),
    path('holidays/<uuid:pk>/', holiday_detail, name='holiday_detail'),
    path('holidays/upcoming/', holiday_upcoming, name='holiday_upcoming'),
    path('holidays/import/', holiday_import, name='holiday_import'),
    path('holidays/preview/', holiday_preview, name='holiday_preview'),
    path('holidays/<uuid:pk>/restore/', holiday_restore, name='holiday_restore'),
    path('holidays/delete_all/', holiday_delete_all, name='holiday_delete_all'),

    # Regularization Requests
    path('regularization/', regularization_request_list, name='regularization_list'),
    path('regularization/<uuid:pk>/', regularization_request_detail, name='regularization_detail'),
    path('regularization/pending/', regularization_pending, name='regularization_pending'),
    path('regularization/<uuid:pk>/approve/', regularization_approve, name='regularization_approve'),
    path('regularization/<uuid:pk>/reject/', regularization_reject, name='regularization_reject'),

    # Attendance Summary
    path('summary/', generate_monthly_summary, name='generate_monthly_summary'),
    path('summaries/', summary_list, name='attendance_summary_list'),
]
