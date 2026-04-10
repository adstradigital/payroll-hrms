from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveReportViewSet, AttendanceReportViewSet, PayrollReportViewSet, AttritionReportViewSet

router = DefaultRouter()
router.register(r'leave', LeaveReportViewSet, basename='leave-report')
router.register(r'attendance', AttendanceReportViewSet, basename='attendance-report')
router.register(r'payroll', PayrollReportViewSet, basename='payroll-report')
router.register(r'attrition', AttritionReportViewSet, basename='attrition-report')

urlpatterns = [
    path('', include(router.urls)),
]
