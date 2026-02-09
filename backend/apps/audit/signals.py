from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from .utils import log_activity

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@receiver(user_logged_in)
def user_logged_in_callback(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    log_activity(
        user=user, 
        action_type='LOGIN', 
        module='AUTH', 
        description='User logged in successfully', 
        ip_address=ip
    )

@receiver(user_logged_out) 
def user_logged_out_callback(sender, request, user, **kwargs):
    ip = get_client_ip(request)
    log_activity(
        user=user, 
        action_type='LOGOUT', 
        module='AUTH', 
        description='User logged out', 
        ip_address=ip
    )
