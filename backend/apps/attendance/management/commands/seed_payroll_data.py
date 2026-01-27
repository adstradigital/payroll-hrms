"""
Management command to seed attendance and leave data for payroll testing.
Usage: python manage.py seed_payroll_data
"""
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Employee
from apps.attendance.models import Attendance, AttendanceSummary
from apps.leave.models import LeaveRequest, LeaveType, LeaveBalance


class Command(BaseCommand):
    help = 'Seeds attendance and leave data for payroll testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=int,
            default=date.today().month,
            help='Month to seed data for (default: current month)'
        )
        parser.add_argument(
            '--year',
            type=int,
            default=date.today().year,
            help='Year to seed data for (default: current year)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        month = options['month']
        year = options['year']
        clear = options['clear']

        self.stdout.write(self.style.NOTICE(f'Seeding data for {month}/{year}...'))

        # Get all active employees
        employees = Employee.objects.filter(status='active')
        if not employees.exists():
            self.stdout.write(self.style.ERROR('No active employees found. Please create employees first.'))
            return

        self.stdout.write(f'Found {employees.count()} active employees')

        # Clear existing data if requested
        if clear:
            self.stdout.write('Clearing existing attendance data...')
            Attendance.objects.filter(date__month=month, date__year=year).delete()
            AttendanceSummary.objects.filter(month=month, year=year).delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        # Get working days for the month (excluding weekends)
        working_days = self._get_working_days(year, month)
        self.stdout.write(f'Working days in {month}/{year}: {len(working_days)}')

        # Seed attendance for each employee
        attendance_created = 0
        for emp in employees:
            for work_date in working_days:
                # Skip future dates
                if work_date > date.today():
                    continue

                # Check if attendance already exists
                if Attendance.objects.filter(employee=emp, date=work_date).exists():
                    continue

                # Generate random attendance pattern
                # 85% present, 5% absent, 5% on_leave, 5% half_day
                rand = random.random()
                if rand < 0.85:
                    status = 'present'
                elif rand < 0.90:
                    status = 'absent'
                elif rand < 0.95:
                    status = 'on_leave'
                else:
                    status = 'half_day'

                # Generate check-in time (8:30 AM - 10:00 AM)
                check_in_hour = random.randint(8, 9)
                check_in_minute = random.randint(0, 59)
                check_in_time = timezone.make_aware(
                    datetime(work_date.year, work_date.month, work_date.day, check_in_hour, check_in_minute)
                )

                # Generate check-out time (5:00 PM - 7:00 PM)
                check_out_hour = random.randint(17, 19)
                check_out_minute = random.randint(0, 59)
                check_out_time = timezone.make_aware(
                    datetime(work_date.year, work_date.month, work_date.day, check_out_hour, check_out_minute)
                )

                # Calculate total hours
                if status in ['present', 'half_day']:
                    time_diff = check_out_time - check_in_time
                    total_hours = Decimal(str(round(time_diff.total_seconds() / 3600, 2)))
                    if status == 'half_day':
                        total_hours = total_hours / 2
                else:
                    total_hours = Decimal('0')
                    check_in_time = None
                    check_out_time = None

                # Determine if late (after 9:30 AM)
                is_late = check_in_hour >= 9 and check_in_minute > 30 if check_in_time else False

                # Calculate overtime (> 8 hours)
                overtime_hours = max(Decimal('0'), total_hours - Decimal('8')) if total_hours > 8 else Decimal('0')

                Attendance.objects.create(
                    employee=emp,
                    date=work_date,
                    status=status,
                    check_in_time=check_in_time,
                    check_out_time=check_out_time,
                    total_hours=total_hours,
                    overtime_hours=overtime_hours,
                    is_late=is_late,
                    late_by_minutes=random.randint(5, 45) if is_late else 0,
                )
                attendance_created += 1
                
                # If on_leave, create an approved LeaveRequest to link it properly
                if status == 'on_leave':
                    try:
                        # Get a random leave type
                        leave_type = LeaveType.objects.first()
                        if leave_type:
                            LeaveRequest.objects.get_or_create(
                                employee=emp,
                                start_date=work_date,
                                end_date=work_date,
                                defaults={
                                    'leave_type': leave_type,
                                    'status': 'approved',
                                    'reason': 'Auto-generated for testing',
                                    'number_of_days': 1,
                                }
                            )
                    except Exception:
                        pass  # Skip if leave request creation fails

        self.stdout.write(self.style.SUCCESS(f'Created {attendance_created} attendance records'))

        # Seed leave balances if LeaveType exists
        try:
            leave_types = LeaveType.objects.all()
            if leave_types.exists():
                balances_created = 0
                for emp in employees:
                    for lt in leave_types:
                        balance, created = LeaveBalance.objects.get_or_create(
                            employee=emp,
                            leave_type=lt,
                            year=year,
                            defaults={
                                'total_days': lt.max_days_per_year or 12,
                                'used_days': random.randint(0, 5),
                                'carried_over': 0,
                            }
                        )
                        if created:
                            balances_created += 1
                self.stdout.write(self.style.SUCCESS(f'Created {balances_created} leave balances'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not seed leave balances: {e}'))

        # Generate attendance summaries
        try:
            summaries_created = 0
            for emp in employees:
                emp_attendances = Attendance.objects.filter(
                    employee=emp, date__month=month, date__year=year
                )
                
                if not emp_attendances.exists():
                    continue
                    
                summary, created = AttendanceSummary.objects.update_or_create(
                    employee=emp,
                    year=year,
                    month=month,
                    defaults={
                        'total_working_days': len(working_days),
                        'present_days': emp_attendances.filter(status='present').count(),
                        'absent_days': emp_attendances.filter(status='absent').count(),
                        'half_days': emp_attendances.filter(status='half_day').count(),
                        'leave_days': emp_attendances.filter(status='on_leave').count(),
                        'late_arrivals': emp_attendances.filter(is_late=True).count(),
                        'total_hours_worked': sum(a.total_hours or 0 for a in emp_attendances),
                        'overtime_hours': sum(a.overtime_hours or 0 for a in emp_attendances),
                    }
                )
                if created:
                    summaries_created += 1
            self.stdout.write(self.style.SUCCESS(f'Created {summaries_created} attendance summaries'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not create summaries: {e}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Payroll test data seeding complete!'))
        self.stdout.write(f'   - Month: {month}/{year}')
        self.stdout.write(f'   - Employees: {employees.count()}')
        self.stdout.write(f'   - Attendance Records: {attendance_created}')

    def _get_working_days(self, year, month):
        """Get list of working days (Mon-Fri) for the given month."""
        from calendar import monthrange
        
        _, days_in_month = monthrange(year, month)
        working_days = []
        
        for day in range(1, days_in_month + 1):
            d = date(year, month, day)
            # Monday = 0, Sunday = 6
            if d.weekday() < 5:  # Mon-Fri
                working_days.append(d)
        
        return working_days
