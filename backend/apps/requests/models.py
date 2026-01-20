from django.db import models
from django.contrib.auth.models import User
from apps.accounts.models import BaseModel, Employee

class BaseRequest(BaseModel):
    """Abstract base request model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='%(class)s_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_approvals')
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        abstract = True

class DocumentRequest(BaseRequest):
    document_type = models.CharField(max_length=100)
    reason = models.TextField()
    
    def __str__(self):
        return f"{self.employee} - {self.document_type}"

class ShiftRequest(BaseRequest):
    current_shift = models.CharField(max_length=100)
    requested_shift = models.CharField(max_length=100)
    reason = models.TextField()
    effective_date = models.DateField()
    
    def __str__(self):
        return f"{self.employee} - Shift Change"

class WorkTypeRequest(BaseRequest):
    WORK_TYPE_CHOICES = [
        ('On-Site', 'On-Site'),
        ('Remote', 'Remote'),
        ('Hybrid', 'Hybrid'),
    ]
    current_type = models.CharField(max_length=50, choices=WORK_TYPE_CHOICES)
    requested_type = models.CharField(max_length=50, choices=WORK_TYPE_CHOICES)
    reason = models.TextField()
    effective_date = models.DateField()
    
    def __str__(self):
        return f"{self.employee} - {self.requested_type}"
