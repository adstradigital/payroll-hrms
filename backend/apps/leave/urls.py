from django.urls import path
from .views import (
    leave_type_list_create, leave_type_detail,
    leave_balance_list_create, leave_balance_detail, leave_balance_my_balance, leave_balance_allocate, leave_balance_run_accrual,
    leave_request_list_create, leave_request_detail, leave_request_process, leave_request_cancel, leave_request_stats
)

urlpatterns = [
    # Leave Types
    path('types/', leave_type_list_create, name='leave-type-list'),
    path('types/<uuid:pk>/', leave_type_detail, name='leave-type-detail'),
    
    # Leave Balances
    path('balances/', leave_balance_list_create, name='leave-balance-list'),
    path('balances/<uuid:pk>/', leave_balance_detail, name='leave-balance-detail'),
    path('balances/my-balance/', leave_balance_my_balance, name='leave-balance-my-balance'),
    path('balances/allocate/', leave_balance_allocate, name='leave-balance-allocate'),
    path('balances/run-accrual/', leave_balance_run_accrual, name='leave-balance-run-accrual'),
    
    # Leave Requests
    path('requests/', leave_request_list_create, name='leave-request-list'),
    path('requests/<uuid:pk>/', leave_request_detail, name='leave-request-detail'),
    path('requests/<uuid:pk>/process/', leave_request_process, name='leave-request-process'),
    path('requests/<uuid:pk>/cancel/', leave_request_cancel, name='leave-request-cancel'),
    path('requests/stats/', leave_request_stats, name='leave-request-stats'),
]
