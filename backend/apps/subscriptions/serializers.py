from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Package, Subscription, Payment, FeatureUsage


# ==================== USER SERIALIZERS ====================

class UserSerializer(serializers.ModelSerializer):
    """User Serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


# ==================== PACKAGE SERIALIZERS ====================

class PackageListSerializer(serializers.ModelSerializer):
    """Package List Serializer - minimal fields for listing"""
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'package_type', 'short_description',
            'monthly_price', 'yearly_price', 'max_employees',
            'is_popular', 'is_featured', 'tag_line', 'button_text'
        ]
        read_only_fields = ['id']


class PackageDetailSerializer(serializers.ModelSerializer):
    """Package Detail Serializer - all fields"""
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'package_type', 'description', 'short_description',
            'monthly_price', 'quarterly_price', 'yearly_price',
            'quarterly_discount_percent', 'yearly_discount_percent',
            'max_employees', 'max_companies', 'max_departments', 'max_storage_gb',
            'features', 'trial_days', 'is_active', 'is_popular', 'is_featured',
            'sort_order', 'tag_line', 'button_text',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']


# ==================== SUBSCRIPTION SERIALIZERS ====================

class SubscriptionListSerializer(serializers.ModelSerializer):
    """Subscription List Serializer - minimal fields"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_type = serializers.CharField(source='package.package_type', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'organization', 'organization_name', 'package', 'package_name',
            'package_type', 'status', 'billing_cycle', 'current_period_end',
            'is_active', 'days_remaining', 'auto_renew'
        ]
        read_only_fields = ['id', 'organization_name', 'package_name', 'package_type',
                          'is_active', 'days_remaining']


class SubscriptionDetailSerializer(serializers.ModelSerializer):
    """Subscription Detail Serializer - all fields"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_type = serializers.CharField(source='package.package_type', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_trial = serializers.BooleanField(read_only=True)
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'organization', 'organization_name', 'package', 'package_name',
            'package_type', 'status', 'billing_cycle', 'start_date', 'trial_end_date',
            'current_period_start', 'current_period_end', 'cancelled_at',
            'price', 'currency', 'employee_count', 'company_count', 'storage_used_gb',
            'auto_renew', 'stripe_subscription_id', 'razorpay_subscription_id',
            'billing_email', 'billing_name', 'billing_address', 'notes',
            'is_active', 'days_remaining', 'is_trial',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'organization_name', 'package_name', 'package_type',
            'is_active', 'days_remaining', 'is_trial',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]


# ==================== PAYMENT SERIALIZERS ====================

class PaymentListSerializer(serializers.ModelSerializer):
    """Payment List Serializer - minimal fields"""
    organization_name = serializers.CharField(
        source='subscription.organization.name',
        read_only=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'organization_name', 'total_amount', 'currency',
            'status', 'payment_method', 'gateway', 'payment_date', 'invoice_number'
        ]
        read_only_fields = ['id', 'organization_name']


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Payment Detail Serializer - all fields"""
    organization_name = serializers.CharField(
        source='subscription.organization.name',
        read_only=True
    )
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'subscription', 'organization_name', 'amount', 'currency',
            'tax_amount', 'discount_amount', 'total_amount', 'status',
            'payment_method', 'transaction_id', 'gateway', 'gateway_payment_id',
            'gateway_order_id', 'gateway_response', 'payment_date',
            'invoice_number', 'invoice_date', 'invoice_url',
            'refund_amount', 'refund_date', 'refund_reason', 'refund_transaction_id',
            'billing_name', 'billing_email', 'billing_phone', 'billing_address',
            'notes', 'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'organization_name', 'created_at', 'updated_at',
                          'created_by', 'updated_by']


# ==================== FEATURE USAGE SERIALIZERS ====================

class FeatureUsageSerializer(serializers.ModelSerializer):
    """Feature Usage Serializer"""
    organization_name = serializers.CharField(
        source='subscription.organization.name',
        read_only=True
    )
    
    class Meta:
        model = FeatureUsage
        fields = [
            'id', 'subscription', 'organization_name', 'feature_name',
            'usage_count', 'usage_date', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'organization_name', 'created_at']


class FeatureUsageAggregateSerializer(serializers.Serializer):
    """Aggregated feature usage for analytics"""
    feature_name = serializers.CharField()
    total_usage = serializers.IntegerField()
    usage_date = serializers.DateField()
