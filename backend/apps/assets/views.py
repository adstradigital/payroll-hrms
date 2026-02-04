from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Asset, AssetBatch, AssetRequest, AssetHistory
from .serializers import (
    AssetSerializer, AssetBatchSerializer, 
    AssetRequestSerializer, AssetHistorySerializer,
    AssetHistorySerializer as HistoryDetailSerializer
)
from apps.audit.utils import log_activity

class AssetBatchViewSet(viewsets.ModelViewSet):
    queryset = AssetBatch.objects.all()
    serializer_class = AssetBatchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'batch_type', 'status']
    search_fields = ['name', 'vendor']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return self.queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return self.queryset.filter(company=user.organization)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
        serializer.save(company=company, created_by=user)

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'category', 'status', 'assigned_to', 'batch']
    search_fields = ['name', 'asset_id', 'serial_number', 'model']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return self.queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return self.queryset.filter(company=user.organization)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
        asset = serializer.save(company=company, created_by=user)
        
        AssetHistory.objects.create(
            asset=asset,
            action="New Asset Added",
            user=user,
            history_type='addition',
            details=f"Asset added to inventory. Status: {asset.status}"
        )

    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        asset = self.get_object()
        employee_id = request.data.get('employee_id')
        
        if not employee_id:
            return Response({"error": "employee_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        asset.assigned_to_id = employee_id
        asset.status = 'allocated'
        asset.save()
        
        AssetHistory.objects.create(
            asset=asset,
            action="Asset Allocated",
            user=request.user,
            history_type='assignment',
            details=f"Allocated to employee {employee_id}"
        )
        
        return Response(AssetSerializer(asset).data)

    @action(detail=True, methods=['post'])
    def deallocate(self, request, pk=None):
        asset = self.get_object()
        asset.assigned_to = None
        asset.status = 'available'
        asset.save()
        
        AssetHistory.objects.create(
            asset=asset,
            action="Asset Deallocated",
            user=request.user,
            history_type='check-in',
            details="Asset returned to inventory"
        )
        
        return Response(AssetSerializer(asset).data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        company = None
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
            
        if not company:
            return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

        assets = Asset.objects.filter(company=company)
        total_assets = assets.count()
        active_assets = assets.filter(status='available').count()
        allocated_assets = assets.filter(status='allocated').count()
        pending_requests = AssetRequest.objects.filter(employee__company=company, status='pending').count()
        
        in_maintenance = assets.filter(status='in-repair').count()
        lost_damaged = assets.filter(status='lost').count()
        functional = total_assets - in_maintenance - lost_damaged
        
        health_stats = {
            "functional_pct": round((functional / total_assets * 100), 1) if total_assets > 0 else 0,
            "maintenance_pct": round((in_maintenance / total_assets * 100), 1) if total_assets > 0 else 0,
            "damaged_pct": round((lost_damaged / total_assets * 100), 1) if total_assets > 0 else 0,
        }
        
        recent_history = AssetHistory.objects.filter(asset__company=company).order_by('-date')[:5]
        history_data = AssetHistorySerializer(recent_history, many=True).data

        return Response({
            "summary": {
                "total": total_assets,
                "active": total_assets - lost_damaged, # Active means not lost
                "available": active_assets,
                "allocated": allocated_assets,
                "pending_requests": pending_requests
            },
            "health": health_stats,
            "recent_activity": history_data
        })

class AssetRequestViewSet(viewsets.ModelViewSet):
    queryset = AssetRequest.objects.all()
    serializer_class = AssetRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'priority', 'employee']
    search_fields = ['asset_type', 'reason']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
            # Admin can see all, employee only their own
            if user.employee_profile.is_admin:
                return self.queryset.filter(employee__company=company)
            return self.queryset.filter(employee=user.employee_profile)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)
        serializer.save(employee=employee, created_by=user)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        asset_request = self.get_object()
        action_type = request.data.get('action') # 'approve' or 'reject'
        reason = request.data.get('reason', '')
        
        if action_type == 'approve':
            asset_request.status = 'approved'
        elif action_type == 'reject':
            asset_request.status = 'rejected'
            asset_request.rejection_reason = reason
        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            
        asset_request.approver = request.user
        asset_request.save()
        
        return Response(AssetRequestSerializer(asset_request).data)

class AssetHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetHistory.objects.all()
    serializer_class = AssetHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['asset', 'history_type', 'user']
    search_fields = ['action', 'details']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return self.queryset.filter(asset__company=user.employee_profile.company)
        return self.queryset.none()
