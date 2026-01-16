from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register(r'types', LeaveTypeViewSet)
router.register(r'balances', LeaveBalanceViewSet)
router.register(r'requests', LeaveRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
