import os
import django
import sys
import uuid

# Setup context
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import Organization, Employee, Department, Designation

def restore_admin_context():
    print("--- Restoring Admin Context ---")
    
    # 1. Get all organizations
    orgs = Organization.objects.all()
    if not orgs.exists():
        print("Error: No Organizations found in the database.")
        return

    # 2. Get users who should have profiles:
    # - Superusers
    # - Any user who is a 'created_by' for an organization
    creators = list(Organization.objects.values_list('created_by_id', flat=True))
    superusers = list(User.objects.filter(is_superuser=True).values_list('id', flat=True))
    
    target_user_ids = set(creators + superusers)
    target_user_ids.discard(None) # Remove None if some creators are empty
    
    admins = User.objects.filter(id__in=target_user_ids)

    for user in admins:
        # Determine which org to link to
        # First check if they created an org
        owned_org = Organization.objects.filter(created_by=user).first()
        org = owned_org or Organization.objects.first()
        
        if not org:
            print(f"Skipping user {user.username} - No org available.")
            continue

        if not hasattr(user, 'employee_profile') or user.employee_profile is None:
            # Check for existing Dept/Desig or create defaults
            dept, _ = Department.objects.get_or_create(
                company=org,
                code="ADMIN",
                defaults={"name": "Administration", "description": "System Administration"}
            )
            desig, _ = Designation.objects.get_or_create(
                company=org,
                code="SYSADMIN",
                defaults={"name": "System Administrator", "level": 10, "description": "Overall system management"}
            )

            # Create Employee Profile
            emp = Employee.objects.create(
                user=user,
                company=org,
                first_name=user.first_name or user.username,
                last_name=user.last_name or "",
                employee_id=f"ADM-{uuid.uuid4().hex[:4].upper()}",
                department=dept,
                designation=desig,
                status='active',
                is_admin=True,
                email=user.email or f"{user.username}@example.com",
                date_of_joining=django.utils.timezone.now().date()
            )
            print(f"Created Employee profile for user: {user.username} link to {org.name} -> {emp.employee_id}")
        else:
            print(f"User {user.username} already has an employee profile.")

    print("--- Context Restoration Complete ---")

if __name__ == "__main__":
    restore_admin_context()
