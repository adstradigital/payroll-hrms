# Payroll URL Configuration
from django.urls import path
from .views import (
    salary_component_list, salary_component_detail,
    salary_structure_list, salary_structure_detail,
    salary_structure_add_component, salary_structure_update_components,
    employee_salary_list, employee_salary_detail,
    get_current_salary, get_salary_stats,
    payroll_period_list, payroll_period_detail,
    generate_payroll, mark_payroll_paid,
    payslip_list, payslip_detail,
    get_my_payslips, get_payroll_dashboard_stats,
    download_payslip, recalculate_payslip
)
from .payroll_generation import generate_payroll_advanced, get_payroll_reports

urlpatterns = [
    # Salary Components
    path('components/', salary_component_list, name='salary-component-list'),
    path('components/<uuid:pk>/', salary_component_detail, name='salary-component-detail'),
    
    # Salary Structures
    path('structures/', salary_structure_list, name='salary-structure-list'),
    path('structures/<uuid:pk>/', salary_structure_detail, name='salary-structure-detail'),
    path('structures/<uuid:pk>/add-component/', salary_structure_add_component, name='salary-structure-add-component'),
    path('structures/<uuid:pk>/update_components/', salary_structure_update_components, name='salary-structure-update-components'),
    
    # Employee Salaries
    path('employee-salaries/', employee_salary_list, name='employee-salary-list'),
    path('employee-salaries/<uuid:pk>/', employee_salary_detail, name='employee-salary-detail'),
    path('employee-salaries/current/', get_current_salary, name='employee-salary-current'),
    path('employee-salaries/stats/', get_salary_stats, name='employee-salary-stats'),
    
    # Payroll Periods
    path('periods/', payroll_period_list, name='payroll-period-list'),
    path('periods/<uuid:pk>/', payroll_period_detail, name='payroll-period-detail'),
    path('periods/generate/', generate_payroll, name='payroll-period-generate'),
    path('periods/<uuid:pk>/mark-paid/', mark_payroll_paid, name='payroll-period-mark-paid'),
    
    # PaySlips
    path('payslips/', payslip_list, name='payslip-list'),
    path('payslips/<uuid:pk>/', payslip_detail, name='payslip-detail'),
    path('payslips/my-payslips/', get_my_payslips, name='payslip-my-payslips'),
    path('payslips/dashboard-stats/', get_payroll_dashboard_stats, name='payslip-dashboard-stats'),
    path('payslips/<uuid:pk>/download/', download_payslip, name='payslip-download'),
    path('payslips/<uuid:pk>/recalculate/', recalculate_payslip, name='payslip-recalculate'),
    
    # Payroll generation and reports (Advanced)
    path('generate/', generate_payroll_advanced, name='generate-payroll'),
    path('reports/', get_payroll_reports, name='payroll-reports'),
]
