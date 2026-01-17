from django.test import TestCase
from apps.accounts.models import Organization, Employee
from .models import Shift, Attendance
from datetime import date, time


class AttendanceModelTest(TestCase):
    def setUp(self):
        self.company = Organization.objects.create(name="Test Corp", slug="test-corp")
        self.employee = Employee.objects.create(
            employee_id="EMP001",
            company=self.company,
            first_name="John",
            email="john@test.com",
            date_of_joining=date.today()
        )
        self.shift = Shift.objects.create(
            company=self.company,
            name="General",
            code="GEN",
            start_time=time(9, 0),
            end_time=time(18, 0)
        )
    
    def test_attendance_creation(self):
        attendance = Attendance.objects.create(
            employee=self.employee,
            date=date.today(),
            shift=self.shift,
            status='present'
        )
        self.assertEqual(attendance.status, 'present')
