# Payroll URL Configuration
from django.urls import path
from .views import (
    salary_component_list_create, salary_component_detail,
    salary_structure_list_create, salary_structure_detail, salary_structure_add_component, salary_structure_update_components,
    employee_salary_list_create, employee_salary_detail, employee_salary_current, employee_salary_stats,
    payroll_period_list_create, payroll_period_detail, payroll_period_generate, payroll_period_mark_paid,
    payslip_list_create, payslip_detail, payslip_my_payslips, payslip_dashboard_stats, payslip_download, payslip_recalculate,
    tax_slab_list_create, tax_slab_detail, 
    tax_declaration_list_create, tax_declaration_detail, tax_dashboard_stats,
    payroll_settings_detail,
    loan_list_create, loan_detail, loan_generate_schedule
)
from .payroll_generation import GeneratePayrollView, PayrollReportsView

urlpatterns = [
    # Global Settings
    path('settings/', payroll_settings_detail, name='payroll-settings'),

    # Tax Management
    path('tax-slabs/', tax_slab_list_create, name='tax-slab-list'),
    path('tax-slabs/<uuid:pk>/', tax_slab_detail, name='tax-slab-detail'),
    
    path('tax-declarations/', tax_declaration_list_create, name='tax-declaration-list'),
    path('tax-declarations/<uuid:pk>/', tax_declaration_detail, name='tax-declaration-detail'),
    path('tax-declarations/dashboard-stats/', tax_dashboard_stats, name='tax-dashboard-stats'),

    # Salary Components
    path('components/', salary_component_list_create, name='salary-component-list'),
    path('components/<uuid:pk>/', salary_component_detail, name='salary-component-detail'),
    
    # Salary Structures
    path('structures/', salary_structure_list_create, name='salary-structure-list'),
    path('structures/<uuid:pk>/', salary_structure_detail, name='salary-structure-detail'),
    path('structures/<uuid:pk>/add-component/', salary_structure_add_component, name='salary-structure-add-component'),
    path('structures/<uuid:pk>/update_components/', salary_structure_update_components, name='salary-structure-update-components'),
    
    # Employee Salaries
    path('employee-salaries/', employee_salary_list_create, name='employee-salary-list'),
    path('employee-salaries/<uuid:pk>/', employee_salary_detail, name='employee-salary-detail'),
    path('employee-salaries/current/', employee_salary_current, name='employee-salary-current'),
    path('employee-salaries/stats/', employee_salary_stats, name='employee-salary-stats'),
    
    # Payroll Periods
    path('periods/', payroll_period_list_create, name='payroll-period-list'),
    path('periods/<uuid:pk>/', payroll_period_detail, name='payroll-period-detail'),
    path('periods/generate/', payroll_period_generate, name='payroll-period-generate'),
    path('periods/<uuid:pk>/mark-paid/', payroll_period_mark_paid, name='payroll-period-mark-paid'),
    
    # PaySlips
    path('payslips/', payslip_list_create, name='payslip-list'),
    path('payslips/<uuid:pk>/', payslip_detail, name='payslip-detail'),
    path('payslips/my-payslips/', payslip_my_payslips, name='payslip-my-payslips'),
    path('payslips/dashboard-stats/', payslip_dashboard_stats, name='payslip-dashboard-stats'),
    path('payslips/<uuid:pk>/download/', payslip_download, name='payslip-download'),
    path('payslips/<uuid:pk>/recalculate/', payslip_recalculate, name='payslip-recalculate'),
    
    # Loans & Advances
    path('loans/', loan_list_create, name='loan-list'),
    path('loans/<uuid:pk>/', loan_detail, name='loan-detail'),
    path('loans/<uuid:pk>/generate-schedule/', loan_generate_schedule, name='loan-generate-schedule'),

    # Payroll generation and reports (Note: These might still be class-based or need similar refactor if desired)
    path('generate/', GeneratePayrollView.as_view(), name='generate-payroll'),
    path('reports/', PayrollReportsView.as_view(), name='payroll-reports'),
]
