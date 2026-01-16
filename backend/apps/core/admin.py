from django.contrib import admin
from .models import Company, Department, Designation, Employee, BankDetails


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'gstin', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email', 'gstin']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'parent', 'is_active']
    list_filter = ['company', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'level', 'is_active']
    list_filter = ['company', 'level', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_full_name', 'department', 'designation', 'status', 'date_of_joining']
    list_filter = ['company', 'department', 'designation', 'status', 'employment_type']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']
    
    def get_full_name(self, obj):
        return obj.full_name
    get_full_name.short_description = 'Name'


@admin.register(BankDetails)
class BankDetailsAdmin(admin.ModelAdmin):
    list_display = ['employee', 'bank_name', 'account_number', 'ifsc_code', 'is_primary']
    list_filter = ['bank_name', 'is_primary']
    search_fields = ['employee__first_name', 'employee__last_name', 'account_number']
