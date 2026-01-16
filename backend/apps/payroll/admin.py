from django.contrib import admin
from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, EmployeeSalaryComponent, PayrollPeriod, PaySlip, PaySlipComponent
)


@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'component_type', 'calculation_type', 'is_statutory', 'is_active']
    list_filter = ['company', 'component_type', 'is_statutory', 'is_active']
    search_fields = ['name', 'code']


class SalaryStructureComponentInline(admin.TabularInline):
    model = SalaryStructureComponent
    extra = 1


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'is_active']
    list_filter = ['company', 'is_active']
    search_fields = ['name', 'code']
    inlines = [SalaryStructureComponentInline]


class EmployeeSalaryComponentInline(admin.TabularInline):
    model = EmployeeSalaryComponent
    extra = 1


@admin.register(EmployeeSalary)
class EmployeeSalaryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'basic_salary', 'gross_salary', 'net_salary', 'effective_from', 'is_current']
    list_filter = ['is_current', 'effective_from']
    search_fields = ['employee__employee_id', 'employee__first_name']
    inlines = [EmployeeSalaryComponentInline]


class PaySlipComponentInline(admin.TabularInline):
    model = PaySlipComponent
    extra = 0


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'month', 'year', 'status', 'total_employees', 'total_net']
    list_filter = ['company', 'status', 'year']
    search_fields = ['name']


@admin.register(PaySlip)
class PaySlipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'payroll_period', 'gross_earnings', 'total_deductions', 'net_salary', 'status']
    list_filter = ['status', 'payroll_period']
    search_fields = ['employee__employee_id', 'employee__first_name']
    inlines = [PaySlipComponentInline]
