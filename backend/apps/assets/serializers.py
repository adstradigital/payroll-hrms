from rest_framework import serializers
from apps.accounts.serializers import EmployeeListSerializer, UserSerializer
from .models import Asset, AssetBatch, AssetRequest, AssetHistory

class AssetBatchSerializer(serializers.ModelSerializer):
    """Serializer for AssetBatch model"""
    class Meta:
        model = AssetBatch
        fields = '__all__'
        read_only_fields = ['id', 'company', 'created_at', 'updated_at', 'created_by', 'updated_by']

class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset model"""
    assigned_to_details = EmployeeListSerializer(source='assigned_to', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    
    class Meta:
        model = Asset
        fields = [
            'id', 'asset_id', 'company', 'name', 'category', 'model', 
            'serial_number', 'status', 'assigned_to', 'assigned_to_details',
            'batch', 'batch_name', 'purchase_date', 'warranty_expiry', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at', 'created_by', 'updated_by']

class AssetRequestSerializer(serializers.ModelSerializer):
    """Serializer for AssetRequest model"""
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    approver_details = UserSerializer(source='approver', read_only=True)
    
    class Meta:
        model = AssetRequest
        fields = [
            'id', 'employee', 'employee_details', 'asset_type', 'priority', 
            'reason', 'date', 'status', 'approver', 'approver_details', 
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee', 'date', 'created_at', 'updated_at', 'created_by', 'updated_by']

class AssetHistorySerializer(serializers.ModelSerializer):
    """Serializer for AssetHistory model"""
    user_details = UserSerializer(source='user', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_id = serializers.CharField(source='asset.asset_id', read_only=True)
    
    class Meta:
        model = AssetHistory
        fields = [
            'id', 'asset', 'asset_name', 'asset_id', 'action', 'user', 
            'user_details', 'date', 'details', 'history_type', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date', 'created_at', 'updated_at', 'created_by', 'updated_by']
