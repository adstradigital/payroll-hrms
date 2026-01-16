from django.test import TestCase
from .models import Company, Department, Designation, Employee
from django.contrib.auth.models import User
from datetime import date


class CompanyModelTest(TestCase):
    def test_company_creation(self):
        company = Company.objects.create(name="Test Corp", email="test@test.com")
        self.assertEqual(str(company), "Test Corp")


class EmployeeModelTest(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Corp")
        self.department = Department.objects.create(company=self.company, name="IT")
        self.designation = Designation.objects.create(company=self.company, name="Developer")
    
    def test_employee_creation(self):
        employee = Employee.objects.create(
            employee_id="EMP001",
            company=self.company,
            department=self.department,
            designation=self.designation,
            first_name="John",
            last_name="Doe",
            email="john@test.com",
            date_of_joining=date.today()
        )
        self.assertEqual(employee.full_name, "John Doe")
        self.assertEqual(str(employee), "EMP001 - John Doe")
