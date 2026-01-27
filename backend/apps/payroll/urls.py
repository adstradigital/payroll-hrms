# Payroll URL Configuration
from django.urls import path
from .views import (
    SalaryComponentViewSet, SalaryStructureViewSet,
    EmployeeSalaryViewSet, PayrollPeriodViewSet, PaySlipViewSet
)
from .payroll_generation import GeneratePayrollView, PayrollReportsView

# Salary Component URLs
salary_component_list = SalaryComponentViewSet.as_view({'get': 'list', 'post': 'create'})
salary_component_detail = SalaryComponentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

# Salary Structure URLs
salary_structure_list = SalaryStructureViewSet.as_view({'get': 'list', 'post': 'create'})
salary_structure_detail = SalaryStructureViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
salary_structure_add_component = SalaryStructureViewSet.as_view({'post': 'add_component'})

# Employee Salary URLs
employee_salary_list = EmployeeSalaryViewSet.as_view({'get': 'list', 'post': 'create'})
employee_salary_detail = EmployeeSalaryViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
employee_salary_current = EmployeeSalaryViewSet.as_view({'get': 'current'})

# Payroll Period URLs
payroll_period_list = PayrollPeriodViewSet.as_view({'get': 'list', 'post': 'create'})
payroll_period_detail = PayrollPeriodViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
payroll_period_generate = PayrollPeriodViewSet.as_view({'post': 'generate'})
payroll_period_mark_paid = PayrollPeriodViewSet.as_view({'post': 'mark_paid'})

# PaySlip URLs
payslip_list = PaySlipViewSet.as_view({'get': 'list', 'post': 'create'})
payslip_detail = PaySlipViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})
payslip_my_payslips = PaySlipViewSet.as_view({'get': 'my_payslips'})
payslip_dashboard_stats = PaySlipViewSet.as_view({'get': 'dashboard_stats'})

urlpatterns = [
    # Salary Components
    path('components/', salary_component_list, name='salary-component-list'),
    path('components/<uuid:pk>/', salary_component_detail, name='salary-component-detail'),
    
    # Salary Structures
    path('structures/', salary_structure_list, name='salary-structure-list'),
    path('structures/<uuid:pk>/', salary_structure_detail, name='salary-structure-detail'),
    path('structures/<uuid:pk>/add-component/', salary_structure_add_component, name='salary-structure-add-component'),
    
    # Employee Salaries
    path('employee-salaries/', employee_salary_list, name='employee-salary-list'),
    path('employee-salaries/<uuid:pk>/', employee_salary_detail, name='employee-salary-detail'),
    path('employee-salaries/current/', employee_salary_current, name='employee-salary-current'),
    
    # Payroll Periods
    path('periods/', payroll_period_list, name='payroll-period-list'),
    path('periods/<uuid:pk>/', payroll_period_detail, name='payroll-period-detail'),
    path('periods/generate/', payroll_period_generate, name='payroll-period-generate'),
    path('periods/<uuid:pk>/mark-paid/', payroll_period_mark_paid, name='payroll-period-mark-paid'),
    
    # PaySlips
    path('payslips/', payslip_list, name='payslip-list'),
    path('payslips/<uuid:pk>/', payslip_detail, name='payslip-detail'),
    path('payslips/my-payslips/', payslip_my_payslips, name='payslip-my-payslips'),
    path('payslips/dashboard-stats/', payslip_dashboard_stats, name='payslip-dashboard-stats'),
    
    # Payroll generation and reports
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('reports/', PayrollReportsView.as_view(), name='payroll-reports'),
]
