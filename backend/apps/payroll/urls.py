from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalaryComponentViewSet, SalaryStructureViewSet, 
    EmployeeSalaryViewSet, PayrollPeriodViewSet, PaySlipViewSet
)

router = DefaultRouter()
router.register(r'components', SalaryComponentViewSet)
router.register(r'structures', SalaryStructureViewSet)
router.register(r'employee-salaries', EmployeeSalaryViewSet)
router.register(r'periods', PayrollPeriodViewSet)
router.register(r'payslips', PaySlipViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
