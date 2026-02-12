from django.db import models
from django.contrib.auth.models import User
import uuid

class ActivityLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    user_role = models.CharField(max_length=50, null=True, blank=True)
    
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('UPLOAD', 'Upload'),
        ('PROCESS', 'Process'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('ERROR', 'Error'),
    ]
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    
    MODULE_CHOICES = [
        ('AUTH', 'Authentication'),
        ('EMPLOYEE', 'Employee Management'),
        ('SALARY', 'Salary Management'),
        ('ATTENDANCE', 'Attendance'),
        ('PAYROLL', 'Payroll'),
        ('BULK_UPLOAD', 'Bulk Upload'),
        ('SUPPORT', 'Support'),
        ('SYSTEM', 'System'),
        ('LEAVE', 'Leave Management'),
    ]
    module = models.CharField(max_length=20, choices=MODULE_CHOICES, db_index=True)
    
    reference_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    description = models.TextField()
    
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='SUCCESS', db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action_type} - {self.module}"
