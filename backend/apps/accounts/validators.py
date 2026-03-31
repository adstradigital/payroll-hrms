import re
from rest_framework import serializers

def validate_password_complexity(password, organization=None):
    """
    Validates password complexity based on organization settings.
    Default rules (if enabled): 
    - Min 8 characters
    - 1 Uppercase
    - 1 Lowercase
    - 1 Number
    - 1 Special character
    """
    # If organization is provided, check if strong_password is enabled
    if organization:
        # Check settings for 'strong_password' key
        is_strong_required = organization.settings.get('strong_password', False)
        if not is_strong_required:
            # If not required, still enforce a minimum length of 6 for basic security
            if len(password) < 6:
                raise serializers.ValidationError("Password must be at least 6 characters long.")
            return password

    # Enforce Strong Password rules
    if len(password) < 8:
        raise serializers.ValidationError("Strong password must be at least 8 characters long.")
    
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
    if not re.search(r'[a-z]', password):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
    if not re.search(r'\d', password):
        raise serializers.ValidationError("Password must contain at least one number.")
        
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise serializers.ValidationError("Password must contain at least one special character.")
        
    return password
