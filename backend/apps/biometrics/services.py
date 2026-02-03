import random
from datetime import datetime, timedelta
from django.utils import timezone
from .models import BiometricDevice, BiometricLog
from apps.accounts.models import Employee
from apps.attendance.models import Attendance, Shift
from django.db import transaction

class BiometricService:
    @staticmethod
    def test_connection(device_id):
        """Mock testing connection to a device"""
        try:
            device = BiometricDevice.objects.get(id=device_id)
            # In real scenario, use pyzk to connect
            # For now, simulate success 
            device.status = 'online'
            device.save()
            return True, "Successfully connected to device"
        except Exception as e:
            return False, str(e)

    @staticmethod
    def fetch_logs(device_id):
        """Mock fetching logs from a device"""
        try:
            device = BiometricDevice.objects.get(id=device_id)
            
            # Simulate fetching 5-10 random logs for existing employees
            employees = Employee.objects.filter(company=device.company, biometric_id__isnull=False)
            if not employees.exists():
                return 0, "No employees with biometric IDs found in system"

            new_logs_count = 0
            for _ in range(random.randint(5, 10)):
                emp = random.choice(employees)
                # Random time today
                timestamp = timezone.now().replace(
                    hour=random.randint(8, 18), 
                    minute=random.randint(0, 59),
                    second=0, microsecond=0
                )
                
                log, created = BiometricLog.objects.get_or_create(
                    device=device,
                    biometric_user_id=emp.biometric_id,
                    timestamp=timestamp,
                    defaults={
                        'employee': emp,
                        'verify_mode': 1
                    }
                )
                if created:
                    new_logs_count += 1

            device.total_logs_fetched += new_logs_count
            device.last_sync_at = timezone.now()
            device.status = 'online'
            device.save()
            
            return new_logs_count, f"Successfully fetched {new_logs_count} new logs"
        except Exception as e:
            return 0, str(e)

    @staticmethod
    def process_logs(company_id):
        """Convert BiometricLogs into Attendance records"""
        logs = BiometricLog.objects.filter(
            device__company_id=company_id,
            is_processed=False,
            employee__isnull=False
        ).order_by('timestamp')

        processed_count = 0
        
        with transaction.atomic():
            for log in logs:
                log_date = log.timestamp.date()
                emp = log.employee
                
                # Find or create attendance for this day
                attendance, created = Attendance.objects.get_or_create(
                    employee=emp,
                    date=log_date,
                    defaults={'status': 'present'} # Basic default
                )
                
                # Update check-in/out based on time
                # Simple logic: earlist log is In, latest is Out
                if not attendance.check_in_time or log.timestamp < attendance.check_in_time:
                    attendance.check_in_time = log.timestamp
                
                if not attendance.check_out_time or log.timestamp > attendance.check_out_time:
                    attendance.check_out_time = log.timestamp
                
                # Auto-assign default shift if missing
                if not attendance.shift:
                    default_shift = Shift.objects.filter(company=emp.company, is_default=True).first()
                    attendance.shift = default_shift

                attendance.save()
                
                # Mark log as processed
                log.is_processed = True
                log.processed_at = timezone.now()
                log.attendance_record = attendance
                log.save()
                
                processed_count += 1
                
        return processed_count
