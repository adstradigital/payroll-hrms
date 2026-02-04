from django.db import models
from django.contrib.auth.models import User
from apps.accounts.models import BaseModel, Organization, Employee
import uuid

class AssetBatch(BaseModel):
    """Batch of assets added or maintained together"""
    BATCH_TYPE_CHOICES = [
        ('purchase', 'Purchase'),
        ('upgrade', 'Upgrade'),
        ('maintenance', 'Maintenance'),
    ]
    
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='asset_batches')
    name = models.CharField(max_length=150)
    batch_type = models.CharField(max_length=20, choices=BATCH_TYPE_CHOICES, default='purchase')
    items_count = models.PositiveIntegerField(default=0)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    vendor = models.CharField(max_length=150, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.batch_type})"

class Asset(BaseModel):
    """Individual asset record"""
    CATEGORY_CHOICES = [
        ('laptop', 'Laptop'),
        ('monitor', 'Monitor'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
        ('peripherals', 'Peripherals'),
        ('audio', 'Audio'),
        ('printer', 'Printer'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('in_repair', 'In Repair'),
        ('lost', 'Lost'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset_id = models.CharField(max_length=50, unique=True, db_index=True)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    model = models.CharField(max_length=150, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_assets')
    
    batch = models.ForeignKey(AssetBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    
    purchase_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.asset_id} - {self.name}"

class AssetRequest(BaseModel):
    """Employee requests for assets"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='asset_requests')
    asset_type = models.CharField(max_length=100)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    reason = models.TextField()
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='asset_request_approvals')
    rejection_reason = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.asset_type} request"

class AssetHistory(BaseModel):
    """Audit log for asset lifecycle events"""
    HISTORY_TYPE_CHOICES = [
        ('addition', 'Addition'),
        ('assignment', 'Assignment'),
        ('check-in', 'Check-in'),
        ('status', 'Status Change'),
        ('maintenance', 'Maintenance'),
        ('approval', 'Approval'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=150)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)
    history_type = models.CharField(max_length=20, choices=HISTORY_TYPE_CHOICES)
    
    def __str__(self):
        return f"{self.asset.asset_id} - {self.action} on {self.date}"
