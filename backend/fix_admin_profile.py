import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Employee, Organization

from django.utils import timezone

def fix_admin():
    try:
        user = User.objects.get(username='admin')
        org = Organization.objects.first()
        
        if not org:
            org = Organization.objects.create(
                name='Default Organization', 
                slug='default-organization',
                is_active=True,
                is_parent=True
            )
            print(f"Created organization: {org.name}")
        else:
            print(f"Using existing organization: {org.name}")
            
        emp, created = Employee.objects.get_or_create(
            user=user,
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'email': user.email or 'admin@example.com',
                'employee_id': 'EMP-ADMIN-001',
                'company': org,
                'status': 'active',
                'is_admin': True,
                'date_of_joining': timezone.now().date()
            }
        )
        
        if created:
            print(f"Successfully created Employee profile for 'admin' user.")
        else:
            print(f"Employee profile for 'admin' user already exists.")
            # Ensure it is linked to the correct company if it was broken
            if not emp.company:
                emp.company = org
                emp.save()
                print(f"Updated missing company for admin profile.")
                
    except User.DoesNotExist:
        print("User 'admin' not found. Please create the user first.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    fix_admin()
