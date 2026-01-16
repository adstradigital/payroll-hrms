from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, DepartmentViewSet, DesignationViewSet, EmployeeViewSet, BankDetailsViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'designations', DesignationViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'bank-details', BankDetailsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
