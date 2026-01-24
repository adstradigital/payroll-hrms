from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveReportViewSet

router = DefaultRouter()
router.register(r'leave', LeaveReportViewSet, basename='leave-report')

urlpatterns = [
    path('', include(router.urls)),
]
