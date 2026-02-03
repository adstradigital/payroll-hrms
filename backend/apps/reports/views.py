from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from apps.leave.models import LeaveRequest, LeaveBalance, LeaveType
from apps.accounts.models import Employee
from apps.attendance.models import Attendance
from apps.payroll.models import PaySlip
from datetime import date
from django.utils import timezone

class LeaveReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get leave summary for employees with used vs remaining"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
                
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
            
        year = request.query_params.get('year', date.today().year)
        
        employees = Employee.objects.filter(company_id=company_id, status='active')
        report_data = []
        
        for emp in employees:
            balances = LeaveBalance.objects.filter(employee=emp, year=year)
            leave_stats = []
            
            for bal in balances:
                leave_stats.append({
                    'type': bal.leave_type.name,
                    'total': float(bal.allocated + bal.carry_forward),
                    'used': float(bal.used),
                    'pending': float(bal.pending),
                    'available': float(bal.available)
                })
            
            report_data.append({
                'employee_id': emp.employee_id,
                'employee_name': emp.full_name,
                'department': emp.department.name if emp.department else 'N/A',
                'leaves': leave_stats
            })
            
        return Response(report_data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get leave history with filters"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
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

class AttendanceReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get attendance summary for today"""
        company_id = request.query_params.get('company')
        if not company_id:
            # Try to get from user profile
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
             
        today = date.today()
        attendances = Attendance.objects.filter(employee__company_id=company_id, date=today)
        total_employees = Employee.objects.filter(company_id=company_id, status='active').count()
        
        present = attendances.filter(status='present').count()
        absent = attendances.filter(status='absent').count()
        late = attendances.filter(is_late=True).count()
        on_leave = attendances.filter(status='on_leave').count()

        return Response({
            'total_employees': total_employees,
            'present': present,
            'absent': absent,
            'late': late,
            'on_leave': on_leave,
            'date': str(today)
        })

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed daily attendance records"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)
            
        today = date.today()
        attendances = Attendance.objects.filter(employee__company_id=company_id, date=today).select_related('employee', 'shift')
        
        data = []
        for att in attendances:
            data.append({
                'employee_name': att.employee.full_name,
                'employee_id': att.employee.employee_id,
                'status': att.status,
                'check_in': str(att.check_in.time()) if att.check_in else 'N/A',
                'check_out': str(att.check_out.time()) if att.check_out else 'N/A',
                'working_hours': float(att.working_hours) if att.working_hours else 0,
                'is_late': att.is_late
            })
            
        return Response(data)

class PayrollReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payroll summary for a specific month/year"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        year = request.query_params.get('year', date.today().year)
        month = request.query_params.get('month', date.today().month)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__year=year,
            payroll_period__month=month
        )

        totals = payslips.aggregate(
            total_gross=Sum('gross_salary'),
            total_net=Sum('net_salary'),
            total_deductions=Sum('total_deductions'),
            count=Count('id')
        )

        return Response({
            'year': year,
            'month': month,
            'total_gross': float(totals['total_gross'] or 0),
            'total_net': float(totals['total_net'] or 0),
            'total_deductions': float(totals['total_deductions'] or 0),
            'payslips_count': totals['count'] or 0
        })

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed payroll register for a month"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        year = request.query_params.get('year', date.today().year)
        month = request.query_params.get('month', date.today().month)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__year=year,
            payroll_period__month=month
        ).select_related('employee', 'employee__department', 'employee__designation')

        data = []
        for p in payslips:
            data.append({
                'employee': p.employee.full_name,
                'employee_id': p.employee.employee_id,
                'department': p.employee.department.name if p.employee.department else 'N/A',
                'designation': p.employee.designation.name if p.employee.designation else 'N/A',
                'basic_salary': float(p.basic_salary),
                'gross_salary': float(p.gross_earnings),
                'total_deductions': float(p.total_deductions),
                'net_salary': float(p.net_salary),
                'status': p.status,
                'earnings': [{'name': c.component.name, 'amount': float(c.amount)} for c in p.components.filter(component__component_type='earning')],
                'deductions': [{'name': c.component.name, 'amount': float(c.amount)} for c in p.components.filter(component__component_type='deduction')]
            })

        return Response({'payslips': data})
