from django.core.exceptions import PermissionDenied
from .models import Employee

def get_employee_or_none(user):
    """
    Centralized helper to get the Employee profile for a User.
    Rules:
    - Superuser: Always returns None (Platform User).
    - Business User: MUST have an Employee profile.
    - If a business user lacks a profile, raises PermissionDenied to prevent 'guessing' logic.
    """
    if not user or not user.is_authenticated:
        return None
        
    if user.is_superuser:
        return None
        
    try:
        # We use .employee which is the new related_name after refactor
        return getattr(user, 'employee_profile', None)
    except Exception:
        return None

def get_employee_org_id(user):
    """Safely get the company/organization ID for a user."""
    employee = get_employee_or_none(user)
    if employee:
        return employee.company_id
    return None
