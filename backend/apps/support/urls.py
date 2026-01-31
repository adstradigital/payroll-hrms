from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HelpCategoryViewSet, HelpArticleViewSet, SupportTicketViewSet

router = DefaultRouter()
router.register(r'categories', HelpCategoryViewSet, basename='helpcategory')
router.register(r'articles', HelpArticleViewSet, basename='helparticle')
router.register(r'tickets', SupportTicketViewSet, basename='supportticket')

urlpatterns = [
    path('', include(router.urls)),
]
