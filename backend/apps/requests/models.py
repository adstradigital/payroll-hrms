from django.db import models
from django.contrib.auth.models import User
from apps.accounts.models import BaseModel, Employee
import uuid

class BaseRequest(BaseModel):
    """Abstract base request model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='%(class)s_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_approvals')
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        abstract = True

class DocumentRequest(BaseRequest):
    DIRECTION_CHOICES = [
        ('admin_to_employee', 'Admin Requesting from Employee'),
        ('employee_to_admin', 'Employee Requesting from Admin'),
    ]
    
    direction = models.CharField(max_length=30, choices=DIRECTION_CHOICES, default='employee_to_admin')
    document_type = models.CharField(max_length=100)
    reason = models.TextField()
    # For tracking document submissions (when admin requests from employee)
    document_file = models.FileField(upload_to='document_requests/', null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.employee} - {self.document_type} ({self.get_direction_display()})"

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

class ReimbursementRequest(BaseRequest):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    request_date = models.DateField()
    description = models.TextField()
    attachment = models.FileField(upload_to='reimbursements/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.employee} - Reimbursement - {self.amount}"

class EncashmentRequest(BaseRequest):
    from apps.leave.models import LeaveType
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    encashment_days = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField()
    
    def __str__(self):
        return f"{self.employee} - Encashment - {self.leave_type.name}"
