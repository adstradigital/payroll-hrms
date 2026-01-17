"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse({"status": "ok", "message": "Payroll HRMS API is running"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    
    # Authentication & Accounts APIs
    path('api/account/', include('apps.accounts.urls')),
    
    # Subscription APIs
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    
    # Core APIs (shared)
    path('api/core/', include('apps.core.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/leave/', include('apps.leave.urls')),
    
    # Module APIs
    path('api/payroll/', include('apps.payroll.urls')),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
