from rest_framework import serializers
from .models import ActivityLog
from django.contrib.auth.models import User

class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class ActivityLogSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'timestamp', 'user', 'user_detail', 'user_role',
            'action_type', 'action_type_display', 'module', 'module_display',
            'reference_id', 'description', 'old_value', 'new_value',
            'ip_address', 'status'
        ]
        read_only_fields = ['id', 'timestamp']
