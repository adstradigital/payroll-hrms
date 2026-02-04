from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, AssetBatchViewSet, AssetRequestViewSet, AssetHistoryViewSet

router = DefaultRouter()
router.register(r'inventory', AssetViewSet)
router.register(r'batches', AssetBatchViewSet)
router.register(r'requests', AssetRequestViewSet)
router.register(r'history', AssetHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
