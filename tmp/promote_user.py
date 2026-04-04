import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

email = 'mishalmuhammed638@gmail.com'
try:
    user = User.objects.get(email=email)
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print(f"User {user.username} successfully promoted to Superuser.")
except User.DoesNotExist:
    print(f"User with email {email} does not exist.")
except Exception as e:
    print(f"Error: {e}")
