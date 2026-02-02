# Advanced Payroll Admin
# admin.py - Place this in your payroll app

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Sum
from decimal import Decimal

# Advanced Payroll Admin
# admin.py - Place this in your payroll app

from django.contrib import admin
from .models import SalaryComponent

# ==================== SALARY COMPONENT ADMIN ====================
@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'company', 'component_type', 'calculation_type', 'is_active']
    list_filter = ['company', 'is_active', 'component_type']
    search_fields = ['name', 'code']
