from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Asset, AssetBatch, AssetRequest, AssetHistory
from .serializers import (
    AssetSerializer, AssetBatchSerializer, 
    AssetRequestSerializer, AssetHistorySerializer
)
from apps.audit.utils import log_activity
import logging

logger = logging.getLogger(__name__)

def get_client_company(user):
    if hasattr(user, 'employee_profile') and user.employee_profile:
        return user.employee_profile.company
    elif hasattr(user, 'organization') and user.organization:
        return user.organization
    return None

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def asset_batch_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = AssetBatch.objects.filter(company=company)
            # Basic filtering
            batch_type = request.query_params.get('batch_type')
            status_filter = request.query_params.get('status')
            if batch_type: queryset = queryset.filter(batch_type=batch_type)
            if status_filter: queryset = queryset.filter(status=status_filter)
            return Response(AssetBatchSerializer(queryset, many=True).data)
        elif request.method == 'POST':
            serializer = AssetBatchSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company, created_by=request.user)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def asset_batch_detail(request, pk):
    try:
        company = get_client_company(request.user)
        batch = get_object_or_404(AssetBatch, pk=pk, company=company)
        if request.method == 'GET':
            return Response(AssetBatchSerializer(batch).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = AssetBatchSerializer(batch, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            batch.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def asset_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = Asset.objects.filter(company=company)
            category = request.query_params.get('category')
            status_filter = request.query_params.get('status')
            assigned_to = request.query_params.get('assigned_to')
            batch = request.query_params.get('batch')
            if category: queryset = queryset.filter(category=category)
            if status_filter: queryset = queryset.filter(status=status_filter)
            if assigned_to: queryset = queryset.filter(assigned_to_id=assigned_to)
            if batch: queryset = queryset.filter(batch_id=batch)
            return Response(AssetSerializer(queryset, many=True).data)
        elif request.method == 'POST':
            serializer = AssetSerializer(data=request.data)
            if serializer.is_valid():
                asset = serializer.save(company=company, created_by=request.user)
                AssetHistory.objects.create(asset=asset, action="New Asset Added", user=request.user, history_type='addition', details=f"Asset added to inventory. Status: {asset.status}")
                
                log_activity(
                    user=request.user,
                    action_type='CREATE',
                    module='ASSET',
                    description=f"Asset added: {asset.name} ({asset.asset_id})",
                    reference_id=str(asset.id)
                )
                
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def asset_detail(request, pk):
    try:
        company = get_client_company(request.user)
        asset = get_object_or_404(Asset, pk=pk, company=company)
        if request.method == 'GET': return Response(AssetSerializer(asset).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = AssetSerializer(asset, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            asset.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asset_allocate(request, pk):
    try:
        company = get_client_company(request.user)
        asset = get_object_or_404(Asset, pk=pk, company=company)
        employee_id = request.data.get('employee_id')
        if not employee_id: return Response({"error": "employee_id is required"}, status=400)
        asset.assigned_to_id = employee_id; asset.status = 'allocated'; asset.save()
        AssetHistory.objects.create(asset=asset, action="Asset Allocated", user=request.user, history_type='assignment', details=f"Allocated to employee {employee_id}")
        
        log_activity(
            user=request.user,
            action_type='UPDATE',
            module='ASSET',
            description=f"Asset {asset.name} allocated to employee {employee_id}",
            reference_id=str(asset.id)
        )
        
        return Response(AssetSerializer(asset).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asset_deallocate(request, pk):
    try:
        company = get_client_company(request.user)
        asset = get_object_or_404(Asset, pk=pk, company=company)
        asset.assigned_to = None; asset.status = 'available'; asset.save()
        AssetHistory.objects.create(asset=asset, action="Asset Deallocated", user=request.user, history_type='check-in', details="Asset returned to inventory")
        
        log_activity(
            user=request.user,
            action_type='UPDATE',
            module='ASSET',
            description=f"Asset {asset.name} deallocated",
            reference_id=str(asset.id)
        )
        
        return Response(AssetSerializer(asset).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def asset_dashboard_stats(request):
    try:
        company = get_client_company(request.user)
        if not company: return Response({"error": "Company not found"}, status=404)
        assets = Asset.objects.filter(company=company)
        total_assets = assets.count()
        active_assets = assets.filter(status='available').count()
        allocated_assets = assets.filter(status='allocated').count()
        pending_requests = AssetRequest.objects.filter(employee__company=company, status='pending').count()
        in_maintenance = assets.filter(status='in-repair').count()
        lost_damaged = assets.filter(status='lost').count()
        functional = total_assets - in_maintenance - lost_damaged
        health_stats = {"functional_pct": round((functional / total_assets * 100), 1) if total_assets > 0 else 0, "maintenance_pct": round((in_maintenance / total_assets * 100), 1) if total_assets > 0 else 0, "damaged_pct": round((lost_damaged / total_assets * 100), 1) if total_assets > 0 else 0}
        recent_history = AssetHistory.objects.filter(asset__company=company).order_by('-date')[:5]
        return Response({"summary": {"total": total_assets, "active": total_assets - lost_damaged, "available": active_assets, "allocated": allocated_assets, "pending_requests": pending_requests}, "health": health_stats, "recent_activity": AssetHistorySerializer(recent_history, many=True).data})
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def asset_request_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = AssetRequest.objects.all()
            if hasattr(request.user, 'employee_profile') and request.user.employee_profile:
                comp = request.user.employee_profile.company
                if request.user.employee_profile.is_admin: queryset = queryset.filter(employee__company=comp)
                else: queryset = queryset.filter(employee=request.user.employee_profile)
            else: queryset = queryset.none()
            
            status_filter = request.query_params.get('status')
            priority = request.query_params.get('priority')
            if status_filter: queryset = queryset.filter(status=status_filter)
            if priority: queryset = queryset.filter(priority=priority)
            return Response(AssetRequestSerializer(queryset.order_by('-created_at'), many=True).data)
        elif request.method == 'POST':
            serializer = AssetRequestSerializer(data=request.data)
            if serializer.is_valid():
                employee = getattr(request.user, 'employee_profile', None)
                serializer.save(employee=employee, created_by=request.user)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def asset_request_detail(request, pk):
    try:
        company = get_client_company(request.user)
        # Add basic access check here if needed, or rely on queryset filtering in detail
        asset_request = get_object_or_404(AssetRequest, pk=pk)
        if request.method == 'GET': return Response(AssetRequestSerializer(asset_request).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = AssetRequestSerializer(asset_request, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            asset_request.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asset_request_process(request, pk):
    try:
        asset_request = get_object_or_404(AssetRequest, pk=pk)
        action_type = request.data.get('action') # 'approve' or 'reject'
        reason = request.data.get('reason', '')
        if action_type == 'approve': asset_request.status = 'approved'
        elif action_type == 'reject': asset_request.status = 'rejected'; asset_request.rejection_reason = reason
        else: return Response({"error": "Invalid action"}, status=400)
        asset_request.approver = request.user; asset_request.save()
        return Response(AssetRequestSerializer(asset_request).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def asset_history_list(request):
    try:
        company = get_client_company(request.user)
        queryset = AssetHistory.objects.filter(asset__company=company)
        asset_id = request.query_params.get('asset')
        history_type = request.query_params.get('history_type')
        user_id = request.query_params.get('user')
        if asset_id: queryset = queryset.filter(asset_id=asset_id)
        if history_type: queryset = queryset.filter(history_type=history_type)
        if user_id: queryset = queryset.filter(user_id=user_id)
        return Response(AssetHistorySerializer(queryset.order_by('-date'), many=True).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def asset_history_detail(request, pk):
    try:
        company = get_client_company(request.user)
        history = get_object_or_404(AssetHistory, pk=pk, asset__company=company)
        return Response(AssetHistorySerializer(history).data)
    except Exception as e: return Response({'error': str(e)}, status=500)
