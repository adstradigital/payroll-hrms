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
import calendar
from decimal import Decimal
from django.utils import timezone

class LeaveReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get leave summary for employees with used vs remaining"""
        try:
            # Fallback to request.GET if query_params is missing (safeguard)
            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            company_id = params.get('company')
            
            if not company_id:
                employee = getattr(request.user, 'employee_profile', None)
                if employee:
                    company_id = employee.company_id
                    
            if not company_id:
                return Response({'error': 'company parameter required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Basic validation for UUID to prevent DB crash
            try:
                import uuid as uuid_lib
                uuid_lib.UUID(str(company_id))
            except (ValueError, TypeError, AttributeError):
                return Response({'error': f'Invalid company ID format: {company_id}'}, status=status.HTTP_400_BAD_REQUEST)

            # Safe year conversion
            try:
                year_param = params.get('year')
                year = int(year_param) if year_param else date.today().year
            except (ValueError, TypeError):
                year = date.today().year
            
            employees = Employee.objects.filter(company_id=company_id, status='active')
            report_data = []
            
            for emp in employees:
                balances = LeaveBalance.objects.filter(employee=emp, year=year).select_related('leave_type')
                leave_stats = []
                
                for bal in balances:
                    # Use decimals consistently or convert safely to float
                    allocated = bal.allocated or Decimal('0')
                    carry_forward = bal.carry_forward or Decimal('0')
                    used = bal.used or Decimal('0')
                    pending = bal.pending or Decimal('0')
                    
                    try:
                        available = float(bal.available)
                    except (TypeError, ValueError, AttributeError):
                        # Calculate as fallback
                        available = float(allocated + carry_forward - used - pending)

                    leave_stats.append({
                        'type': bal.leave_type.name if bal.leave_type else 'Unknown',
                        'total': float(allocated + carry_forward),
                        'used': float(used),
                        'pending': float(pending),
                        'available': available
                    })
                
                report_data.append({
                    'employee_id': emp.employee_id,
                    'employee_name': emp.full_name,
                    'department': emp.department.name if emp.department else 'N/A',
                    'leaves': leave_stats
                })
                
            return Response(report_data)
        except Exception as e:
            # Re-raise for debugging if needed, but for now return clean 500
            import traceback
            error_trace = traceback.format_exc()
            print(f"REPORT_ERROR: {error_trace}")
            return Response({'error': f'Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get leave history with filters"""
        try:
            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            company_id = params.get('company')
            
            if not company_id:
                employee = getattr(request.user, 'employee_profile', None)
                if employee:
                    company_id = employee.company_id
            
            # Validation for UUID
            if company_id:
                try:
                    import uuid as uuid_lib
                    uuid_lib.UUID(str(company_id))
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid company ID format'}, status=status.HTTP_400_BAD_REQUEST)
            
            employee_id = params.get('employee')
            start_date = params.get('start_date')
            end_date = params.get('end_date')
            status_filter = params.get('status')
            
            queryset = LeaveRequest.objects.select_related('employee', 'leave_type')
            
            if company_id:
                queryset = queryset.filter(employee__company_id=company_id)
            if employee_id:
                # Ensure it's a valid filter
                try:
                    str_emp_id = str(employee_id).strip()
                    if str_emp_id:
                        queryset = queryset.filter(employee_id=str_emp_id)
                except AttributeError:
                    pass
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
                    'employee_name': req.employee.full_name if req.employee else 'N/A',
                    'employee_id': req.employee.employee_id if req.employee else 'N/A',
                    'leave_type': req.leave_type.name if req.leave_type else 'N/A',
                    'start_date': str(req.start_date),
                    'end_date': str(req.end_date),
                    'days': float(req.days_count or 0),
                    'status': req.status,
                    'reason': req.reason
                })
                
            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'History Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AttendanceReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_company_id(self, request):
        params = getattr(request, 'query_params', getattr(request, 'GET', {}))
        company_id = params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = str(employee.company_id)
        return company_id

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get attendance summary for today or a selected month/year"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            month = params.get('month')
            year = params.get('year')

            if month and year:
                try:
                    start_date = date(int(year), int(month), 1)
                    end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
                    attendances = Attendance.objects.filter(
                        employee__company_id=company_id,
                        date__range=[start_date, end_date]
                    )
                    period_label = f"{year}-{str(month).zfill(2)}"
                except (ValueError, TypeError):
                     return Response({'error': 'Invalid month or year format'}, status=400)
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
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attendance Summary Error: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed attendance records (by date or month/year)"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            month = params.get('month')
            year = params.get('year')
            specific_date = params.get('date')

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
                try:
                    start_date = date(int(year), int(month), 1)
                    end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
                    attendances = Attendance.objects.filter(
                        employee__company_id=company_id,
                        date__range=[start_date, end_date]
                    ).select_related('employee', 'shift')
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid month or year format'}, status=400)
            else:
                today = date.today()
                attendances = Attendance.objects.filter(employee__company_id=company_id, date=today).select_related('employee', 'shift')
            
            data = []
            for att in attendances:
                # Handle model field differences (total_hours vs working_hours)
                working_hours = getattr(att, 'total_hours', 0)
                
                data.append({
                    'employee_name': att.employee.full_name if att.employee else 'N/A',
                    'employee_id': att.employee.employee_id if att.employee else 'N/A',
                    'date': str(att.date),
                    'status': att.status,
                    'check_in': str(att.check_in_time.time()) if hasattr(att, 'check_in_time') and att.check_in_time else 'N/A',
                    'check_out': str(att.check_out_time.time()) if hasattr(att, 'check_out_time') and att.check_out_time else 'N/A',
                    'working_hours': float(working_hours or 0),
                    'is_late': att.is_late
                })
                
            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attendance Detailed Error: {str(e)}'}, status=500)

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

    def _get_company_id(self, request):
        params = getattr(request, 'query_params', getattr(request, 'GET', {}))
        company_id = params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = str(employee.company_id)
        return company_id

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payroll summary for a specific month/year"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            year = params.get('year', date.today().year)
            month = params.get('month', date.today().month)

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
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Payroll Summary Error: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed payroll register for a month"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            year = params.get('year', date.today().year)
            month = params.get('month', date.today().month)

            payslips = PaySlip.objects.filter(
                employee__company_id=company_id,
                payroll_period__year=year,
                payroll_period__month=month
            ).select_related('employee', 'employee__department', 'employee__designation')

            data = []
            for p in payslips:
                components = p.components.all().select_related('component')
                
                # Extract granular statutory fields with null safety
                pf_amount = float(sum((c.amount or 0) for c in components if c.component.statutory_type == 'pf'))
                esi_amount = float(sum((c.amount or 0) for c in components if c.component.statutory_type == 'esi'))
                tds_amount = float(sum((c.amount or 0) for c in components if c.component.statutory_type == 'tds'))
                
                data.append({
                    'employee': p.employee.full_name if p.employee else 'N/A',
                    'employee_id': p.employee.employee_id if p.employee else 'N/A',
                    'department': p.employee.department.name if p.employee and p.employee.department else 'N/A',
                    'designation': p.employee.designation.name if p.employee and p.employee.designation else 'N/A',
                    'gross_salary': float(p.gross_earnings or 0),
                    'pf_deduction': pf_amount,
                    'esi_deduction': esi_amount,
                    'tds_deduction': tds_amount,
                    'total_deductions': float(p.total_deductions or 0),
                    'net_salary': float(p.net_salary or 0),
                    'status': p.status,
                    'earnings': [{'name': c.component.name, 'amount': float(c.amount or 0)} for c in components if c.component.component_type == 'earning'],
                    'deductions': [{'name': c.component.name, 'amount': float(c.amount or 0)} for c in components if c.component.component_type == 'deduction']
                })

            return Response({'payslips': data})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Payroll Detailed Error: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def statutory(self, request):
        """Get statutory (PF/ESI) compliance report"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            year = params.get('year', date.today().year)
            month = params.get('month', date.today().month)

            payslips = PaySlip.objects.filter(
                employee__company_id=company_id,
                payroll_period__year=year,
                payroll_period__month=month
            ).select_related('employee')
            
            data = []
            from decimal import Decimal
            for p in payslips:
                components = p.components.all().select_related('component')
                
                pf_emp = sum((c.amount or 0) for c in components if c.component.statutory_type == 'pf')
                esi_emp = sum((c.amount or 0) for c in components if c.component.statutory_type == 'esi')
                
                # Placeholder logic for employer shared
                pf_emplr = (pf_emp if pf_emp > 0 else 0)
                esi_emplr = ((p.gross_earnings or 0) * Decimal('0.0325')).quantize(Decimal('0.01')) if esi_emp > 0 else 0

                data.append({
                    'employee_name': p.employee.full_name if p.employee else 'N/A',
                    'employee_id': p.employee.employee_id if p.employee else 'N/A',
                    'uan': getattr(p.employee, 'uan_number', 'N/A') or 'N/A',
                    'esi_no': getattr(p.employee, 'esi_number', 'N/A') or 'N/A',
                    'gross_salary': float(p.gross_earnings or 0),
                    'pf_employee': float(pf_emp),
                    'pf_employer': float(pf_emplr),
                    'esi_employee': float(esi_emp),
                    'esi_employer': float(esi_emplr),
                })

            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Statutory Report Error: {str(e)}'}, status=500)
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


class AttritionReportViewSet(viewsets.ViewSet):
    """Attrition / Employee Turnover Report"""
    permission_classes = [IsAuthenticated]

    def _get_company_id(self, request):
        params = getattr(request, 'query_params', getattr(request, 'GET', {}))
        company_id = params.get('company')
        if not company_id:
            employee = getattr(request.user, 'employee_profile', None)
            if employee:
                company_id = str(employee.company_id)
        return company_id

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Monthly attrition summary for a given year.
        Returns per-month: opening headcount, new hires, exits, closing headcount, attrition rate.
        """
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            try:
                year = int(params.get('year', date.today().year))
            except (ValueError, TypeError):
                year = date.today().year

            all_employees = Employee.objects.filter(company_id=company_id)

            monthly_data = []
            for month in range(1, 13):
                month_start = date(year, month, 1)
                month_end = date(year, month, monthrange(year, month)[1])

                # Opening headcount: employees who joined before this month and haven't exited before this month
                opening = all_employees.filter(
                    date_of_joining__lt=month_start
                ).exclude(
                    Q(last_working_date__lt=month_start) | Q(termination_date__lt=month_start)
                ).count()

                # New hires during this month
                new_hires = all_employees.filter(
                    date_of_joining__range=[month_start, month_end]
                ).count()

                # Exits during this month (resigned or terminated)
                exits = all_employees.filter(
                    Q(last_working_date__range=[month_start, month_end]) |
                    Q(termination_date__range=[month_start, month_end]),
                    status__in=['resigned', 'terminated']
                ).count()

                closing = opening + new_hires - exits
                avg_headcount = (opening + closing) / 2 if (opening + closing) > 0 else 1
                attrition_rate = round((exits / avg_headcount) * 100, 2) if avg_headcount > 0 else 0

                monthly_data.append({
                    'month': calendar.month_abbr[month],
                    'month_num': month,
                    'opening': opening,
                    'new_hires': new_hires,
                    'exits': exits,
                    'closing': closing,
                    'attrition_rate': attrition_rate
                })

            # Annual totals
            total_exits = sum(m['exits'] for m in monthly_data)
            total_hires = sum(m['new_hires'] for m in monthly_data)
            avg_headcount_year = (monthly_data[0]['opening'] + monthly_data[-1]['closing']) / 2 if monthly_data else 1
            annual_attrition = round((total_exits / avg_headcount_year) * 100, 2) if avg_headcount_year > 0 else 0

            # Department breakdown
            dept_exits = all_employees.filter(
                Q(last_working_date__year=year) | Q(termination_date__year=year),
                status__in=['resigned', 'terminated']
            ).values('department__name').annotate(
                exit_count=Count('id')
            ).order_by('-exit_count')

            department_breakdown = [{
                'department': row['department__name'] or 'Unassigned',
                'exits': row['exit_count']
            } for row in dept_exits]

            # Exit reason breakdown
            resigned_count = all_employees.filter(
                Q(last_working_date__year=year) | Q(resignation_date__year=year),
                status='resigned'
            ).count()
            terminated_count = all_employees.filter(
                Q(last_working_date__year=year) | Q(termination_date__year=year),
                status='terminated'
            ).count()

            return Response({
                'year': year,
                'monthly': monthly_data,
                'annual_attrition_rate': annual_attrition,
                'total_exits': total_exits,
                'total_hires': total_hires,
                'current_headcount': all_employees.filter(status='active').count(),
                'department_breakdown': department_breakdown,
                'exit_reasons': {
                    'resigned': resigned_count,
                    'terminated': terminated_count,
                },
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attrition Summary Error: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def details(self, request):
        """
        Detailed list of employees who exited within a date range or year.
        """
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)

            params = getattr(request, 'query_params', getattr(request, 'GET', {}))
            try:
                year = int(params.get('year', date.today().year))
            except (ValueError, TypeError):
                year = date.today().year

            month = params.get('month')
            department = params.get('department')

            exited = Employee.objects.filter(
                company_id=company_id,
                status__in=['resigned', 'terminated']
            ).select_related('department', 'designation')

            # Filter by exit date year
            exited = exited.filter(
                Q(last_working_date__year=year) |
                Q(termination_date__year=year) |
                Q(resignation_date__year=year)
            )

            if month:
                try:
                    m = int(month)
                    exited = exited.filter(
                        Q(last_working_date__month=m) |
                        Q(termination_date__month=m) |
                        Q(resignation_date__month=m)
                    )
                except (ValueError, TypeError):
                    pass

            if department:
                exited = exited.filter(department__name__icontains=department)

            data = []
            for emp in exited.order_by('-last_working_date', '-termination_date'):
                exit_date = emp.last_working_date or emp.termination_date or emp.resignation_date
                tenure_days = (exit_date - emp.date_of_joining).days if exit_date and emp.date_of_joining else 0
                tenure_years = round(tenure_days / 365, 1) if tenure_days > 0 else 0

                data.append({
                    'employee_id': emp.employee_id,
                    'employee_name': emp.full_name,
                    'department': emp.department.name if emp.department else 'N/A',
                    'designation': emp.designation.name if emp.designation else 'N/A',
                    'date_of_joining': str(emp.date_of_joining) if emp.date_of_joining else 'N/A',
                    'exit_date': str(exit_date) if exit_date else 'N/A',
                    'exit_type': emp.status,
                    'tenure_years': tenure_years,
                    'reason': emp.termination_reason or 'Not specified',
                })

            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attrition Details Error: {str(e)}'}, status=500)
