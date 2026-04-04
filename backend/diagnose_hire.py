import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.recruitment.models import Candidate
from apps.accounts.models import Employee
from apps.recruitment.serializers import HireCandidateSerializer

def main():
    try:
        candidate = Candidate.objects.get(pk=1)
        print(f"Candidate ID: {candidate.id}")
        print(f"Name: {candidate.full_name}")
        print(f"Email: {candidate.email}")
        print(f"Status: {candidate.status}")
        
        # Check for existing employee with this email
        employee = Employee.objects.filter(email__iexact=candidate.email).first()
        if employee:
            print(f"ALREADY HIRED: Existing Employee found with email {candidate.email}: {employee.full_name} (ID: {employee.employee_id})")
        else:
            print("No existing employee found with this email.")
            
        # Test serializer with some dummy data similar to what frontend might send
        data = {
            'employee_id': 'EMP-TEST-999',
            'joining_date': '2026-04-02',
            'department_id': 'invalid-uuid', # intentional test
            'designation_id': 'invalid-uuid', # intentional test
            'employment_type': 'permanent',
            'basic_salary': '',
            'probation_months': 6,
            'is_admin': False
        }
        
        # Try to find a valid department and designation to test "real" data
        from apps.accounts.models import Department, Designation
        dept = Department.objects.first()
        desig = Designation.objects.first()
        
        if dept and desig:
            data['department_id'] = str(dept.id)
            data['designation_id'] = str(desig.id)
            print(f"Testing with valid Dept: {dept.id}, Desig: {desig.id}")
        
        serializer = HireCandidateSerializer(data=data)
        if serializer.is_valid():
            print("Serializer is VALID with dummy data (with salary='')")
        else:
            print(f"Serializer ERRORS: {serializer.errors}")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
