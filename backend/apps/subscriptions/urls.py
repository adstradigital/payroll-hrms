from django.urls import path
from . import views

app_name = 'subscriptions'

urlpatterns = [
    # ==================== PACKAGE URLs ====================
    # Public endpoints
    path('packages/', views.package_list, name='package-list'),
    path('packages/<uuid:pk>/', views.package_detail, name='package-detail'),
    
    # Admin endpoints
    path('admin/packages/', views.package_admin_list_create, name='package-admin-list'),
    path('admin/packages/<uuid:pk>/', views.package_admin_detail, name='package-admin-detail'),
    
    # ==================== SUBSCRIPTION URLs ====================
    path('subscriptions/', views.subscription_list_create, name='subscription-list-create'),
    path('subscriptions/<uuid:pk>/', views.subscription_detail, name='subscription-detail'),
    path('subscriptions/<uuid:pk>/renew/', views.subscription_renew, name='subscription-renew'),
    path('subscriptions/<uuid:pk>/cancel/', views.subscription_cancel, name='subscription-cancel'),
    path('subscriptions/<uuid:pk>/usage/', views.subscription_usage, name='subscription-usage'),
    
    # ==================== PAYMENT URLs ====================
    path('payments/', views.payment_list_create, name='payment-list-create'),
    path('payments/<uuid:pk>/', views.payment_detail, name='payment-detail'),
    path('payments/webhook/<str:gateway>/', views.payment_webhook, name='payment-webhook'),
    
    # ==================== FEATURE USAGE URLs ====================
    path('usage/', views.feature_usage_list, name='usage-list'),
    path('usage/summary/<uuid:subscription_id>/', views.feature_usage_summary, name='usage-summary'),
]
