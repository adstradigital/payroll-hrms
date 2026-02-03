from django.db import models
from apps.accounts.models import Company, Employee
import uuid

class BiometricDevice(models.Model):
    """Configuration for Biometric Devices (ZKTeco, Essl, etc.)"""
    DEVICE_STATUS_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('maintenance', 'Maintenance'),
    )

    CONNECTION_METHOD_CHOICES = (
        ('api', 'API (Cloud)'),
        ('ip', 'Local Network (IP)'),
        ('excel', 'Excel Upload'),
        ('manual', 'Manual Entry'),
    )

    SYNC_MODE_CHOICES = (
        ('auto', 'Auto Sync'),
        ('manual', 'Manual Sync Only'),
    )

    DIRECTION_CHOICES = (
        ('in', 'In Device'),
        ('out', 'Out Device'),
        ('both', 'System Direction (In/Out)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='biometric_devices')
    name = models.CharField(max_length=150)
    device_model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, unique=True)
    
    # Connection details
    connection_method = models.CharField(max_length=20, choices=CONNECTION_METHOD_CHOICES, default='ip')
    ip_address = models.CharField(max_length=255, blank=True, null=True) # Changed to CharField to accommodate URLs if needed, or just stay GenericIPAddress
    port = models.PositiveIntegerField(default=4370)
    api_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Configuration
    sync_mode = models.CharField(max_length=20, choices=SYNC_MODE_CHOICES, default='manual')
    device_direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='both')
    activate_live_capture = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=DEVICE_STATUS_CHOICES, default='offline')
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    location = models.CharField(max_length=200, blank=True, help_text="e.g. Main Entrance, Cafeteria")
    
    # Statistics
    total_logs_fetched = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.ip_address})"

class BiometricLog(models.Model):
    """Raw logs fetched from biometric devices"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(BiometricDevice, on_delete=models.CASCADE, related_name='logs')
    
    # This info comes directly from the device
    biometric_user_id = models.CharField(max_length=50, db_index=True)
    timestamp = models.DateTimeField(db_index=True)
    verify_mode = models.IntegerField(default=0, help_text="1: Fingerprint, 3: Password, 4: Card, 15: Face")
    
    # Internal mapping
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='biometric_logs')
    is_processed = models.BooleanField(default=False, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    attendance_record = models.OneToOneField('attendance.Attendance', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_biometric_log')

    class Meta:
        ordering = ['-timestamp']
        unique_together = ('device', 'biometric_user_id', 'timestamp')

    def __str__(self):
        return f"Log: {self.biometric_user_id} at {self.timestamp}"
