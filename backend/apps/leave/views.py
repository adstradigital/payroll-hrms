from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date
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
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending leave requests"""
        company = request.query_params.get('company')
        pending = self.queryset.filter(status='pending')
        if company:
            pending = pending.filter(employee__company_id=company)
        
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
