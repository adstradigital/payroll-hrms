from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import uuid


class BaseModel(models.Model):
    """Abstract base model with common fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='%(class)s_updated'
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


# ==================== SUBSCRIPTION PACKAGE MODELS ====================

class Package(BaseModel):
    """Subscription Package/Plan"""
    PACKAGE_TYPE = (
        ('free_trial', 'Free Trial'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('business', 'Business'),
        ('enterprise', 'Enterprise'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE, unique=True, db_index=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=200, blank=True)
    
    # Pricing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quarterly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Discounts
    quarterly_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    yearly_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    
    # Limits
    max_employees = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        help_text="Maximum employees allowed. Null = unlimited"
    )
    max_companies = models.PositiveIntegerField(
        default=1,
        help_text="Maximum companies/subsidiaries allowed"
    )
    max_departments = models.PositiveIntegerField(null=True, blank=True)
    max_storage_gb = models.PositiveIntegerField(default=5)
    
    # Features
    features = models.JSONField(
        default=dict,
        help_text="Package features as JSON: {'payroll': true, 'attendance': true}"
    )
    
    # Trial settings
    trial_days = models.PositiveIntegerField(default=14)
    
    # Display
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    tag_line = models.CharField(max_length=100, blank=True)
    button_text = models.CharField(max_length=50, default="Get Started")
    
    class Meta:
        ordering = ['sort_order', 'monthly_price']
        indexes = [
            models.Index(fields=['package_type', 'is_active']),
        ]
        
    def __str__(self):
        return f"{self.name}"
    
    def get_price(self, billing_cycle='monthly'):
        prices = {
            'monthly': self.monthly_price,
            'quarterly': self.quarterly_price,
            'yearly': self.yearly_price
        }
        return prices.get(billing_cycle, self.monthly_price)


# ==================== SUBSCRIPTION MODEL ====================

class Subscription(BaseModel):
    """Organization Subscription"""
    STATUS_CHOICES = (
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('suspended', 'Suspended'),
        ('past_due', 'Past Due'),
    )
    
    BILLING_CYCLE = (
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        'accounts.Organization', 
        on_delete=models.CASCADE, 
        related_name='subscription'
    )
    package = models.ForeignKey(
        Package, 
        on_delete=models.PROTECT, 
        related_name='subscriptions'
    )
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='trial', 
        db_index=True
    )
    billing_cycle = models.CharField(
        max_length=20, 
        choices=BILLING_CYCLE, 
        default='monthly'
    )
    
    # Dates
    start_date = models.DateField(default=timezone.now)
    trial_end_date = models.DateField(null=True, blank=True)
    current_period_start = models.DateField(default=timezone.now)
    current_period_end = models.DateField()
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    
    # Usage tracking
    employee_count = models.PositiveIntegerField(default=0)
    company_count = models.PositiveIntegerField(default=1)
    storage_used_gb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Auto-renewal
    auto_renew = models.BooleanField(default=True)
    
    # Payment gateway references
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Billing contact
    billing_email = models.EmailField(blank=True)
    billing_name = models.CharField(max_length=200, blank=True)
    billing_address = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['current_period_end']),
            models.Index(fields=['status', 'auto_renew']),
        ]
        
    def __str__(self):
        return f"{self.organization.name} - {self.package.name} ({self.status})"
    
    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in ['trial', 'active'] and self.current_period_end >= timezone.now().date()
    
    @property
    def days_remaining(self):
        """Calculate days remaining in current period"""
        if self.current_period_end:
            delta = self.current_period_end - timezone.now().date()
            return max(0, delta.days)
        return 0
    
    @property
    def is_trial(self):
        """Check if subscription is in trial"""
        return self.status == 'trial'
    
    def can_add_employee(self):
        """Check if can add more employees"""
        if self.package.max_employees is None:
            return True
        return self.employee_count < self.package.max_employees
    
    def can_add_company(self):
        """Check if can add more companies"""
        return self.company_count < self.package.max_companies
    
    def renew_subscription(self, billing_cycle=None):
        """Renew subscription for next period"""
        if billing_cycle:
            self.billing_cycle = billing_cycle
        
        # Calculate new period
        self.current_period_start = self.current_period_end + timedelta(days=1)
        
        if self.billing_cycle == 'monthly':
            self.current_period_end = self.current_period_start + timedelta(days=30)
        elif self.billing_cycle == 'quarterly':
            self.current_period_end = self.current_period_start + timedelta(days=90)
        elif self.billing_cycle == 'yearly':
            self.current_period_end = self.current_period_start + timedelta(days=365)
        
        self.price = self.package.get_price(self.billing_cycle)
        self.status = 'active'
        self.save()


# ==================== PAYMENT MODEL ====================

class Payment(BaseModel):
    """Payment transactions"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    )
    
    PAYMENT_METHOD = (
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('wallet', 'Wallet'),
        ('bank_transfer', 'Bank Transfer'),
        ('other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        Subscription, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    
    # Amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending', 
        db_index=True
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, blank=True)
    
    # Payment gateway details
    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    gateway = models.CharField(max_length=50, help_text="stripe, razorpay, etc.")
    gateway_payment_id = models.CharField(max_length=100, blank=True)
    gateway_order_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Payment date
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Invoice
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    invoice_url = models.URLField(blank=True)
    
    # Refund
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_date = models.DateTimeField(null=True, blank=True)
    refund_reason = models.TextField(blank=True)
    refund_transaction_id = models.CharField(max_length=100, blank=True)
    
    # Billing details
    billing_name = models.CharField(max_length=200, blank=True)
    billing_email = models.EmailField(blank=True)
    billing_phone = models.CharField(max_length=20, blank=True)
    billing_address = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subscription', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['gateway', 'gateway_payment_id']),
            models.Index(fields=['invoice_number']),
        ]
        
    def __str__(self):
        return f"{self.subscription.organization.name} - {self.total_amount} {self.currency} ({self.status})"


# ==================== USAGE TRACKING MODEL ====================

class FeatureUsage(BaseModel):
    """Track feature usage for analytics and limits"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        Subscription, 
        on_delete=models.CASCADE, 
        related_name='usage_logs'
    )
    
    feature_name = models.CharField(max_length=100, db_index=True)
    usage_count = models.PositiveIntegerField(default=0)
    usage_date = models.DateField(auto_now_add=True, db_index=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ('subscription', 'feature_name', 'usage_date')
        indexes = [
            models.Index(fields=['subscription', 'usage_date']),
            models.Index(fields=['feature_name', 'usage_date']),
        ]
        
    def __str__(self):
        return f"{self.subscription.organization.name} - {self.feature_name} ({self.usage_count})"
