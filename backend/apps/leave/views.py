from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import date
import logging
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer, 
    LeaveRequestSerializer, LeaveRequestApprovalSerializer
)
from apps.accounts.permissions import is_client_admin
from apps.audit.utils import log_activity

logger = logging.getLogger(__name__)

def get_client_company(user):
    if hasattr(user, 'employee_profile') and user.employee_profile:
        return user.employee_profile.company
    elif hasattr(user, 'organization') and user.organization:
        return user.organization
    return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_type_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveType.objects.filter(company=company)
            # Add simple filters if needed
            serializer = LeaveTypeSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveTypeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_type_detail(request, pk):
    try:
        company = get_client_company(request.user)
        leave_type = get_object_or_404(LeaveType, pk=pk, company=company)
        if request.method == 'GET':
            return Response(LeaveTypeSerializer(leave_type).data)
        elif request.method in ['PUT', 'PATCH']:
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveTypeSerializer(leave_type, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            leave_type.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_balance_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveBalance.objects.filter(employee__company=company).select_related('employee', 'leave_type')
            employee_id = request.query_params.get('employee')
            year = request.query_params.get('year')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if year: queryset = queryset.filter(year=year)
            return Response(LeaveBalanceSerializer(queryset, many=True).data)
        elif request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveBalanceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_balance_detail(request, pk):
    try:
        company = get_client_company(request.user)
        balance = get_object_or_404(LeaveBalance, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(LeaveBalanceSerializer(balance).data)
        elif request.method in ['PUT', 'PATCH']:
            if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveBalanceSerializer(balance, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
            balance.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_balance_my_balance(request):
    try:
        employee_id = request.query_params.get('employee')
        year = request.query_params.get('year', date.today().year)
        if not employee_id: return Response({'error': 'employee parameter required'}, status=400)
        balances = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
        return Response(LeaveBalanceSerializer(balances, many=True).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_balance_allocate(request):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        employee_ids = request.data.get('employees', [])
        year = request.data.get('year', date.today().year)
        company_id = request.data.get('company')
        if not company_id: return Response({'error': 'company parameter required'}, status=400)
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        created = 0
        for emp_id in employee_ids:
            for lt in leave_types:
                _, was_created = LeaveBalance.objects.get_or_create(employee_id=emp_id, leave_type=lt, year=year, defaults={'allocated': lt.days_per_year})
                if was_created: created += 1
        return Response({'message': f'Created {created} leave balance records'})
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_balance_run_accrual(request):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        from django.db.models import F
        company_id = request.data.get('company')
        if not company_id: return Response({'error': 'company parameter required'}, status=400)
        today = date.today()
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        accrued_count = 0
        for lt in leave_types:
            if lt.accrual_type == 'monthly':
                accrual_amount = lt.days_per_year / 12
                accrued_count += LeaveBalance.objects.filter(leave_type=lt, year=today.year).update(allocated=F('allocated') + accrual_amount)
            elif lt.accrual_type == 'quarterly' and today.month in [1, 4, 7, 10]:
                accrual_amount = lt.days_per_year / 4
                accrued_count += LeaveBalance.objects.filter(leave_type=lt, year=today.year).update(allocated=F('allocated') + accrual_amount)
        return Response({'message': f'Accrued leaves for {accrued_count} records'})
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_request_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveRequest.objects.filter(employee__company=company).select_related('employee', 'leave_type', 'approved_by')
            employee_id = request.query_params.get('employee')
            status_filter = request.query_params.get('status')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if status_filter: queryset = queryset.filter(status=status_filter)
            return Response(LeaveRequestSerializer(queryset.order_by('-created_at'), many=True).data)
        elif request.method == 'POST':
            serializer = LeaveRequestSerializer(data=request.data)
            if serializer.is_valid():
                leave_request = serializer.save()
                balance, _ = LeaveBalance.objects.get_or_create(employee=leave_request.employee, leave_type=leave_request.leave_type, year=leave_request.start_date.year, defaults={'allocated': leave_request.leave_type.days_per_year})
                balance.pending += leave_request.days_count; balance.save()
                
                log_activity(
                    user=request.user,
                    action_type='CREATE',
                    module='LEAVE',
                    description=f"Leave request submitted for {leave_request.days_count} days ({leave_request.leave_type.name})",
                    reference_id=str(leave_request.id)
                )
                
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_request_detail(request, pk):
    try:
        company = get_client_company(request.user)
        leave_request = get_object_or_404(LeaveRequest, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(LeaveRequestSerializer(leave_request).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = LeaveRequestSerializer(leave_request, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            leave_request.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_request_process(request, pk):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        serializer = LeaveRequestApprovalSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            if action_type == 'approve':
                from apps.accounts.models import Employee
                approver_id = request.data.get('approver_id')
                approver = None
                if approver_id and not str(approver_id).startswith('admin-'):
                    try:
                        approver = Employee.objects.filter(id=approver_id).first()
                    except Exception:
                        pass
                
                if not approver:
                    approver = getattr(request.user, 'employee_profile', None)
                
                leave_request.approve(approver)
                
                log_activity(
                    user=request.user,
                    action_type='APPROVE',
                    module='LEAVE',
                    description=f"Leave request {leave_request.id} approved",
                    reference_id=str(leave_request.id)
                )
                
                return Response({'message': 'Leave approved successfully'})
            else:
                reason = serializer.validated_data.get('rejection_reason', '')
                leave_request.reject(reason)
                
                log_activity(
                    user=request.user,
                    action_type='REJECT',
                    module='LEAVE',
                    description=f"Leave request {leave_request.id} rejected",
                    reference_id=str(leave_request.id),
                    new_value={'reason': reason}
                )
                
                return Response({'message': 'Leave rejected'})
        return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_request_cancel(request, pk):
    try:
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        if leave_request.status == 'cancelled': return Response({'error': 'Leave is already cancelled'}, status=400)
        if leave_request.status == 'rejected': return Response({'error': 'Rejected leave cannot be cancelled'}, status=400)
        old_status = leave_request.status; leave_request.status = 'cancelled'; leave_request.save()
        try:
            balance = LeaveBalance.objects.get(employee=leave_request.employee, leave_type=leave_request.leave_type, year=leave_request.start_date.year)
            if old_status == 'pending': balance.pending -= leave_request.days_count
            elif old_status == 'approved': balance.used -= leave_request.days_count
            balance.save()
            
            log_activity(
                user=request.user,
                action_type='UPDATE',
                module='LEAVE',
                description=f"Leave request {leave_request.id} cancelled",
                reference_id=str(leave_request.id)
            )
            
            return Response({'message': 'Leave cancelled and balance restored'})
        except LeaveBalance.DoesNotExist: return Response({'message': 'Leave cancelled (no balance record found to restore)'})
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_request_stats(request):
    try:
        from django.db.models import Count
        from datetime import date, timedelta
        company = get_client_company(request.user)
        employee_id = request.query_params.get('employee')
        queryset = LeaveRequest.objects.filter(employee__company=company)
        if employee_id: queryset = queryset.filter(employee_id=employee_id)
        today = date.today()
        stats = {'pending': queryset.filter(status='pending').count(), 'approved': queryset.filter(status='approved').count(), 'rejected': queryset.filter(status='rejected').count(), 
                 'on_leave_today': queryset.filter(status='approved', start_date__lte=today, end_date__gte=today).count()}
        type_dist = queryset.values('leave_type__name').annotate(count=Count('id'))
        stats['type_distribution'] = {item['leave_type__name']: item['count'] for item in type_dist}
        recent_list = queryset.order_by('-created_at')[:5]
        stats['recent_requests'] = LeaveRequestSerializer(recent_list, many=True).data
        return Response(stats)
    except Exception as e: return Response({'error': str(e)}, status=500)
