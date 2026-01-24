from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from apps.leave.models import LeaveRequest, LeaveBalance, LeaveType
from apps.accounts.models import Employee
from datetime import date

class LeaveReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get leave summary for employees with used vs remaining"""
        company_id = request.query_params.get('company')
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
            
        year = request.query_params.get('year', date.today().year)
        
        employees = Employee.objects.filter(company_id=company_id, is_active=True)
        report_data = []
        
        for emp in employees:
            balances = LeaveBalance.objects.filter(employee=emp, year=year)
            leave_stats = []
            
            for bal in balances:
                leave_stats.append({
                    'type': bal.leave_type.name,
                    'allocated': float(bal.allocated),
                    'used': float(bal.used),
                    'pending': float(bal.pending),
                    'remaining': float(bal.available)
                })
            
            report_data.append({
                'employee_id': emp.employee_id,
                'name': emp.full_name,
                'department': emp.department.name if emp.department else 'N/A',
                'leaves': leave_stats
            })
            
        return Response(report_data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get leave history with filters"""
        company_id = request.query_params.get('company')
        employee_id = request.query_params.get('employee')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status')
        
        queryset = LeaveRequest.objects.select_related('employee', 'leave_type')
        
        if company_id:
            queryset = queryset.filter(employee__company_id=company_id)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        data = []
        for req in queryset.order_by('-created_at'):
            data.append({
                'id': req.id,
                'employee_name': req.employee.full_name,
                'employee_id': req.employee.employee_id,
                'leave_type': req.leave_type.name,
                'start_date': str(req.start_date),
                'end_date': str(req.end_date),
                'days': float(req.days_count),
                'status': req.status,
                'reason': req.reason
            })
            
        return Response(data)
