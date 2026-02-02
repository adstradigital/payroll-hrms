import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

tables = [
    'payroll_employeesalarycomponent',
    'payroll_payslipcomponent',
    'payroll_salarystructurecomponent',
    'payroll_employeesalary',
    'payroll_payslip',
    'payroll_salarystructure',
    'payroll_salarycomponent',
    'payroll_payrollperiod',
]

with connection.cursor() as cursor:
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for table in tables:
        try:
            print(f"Dropping table {table}...")
            cursor.execute(f"DROP TABLE IF EXISTS {table};")
            print(f"Dropped {table}.")
        except Exception as e:
            print(f"Error dropping {table}: {e}")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    
    # Also clear migration history for payroll
    print("Clearing migration history for 'payroll'...")
    cursor.execute("DELETE FROM django_migrations WHERE app = 'payroll';")
    print("Migration history cleared.")

print("Done. You can now run 'python manage.py migrate payroll'.")
