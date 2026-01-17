from django.contrib import admin
from django.utils.html import format_html
from .models import Package, Subscription, Payment, FeatureUsage


# ==================== PACKAGE ADMIN ====================

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'package_type', 'monthly_price', 'max_employees', 'max_companies', 'is_popular', 'is_active', 'sort_order']
    list_filter = ['package_type', 'is_active', 'is_popular', 'is_featured']
    search_fields = ['name', 'description']
    ordering = ['sort_order', 'monthly_price']
    
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'package_type', 'description', 'short_description', 'tag_line')}),
        ('Pricing', {'fields': ('monthly_price', 'quarterly_price', 'yearly_price', 'quarterly_discount_percent', 'yearly_discount_percent')}),
        ('Limits', {'fields': ('max_employees', 'max_companies', 'max_departments', 'max_storage_gb')}),
        ('Features', {'fields': ('features', 'trial_days')}),
        ('Display Settings', {'fields': ('is_active', 'is_popular', 'is_featured', 'sort_order', 'button_text')}),
    )


# ==================== SUBSCRIPTION ADMIN ====================

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['transaction_id', 'amount', 'status', 'payment_date']
    can_delete = False
    fields = ['transaction_id', 'amount', 'currency', 'status', 'payment_method', 'payment_date']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['organization', 'package', 'status', 'billing_cycle', 'current_period_end', 'days_remaining_display', 'price', 'auto_renew']
    list_filter = ['status', 'billing_cycle', 'auto_renew', 'created_at']
    search_fields = ['organization__name', 'billing_email']
    readonly_fields = ['created_at', 'updated_at', 'is_active', 'days_remaining', 'is_trial']
    
    inlines = [PaymentInline]
    
    fieldsets = (
        ('Subscription Details', {'fields': ('organization', 'package', 'status', 'billing_cycle')}),
        ('Dates', {'fields': ('start_date', 'trial_end_date', 'current_period_start', 'current_period_end', 'cancelled_at')}),
        ('Pricing', {'fields': ('price', 'currency')}),
        ('Usage', {'fields': ('employee_count', 'company_count', 'storage_used_gb')}),
        ('Billing Information', {'fields': ('billing_email', 'billing_name', 'billing_address')}),
        ('Settings', {'fields': ('auto_renew',)}),
        ('Payment Gateway', {'fields': ('stripe_subscription_id', 'razorpay_subscription_id'), 'classes': ('collapse',)}),
        ('Computed Fields', {'fields': ('is_active', 'days_remaining', 'is_trial'), 'classes': ('collapse',)}),
        ('Metadata', {'fields': ('notes', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    def days_remaining_display(self, obj):
        days = obj.days_remaining
        if days == 0:
            return format_html('<span style="color: red;">Expired</span>')
        elif days <= 7:
            return format_html('<span style="color: orange;">{} days</span>', days)
        else:
            return format_html('<span style="color: green;">{} days</span>', days)
    days_remaining_display.short_description = 'Days Remaining'


# ==================== PAYMENT ADMIN ====================

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'subscription', 'total_amount', 'currency', 'status', 'payment_method', 'payment_date', 'created_at']
    list_filter = ['status', 'payment_method', 'gateway', 'created_at']
    search_fields = ['transaction_id', 'gateway_payment_id', 'invoice_number', 'subscription__organization__name', 'billing_email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Payment Details', {'fields': ('subscription', 'amount', 'currency', 'tax_amount', 'discount_amount', 'total_amount')}),
        ('Status', {'fields': ('status', 'payment_method', 'payment_date')}),
        ('Gateway Information', {'fields': ('gateway', 'transaction_id', 'gateway_payment_id', 'gateway_order_id', 'gateway_response')}),
        ('Invoice', {'fields': ('invoice_number', 'invoice_date', 'invoice_url')}),
        ('Refund', {'fields': ('refund_amount', 'refund_date', 'refund_reason', 'refund_transaction_id'), 'classes': ('collapse',)}),
        ('Billing Details', {'fields': ('billing_name', 'billing_email', 'billing_phone', 'billing_address'), 'classes': ('collapse',)}),
        ('Metadata', {'fields': ('notes', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


# ==================== FEATURE USAGE ADMIN ====================

@admin.register(FeatureUsage)
class FeatureUsageAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'feature_name', 'usage_count', 'usage_date']
    list_filter = ['feature_name', 'usage_date']
    search_fields = ['subscription__organization__name', 'feature_name']
    readonly_fields = ['usage_date']
