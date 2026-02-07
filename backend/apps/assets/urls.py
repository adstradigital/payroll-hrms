from django.urls import path
from .views import (
    asset_list_create, asset_detail, asset_allocate, asset_deallocate, asset_dashboard_stats,
    asset_batch_list_create, asset_batch_detail,
    asset_request_list_create, asset_request_detail, asset_request_process,
    asset_history_list, asset_history_detail
)

urlpatterns = [
    # Asset Inventory
    path('inventory/', asset_list_create, name='asset-list'),
    path('inventory/dashboard-stats/', asset_dashboard_stats, name='asset-dashboard-stats'),
    path('inventory/<uuid:pk>/', asset_detail, name='asset-detail'),
    path('inventory/<uuid:pk>/allocate/', asset_allocate, name='asset-allocate'),
    path('inventory/<uuid:pk>/deallocate/', asset_deallocate, name='asset-deallocate'),
    
    # Asset Batches
    path('batches/', asset_batch_list_create, name='asset-batch-list'),
    path('batches/<uuid:pk>/', asset_batch_detail, name='asset-batch-detail'),
    
    # Asset Requests
    path('requests/', asset_request_list_create, name='asset-request-list'),
    path('requests/<uuid:pk>/', asset_request_detail, name='asset-request-detail'),
    path('requests/<uuid:pk>/process/', asset_request_process, name='asset-request-process'),
    
    # Asset History
    path('history/', asset_history_list, name='asset-history-list'),
    path('history/<uuid:pk>/', asset_history_detail, name='asset-history-detail'),
]
