from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BiometricDeviceViewSet, BiometricLogViewSet

router = DefaultRouter()
router.register(r'devices', BiometricDeviceViewSet, basename='biometric-device')
router.register(r'logs', BiometricLogViewSet, basename='biometric-log')

urlpatterns = [
    path('', include(router.urls)),
]
