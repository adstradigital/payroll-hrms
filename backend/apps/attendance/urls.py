from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShiftViewSet, AttendanceViewSet, HolidayViewSet

router = DefaultRouter()
router.register(r'shifts', ShiftViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'holidays', HolidayViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
