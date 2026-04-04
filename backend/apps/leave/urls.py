from django.urls import path
from .views import (
    leave_type_list_create, leave_type_detail,
    leave_balance_list_create, leave_balance_detail, leave_balance_my_balance, leave_balance_allocate, leave_balance_run_accrual,
    leave_request_list_create, leave_request_detail, leave_request_process,
    leave_request_email_process, leave_request_cancel, leave_request_stats,
    leave_encashment_list_create, leave_encashment_detail,
    leave_encashment_process, leave_encashment_eligibility,
    leave_settings_detail,
    leave_request_email_process, leave_request_cancel, leave_request_stats,
    global_leave_settings
)

urlpatterns = [
    # Global Settings
    path('settings/', leave_settings_detail, name='leave-settings'),

    # Leave Types
    path('types/', leave_type_list_create, name='leave-type-list'),
    path('types/<int:pk>/', leave_type_detail, name='leave-type-detail'),

    # Leave Balances
    # IMPORTANT: Named paths must come BEFORE '<int:pk>/' to avoid routing errors
    path('balances/', leave_balance_list_create, name='leave-balance-list'),
    path('balances/my-balance/', leave_balance_my_balance, name='leave-balance-my-balance'),
    path('balances/allocate/', leave_balance_allocate, name='leave-balance-allocate'),
    path('balances/run-accrual/', leave_balance_run_accrual, name='leave-balance-run-accrual'),
    path('balances/<int:pk>/', leave_balance_detail, name='leave-balance-detail'),

    # Leave Requests
    # IMPORTANT: 'stats/' must come BEFORE '<int:pk>/' to avoid Django routing 'stats' as an integer pk
    path('requests/', leave_request_list_create, name='leave-request-list'),
    path('requests/stats/', leave_request_stats, name='leave-request-stats'),
    path('requests/<int:pk>/', leave_request_detail, name='leave-request-detail'),
    path('requests/<int:pk>/process/', leave_request_process, name='leave-request-process'),
    path('requests/<int:pk>/email-process/', leave_request_email_process, name='leave-request-email-process'),
    path('requests/<int:pk>/cancel/', leave_request_cancel, name='leave-request-cancel'),

    # Leave Encashment
    # IMPORTANT: Named paths must come BEFORE '<int:pk>/'
    path('encashments/', leave_encashment_list_create, name='leave-encashment-list'),
    path('encashments/eligibility/', leave_encashment_eligibility, name='leave-encashment-eligibility'),
    path('encashments/<int:pk>/', leave_encashment_detail, name='leave-encashment-detail'),
    path('encashments/<int:pk>/process/', leave_encashment_process, name='leave-encashment-process'),
    path('requests/stats/', leave_request_stats, name='leave-request-stats'),
    
    # Settings
    path('global-settings/', global_leave_settings, name='global-leave-settings'),
]
