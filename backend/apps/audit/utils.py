from .models import ActivityLog
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)

def log_activity(user, action_type, module, description, reference_id=None, old_value=None, new_value=None, ip_address=None, status='SUCCESS'):
    """
    Utility function to create an activity log entry.
    """
    try:
        user_role = None
        if user and hasattr(user, 'groups'):
            # Simple role detection (can be more complex based on project needs)
            groups = user.groups.values_list('name', flat=True)
            user_role = ", ".join(groups) if groups else "User"
        
        # Ensure user is User instance or None
        if not isinstance(user, User):
            user = None

        log_entry = ActivityLog.objects.create(
            user=user,
            user_role=user_role,
            action_type=action_type,
            module=module,
            description=description,
            reference_id=reference_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            status=status
        )
        return log_entry
    except Exception as e:
        logger.error(f"Failed to create activity log: {str(e)}")
        return None
