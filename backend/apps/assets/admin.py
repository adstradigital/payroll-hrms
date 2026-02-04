from django.contrib import admin
from .models import Asset, AssetBatch, AssetRequest, AssetHistory

@admin.register(AssetBatch)
class AssetBatchAdmin(admin.ModelAdmin):
    list_display = ('name', 'batch_type', 'items_count', 'date', 'status', 'company')
    list_filter = ('batch_type', 'status', 'company')
    search_fields = ('name', 'vendor')

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('asset_id', 'name', 'category', 'status', 'assigned_to', 'company')
    list_filter = ('category', 'status', 'company')
    search_fields = ('name', 'asset_id', 'serial_number')

@admin.register(AssetRequest)
class AssetRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'asset_type', 'priority', 'status', 'date')
    list_filter = ('status', 'priority')
    search_fields = ('employee__first_name', 'employee__last_name', 'asset_type')

@admin.register(AssetHistory)
class AssetHistoryAdmin(admin.ModelAdmin):
    list_display = ('asset', 'action', 'user', 'date', 'history_type')
    list_filter = ('history_type', 'date')
    search_fields = ('asset__name', 'asset__asset_id', 'action')
