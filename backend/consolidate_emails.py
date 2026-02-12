
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import Employee, User

def consolidate_emails():
    target_email = "mishalmuhammed638+mishal1@gmail.com"
    old_email = "mishalmuhammed68@gmail.com"
    
    print(f"Updating records from {old_email} to {target_email}...")
    
    # Update Employee records
    employees = Employee.objects.filter(email=old_email)
    emp_count = employees.update(email=target_email)
    print(f"Updated {emp_count} Employee records.")
    
    # Update User records
    users = User.objects.filter(email=old_email)
    user_count = users.update(email=target_email)
    print(f"Updated {user_count} User records.")
    
    # Also check for any 'Mishal Muhammed' names that might have no email or different ones
    mishals = Employee.objects.filter(first_name__icontains="Mishal", last_name__icontains="Muhammed")
    for m in mishals:
        if m.email != target_email:
            print(f"Correcting inconsistent email for {m.full_name} ({m.email}) -> {target_email}")
            m.email = target_email
            m.save()

if __name__ == "__main__":
    consolidate_emails()
