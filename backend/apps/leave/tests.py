from django.test import TestCase
from apps.accounts.models import Organization, Employee
from .models import LeaveType, LeaveBalance, LeaveRequest
from datetime import date


class LeaveRequestTest(TestCase):
    def setUp(self):
        self.company = Organization.objects.create(name="Test Corp", slug="test-corp")
        self.employee = Employee.objects.create(
            employee_id="EMP001",
            company=self.company,
            first_name="John",
            email="john@test.com",
            date_of_joining=date.today()
        )
        self.leave_type = LeaveType.objects.create(
            company=self.company,
            name="Casual Leave",
            code="CL",
            days_per_year=12
        )
    
    def test_leave_days_calculation(self):
        leave = LeaveRequest(
            employee=self.employee,
            leave_type=self.leave_type,
            start_date=date(2026, 1, 15),
            end_date=date(2026, 1, 17),
            reason="Vacation"
        )
        leave.save()
        self.assertEqual(leave.days_count, 3)
