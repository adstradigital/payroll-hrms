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
        """Get attendance summary for today"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)
                 
            today = date.today()
            # Safety filter
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
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attendance Summary Error: {str(e)}'}, status=500)

    @action(detail=False, methods=['get'])
    def detailed(self, request):
        """Get detailed daily attendance records"""
        try:
            company_id = self._get_company_id(request)
            if not company_id:
                return Response({'error': 'company parameter required'}, status=400)
                
            today = date.today()
            attendances = Attendance.objects.filter(employee__company_id=company_id, date=today).select_related('employee', 'shift')
            
            data = []
            for att in attendances:
                # Handle model field differences (total_hours in model vs working_hours in legacy code)
                working_hours = getattr(att, 'total_hours', getattr(att, 'working_hours', 0))
                
                data.append({
                    'employee_name': att.employee.full_name if att.employee else 'N/A',
                    'employee_id': att.employee.employee_id if att.employee else 'N/A',
                    'status': att.status,
                    'check_in': str(att.check_in.time()) if att.check_in else 'N/A',
                    'check_out': str(att.check_out.time()) if att.check_out else 'N/A',
                    'working_hours': float(working_hours or 0),
                    'is_late': att.is_late
                })
                
            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Attendance Detailed Error: {str(e)}'}, status=500)

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
