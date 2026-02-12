
import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_smtp():
    print(f"SMTP Host: {settings.EMAIL_HOST}")
    print(f"SMTP User: {settings.EMAIL_HOST_USER}")
    
    recipient = "mishalmuhammed638@gmail.com" # The login email from .env
    print(f"Sending test email to {recipient}...")
    
    try:
        send_mail(
            "Test Email from HRMS",
            "This is a test email to verify SMTP configuration.",
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        print("Test email sent SUCCESSFULLY!")
    except Exception as e:
        print(f"Test email FAILED: {str(e)}")

if __name__ == "__main__":
    test_smtp()
