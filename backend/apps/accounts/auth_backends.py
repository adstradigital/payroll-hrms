from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

import logging

logger = logging.getLogger(__name__)

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        
        logger.info(f"Attempting authentication for username/email: {username}")
        
        try:
            # Try to fetch user by email or username
            user = UserModel.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
            if user.check_password(password):
                logger.info(f"Authentication successful for user: {user.username}")
                return user
            else:
                logger.warning(f"Authentication failed: Invalid password for user: {user.username}")
        except UserModel.DoesNotExist:
            logger.warning(f"Authentication failed: User with username/email {username} not found")
            return None
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
        
    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
