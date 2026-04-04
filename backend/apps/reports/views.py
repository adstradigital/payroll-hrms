from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from apps.leave.models import LeaveRequest, LeaveBalance, LeaveType
from apps.accounts.models import Employee
from apps.attendance.models import Attendance
from apps.payroll.models import PaySlip, AdhocPayment
from datetime import date
from calendar import monthrange
from decimal import Decimal
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
        """Get attendance summary for today or a selected month/year"""
        company_id = request.query_params.get('company')
        if not company_id:
            # Try to get from user profile
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        month = request.query_params.get('month')
        year = request.query_params.get('year')

        if month and year:
            start_date = date(int(year), int(month), 1)
            end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
            attendances = Attendance.objects.filter(
                employee__company_id=company_id,
                date__range=[start_date, end_date]
            )
            period_label = f"{year}-{str(month).zfill(2)}"
        else:
            today = date.today()
            attendances = Attendance.objects.filter(employee__company_id=company_id, date=today)
            period_label = str(today)

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
            'period': period_label
        })

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed attendance records (by date or month/year)"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id
        
        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        month = request.query_params.get('month')
        year = request.query_params.get('year')
        specific_date = request.query_params.get('date')

        if specific_date:
            try:
                target_date = date.fromisoformat(specific_date)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
            attendances = Attendance.objects.filter(
                employee__company_id=company_id,
                date=target_date
            ).select_related('employee', 'shift')
        elif month and year:
            start_date = date(int(year), int(month), 1)
            end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
            attendances = Attendance.objects.filter(
                employee__company_id=company_id,
                date__range=[start_date, end_date]
            ).select_related('employee', 'shift')
        else:
            today = date.today()
            attendances = Attendance.objects.filter(employee__company_id=company_id, date=today).select_related('employee', 'shift')
        
        data = []
        for att in attendances:
            data.append({
                'employee_name': att.employee.full_name,
                'employee_id': att.employee.employee_id,
                'date': str(att.date),
                'status': att.status,
                'check_in': str(att.check_in_time.time()) if att.check_in_time else 'N/A',
                'check_out': str(att.check_out_time.time()) if att.check_out_time else 'N/A',
                'working_hours': float(att.total_hours) if att.total_hours else 0,
                'is_late': att.is_late
            })
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def overtime(self, request):
        """Get overtime analysis for a specific month/year"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id

        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)

        start_date = date(int(year), int(month), 1)
        end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])

        overtime_data = Attendance.objects.filter(
            employee__company_id=company_id,
            date__range=[start_date, end_date],
            overtime_hours__gt=0
        ).values(
            'employee_id',
            'employee__employee_id',
            'employee__first_name',
            'employee__last_name',
            'employee__department__name'
        ).annotate(
            total_overtime_hours=Sum('overtime_hours'),
            overtime_days=Count('id')
        ).order_by('-total_overtime_hours')

        data = [
            {
                'employee_name': f"{row['employee__first_name']} {row['employee__last_name']}".strip(),
                'employee_id': row['employee__employee_id'],
                'department': row['employee__department__name'] or 'N/A',
                'overtime_hours': float(row['total_overtime_hours'] or 0),
                'overtime_days': row['overtime_days']
            }
            for row in overtime_data
        ]

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
            total_gross=Sum('gross_earnings'),
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
        """Get detailed payroll register for a month with granular statutory fields"""
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
            components = p.components.all().select_related('component')
            
            # Extract granular statutory fields
            pf_amount = float(sum(c.amount for c in components if c.component.statutory_type == 'pf'))
            esi_amount = float(sum(c.amount for c in components if c.component.statutory_type == 'esi'))
            tds_amount = float(sum(c.amount for c in components if c.component.statutory_type == 'tds'))
            
            data.append({
                'employee': p.employee.full_name,
                'employee_id': p.employee.employee_id,
                'department': p.employee.department.name if p.employee.department else 'N/A',
                'designation': p.employee.designation.name if p.employee.designation else 'N/A',
                'gross_salary': float(p.gross_earnings),
                'pf_deduction': pf_amount,
                'esi_deduction': esi_amount,
                'tds_deduction': tds_amount,
                'total_deductions': float(p.total_deductions),
                'net_salary': float(p.net_salary),
                'status': p.status,
                'earnings': [{'name': c.component.name, 'amount': float(c.amount)} for c in components if c.component.component_type == 'earning'],
                'deductions': [{'name': c.component.name, 'amount': float(c.amount)} for c in components if c.component.component_type == 'deduction']
            })

        return Response({'payslips': data})

    @action(detail=False, methods=['get'])
    def statutory(self, request):
        """Get statutory (PF/ESI) compliance report"""
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
        ).select_related('employee')

        # Statutory reports need employer share too, which isn't currently stored in PaySlipComponent.
        # For now, we report employee shares and placeholders for employer shares.
        
        data = []
        for p in payslips:
            components = p.components.all().select_related('component')
            
            pf_emp = sum(c.amount for c in components if c.component.statutory_type == 'pf')
            esi_emp = sum(c.amount for c in components if c.component.statutory_type == 'esi')
            
            # Simple placeholder logic for employer share if not explicit (Standard India rates)
            pf_emplr = (pf_emp if pf_emp > 0 else 0) # usually matched or capped
            esi_emplr = (p.gross_earnings * Decimal('0.0325')).quantize(Decimal('0.01')) if esi_emp > 0 else 0

            data.append({
                'employee_name': p.employee.full_name,
                'employee_id': p.employee.employee_id,
                'uan': p.employee.uan_number or 'N/A',
                'esi_no': p.employee.esi_number or 'N/A',
                'gross_salary': float(p.gross_earnings),
                'pf_employee': float(pf_emp),
                'pf_employer': float(pf_emplr),
                'esi_employee': float(esi_emp),
                'esi_employer': float(esi_emplr),
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def tds_summary(self, request):
        """Get TDS summary for a specific month/year"""
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
        ).select_related('employee', 'employee__department').prefetch_related('components__component')

        data = []
        for p in payslips:
            tds_amount = sum(c.amount for c in p.components.all() if c.component.statutory_type == 'tds')
            data.append({
                'employee_name': p.employee.full_name,
                'employee_id': p.employee.employee_id,
                'department': p.employee.department.name if p.employee.department else 'N/A',
                'gross_salary': float(p.gross_earnings),
                'tds_deduction': float(tds_amount),
                'net_salary': float(p.net_salary)
            })

        return Response(data)

    @action(detail=False, methods=['get'])
    def bonus_report(self, request):
        """Get bonus & incentives report for a specific month/year"""
        company_id = request.query_params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = employee.company_id

        if not company_id:
            return Response({'error': 'company parameter required'}, status=400)

        year = request.query_params.get('year', date.today().year)
        month = request.query_params.get('month', date.today().month)
        start_date = date(int(year), int(month), 1)
        end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])

        payments = AdhocPayment.objects.filter(
            employee__company_id=company_id,
            date__range=[start_date, end_date]
        ).select_related('employee', 'employee__department', 'component')

        data = []
        for p in payments:
            data.append({
                'employee_name': p.employee.full_name,
                'employee_id': p.employee.employee_id,
                'department': p.employee.department.name if p.employee.department else 'N/A',
                'payment_name': p.name,
                'component': p.component.name if p.component else 'N/A',
                'amount': float(p.amount),
                'status': p.status,
                'date': str(p.date)
            })

        return Response(data)
