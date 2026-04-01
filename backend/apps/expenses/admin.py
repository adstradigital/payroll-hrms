from django.contrib import admin
from .models import ExpenseCategory, ExpenseClaim

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(ExpenseClaim)
class ExpenseClaimAdmin(admin.ModelAdmin):
    list_display = ['title', 'employee', 'category', 'amount', 'status', 'claim_date', 'created_at']
    list_filter = ['status', 'category', 'claim_date']
    search_fields = ['title', 'employee__username', 'description']
    raw_id_fields = ['employee', 'category', 'approved_by']

