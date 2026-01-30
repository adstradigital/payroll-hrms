from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date
from apps.accounts.permissions import is_client_admin
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer, 
    LeaveRequestSerializer, LeaveRequestApprovalSerializer
)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.select_related('company').all()
    serializer_class = LeaveTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'is_paid', 'is_carry_forward', 'is_active']
    search_fields = ['name', 'code']

    def create(self, request, *args, **kwargs):
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
        return super().destroy(request, *args, **kwargs)


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['employee', 'leave_type', 'year']
    search_fields = ['employee__employee_id', 'employee__first_name']
    
    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get leave balance for current user's employee"""
        employee_id = request.query_params.get('employee')
        year = request.query_params.get('year', date.today().year)
        
        if not employee_id:
            return Response({'error': 'employee parameter required'}, status=400)
        
        balances = self.queryset.filter(employee_id=employee_id, year=year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def allocate(self, request):
        """Allocate leaves to employees for a year"""
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
            
        employee_ids = request.data.get('employees', [])
        year = request.data.get('year', date.today().year)
        company_id = request.data.get('company')
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
        
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        created = 0
        
        for emp_id in employee_ids:
            for lt in leave_types:
                _, was_created = LeaveBalance.objects.get_or_create(
                    employee_id=emp_id,
                    leave_type=lt,
                    year=year,
                    defaults={'allocated': lt.days_per_year}
                )
                if was_created:
                    created += 1
        
        return Response({'message': f'Created {created} leave balance records'})

    @action(detail=False, methods=['post'])
    def run_accrual(self, request):
        """Run periodic leave accrual for all active employees"""
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
            
        from django.db.models import F
        from datetime import date
        
        company_id = request.data.get('company')
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
            
        today = date.today()
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        accrued_count = 0
        
        for lt in leave_types:
            if lt.accrual_type == 'monthly':
                # Accrue 1/12th of annual leaves
                accrual_amount = lt.days_per_year / 12
                
                # Update all balances for this leave type and year
                balances = LeaveBalance.objects.filter(
                    leave_type=lt,
                    year=today.year
                )
                
                # For employees without balance, we should create one? 
                # Usually allocate handles initial creation.
                
                updated = balances.update(allocated=F('allocated') + accrual_amount)
                accrued_count += updated
            
            elif lt.accrual_type == 'quarterly' and today.month in [1, 4, 7, 10]:
                accrual_amount = lt.days_per_year / 4
                updated = LeaveBalance.objects.filter(
                    leave_type=lt,
                    year=today.year
                ).update(allocated=F('allocated') + accrual_amount)
                accrued_count += updated
                
        return Response({'message': f'Accrued leaves for {accrued_count} records'})


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related(
        'employee', 'leave_type', 'approved_by'
    ).all()
    serializer_class = LeaveRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'leave_type', 'status', 'start_date']
    search_fields = ['employee__employee_id', 'employee__first_name', 'reason']
    ordering_fields = ['start_date', 'created_at']
    
    def create(self, request, *args, **kwargs):
        """Create leave request and update pending balance"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        leave_request = serializer.save()
        
        # Update pending balance
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=leave_request.employee,
            leave_type=leave_request.leave_type,
            year=leave_request.start_date.year,
            defaults={'allocated': leave_request.leave_type.days_per_year}
        )
        balance.pending += leave_request.days_count
        balance.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Approve or reject a leave request"""
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)
            
        leave_request = self.get_object()
        serializer = LeaveRequestApprovalSerializer(data=request.data)
        
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            
            # Get approver employee (for now, just use the first employee - you'd get this from auth)
            approver_id = request.data.get('approver_id')
            
            if action_type == 'approve':
                from apps.accounts.models import Employee
                approver = Employee.objects.get(id=approver_id) if approver_id else None
                leave_request.approve(approver)
                return Response({'message': 'Leave approved successfully'})
            else:
                rejection_reason = serializer.validated_data.get('rejection_reason', '')
                leave_request.reject(rejection_reason)
                return Response({'message': 'Leave rejected'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a leave request and restore balance"""
        leave_request = self.get_object()
        
        if leave_request.status == 'cancelled':
            return Response({'error': 'Leave is already cancelled'}, status=400)
            
        if leave_request.status == 'rejected':
            return Response({'error': 'Rejected leave cannot be cancelled'}, status=400)
            
        old_status = leave_request.status
        leave_request.status = 'cancelled'
        leave_request.save()
        
        # Restore balance
        try:
            balance = LeaveBalance.objects.get(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=leave_request.start_date.year
            )
            
            if old_status == 'pending':
                balance.pending -= leave_request.days_count
            elif old_status == 'approved':
                balance.used -= leave_request.days_count
                
            balance.save()
            return Response({'message': 'Leave cancelled and balance restored'})
        except LeaveBalance.DoesNotExist:
            return Response({'message': 'Leave cancelled (no balance record found to restore)'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get leave statistics for dashboard"""
        from django.db.models import Count
        from datetime import date, timedelta
        
        company_id = request.query_params.get('company')
        employee_id = request.query_params.get('employee')
        
        queryset = self.queryset
        if company_id:
            queryset = queryset.filter(employee__company_id=company_id)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        today = date.today()
        
        # Basic counts
        stats = {
            'pending': queryset.filter(status='pending').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
            'on_leave_today': queryset.filter(
                status='approved',
                start_date__lte=today,
                end_date__gte=today
            ).count(),
        }
        
        # Leave type distribution
        type_dist = queryset.values('leave_type__name').annotate(count=Count('id'))
        stats['type_distribution'] = {item['leave_type__name']: item['count'] for item in type_dist}
        
        # Monthly trends (Past 6 months)
        six_months_ago = today - timedelta(days=180)
        recent_requests = queryset.filter(created_at__date__gte=six_months_ago)
        
        # Simple recent requests (last 5)
        recent_list = queryset.order_by('-created_at')[:5]
        stats['recent_requests'] = LeaveRequestSerializer(recent_list, many=True).data
        
        return Response(stats)
