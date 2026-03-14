"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.attendance.urls')),
    path('api/', include('apps.leave.urls')),
    path('api/', include('apps.payroll.urls')),
    path('api/', include('apps.recruitment.urls')),
    path('api/', include('apps.reimbursements.urls')),
]
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from apps.recruitment import views as recruitment_views


def health_check(request):
    return JsonResponse({"status": "ok", "message": "Payroll HRMS API is running"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),

    # Recruitment dashboard endpoints (main dashboard page)
    path('api/dashboard/stats/', recruitment_views.dashboard_stats, name='dashboard_stats'),
    path('api/dashboard/pipeline-status/', recruitment_views.pipeline_status, name='pipeline_status'),
    path('api/dashboard/application-sources/', recruitment_views.application_sources, name='application_sources'),
    path('api/interviews/today/', recruitment_views.today_interviews, name='today_interviews'),
    
    # Authentication & Accounts APIs
    path('api/account/', include('apps.accounts.urls')),

    # Settings APIs
    path('api/settings/', include('apps.hrms.urls')),
    
    # Subscription APIs
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    
    # Core APIs (shared)
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/leave/', include('apps.leave.urls')),
    
    # Module APIs
    path('api/payroll/', include('apps.payroll.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/biometrics/', include('apps.biometrics.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/assets/', include('apps.assets.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/recruitment/', include('apps.recruitment.urls')),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
