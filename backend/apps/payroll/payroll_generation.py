# Enhanced Payroll Generation & Reporting Views
# payroll_generation.py - Additional views for payroll automation

from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date
from calendar import monthrange
from decimal import Decimal
import logging

from apps.accounts.models import Employee
from apps.attendance.models import Attendance
from apps.leave.models import LeaveRequest
from .models import (
    PayrollPeriod, PaySlip, PaySlipComponent,
    EmployeeSalary, EmployeeSalaryComponent, SalaryComponent
)

logger = logging.getLogger(__name__)


from rest_framework.decorators import api_view, permission_classes
from .views import safe_api

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payroll_advanced(request):
    """
    Advanced payroll generation with automatic calculations
    POST /payroll/generate/
    """
    @safe_api
    def logic():
        company_id = request.data.get('company_id')
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not all([month, year]):
            return Response(
                {'error': 'month and year are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not company_id:
            user = request.user
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company_id = user.employee_profile.company_id
            elif hasattr(user, 'organization') and user.organization:
                company_id = user.organization.id
        
        if not company_id:
            return Response(
                 {'error': 'company_id is required or could not be determined from user context'},
                 status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = date(int(year), int(month), 1)
        end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
        
        employees = Employee.objects.filter(
            company_id=company_id,
            status='active'
        ).select_related('department', 'designation')
        
        if not employees.exists():
            return Response(
                {'error': 'No active employees found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        payroll_data = []
        total_gross = Decimal(0)
        total_deductions = Decimal(0)
        total_net = Decimal(0)
        errors = []
        
        for employee in employees:
            try:
                payroll_detail = _calculate_employee_payroll(
                    employee, start_date, end_date
                )
                payroll_data.append(payroll_detail)
                
                total_gross += payroll_detail['gross_salary']
                total_deductions += payroll_detail['total_deductions']
                total_net += payroll_detail['net_salary']
                
            except Exception as e:
                logger.error(f"Error calculating payroll for {employee}: {str(e)}")
                errors.append({
                    'employee_id': str(employee.id),
                    'employee_name': str(employee),
                    'error': str(e)
                })
        
        response_data = {
            'success': True,
            'month': month,
            'year': year,
            'employees_processed': len(payroll_data),
            'summary': {
                'total_gross': float(total_gross),
                'total_deductions': float(total_deductions),
                'total_net': float(total_net)
            },
            'payroll_data': payroll_data,
            'errors': errors
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    return logic()


def _calculate_employee_payroll(employee, start_date, end_date):
    """Calculate complete payroll for an employee"""
    try:
        try:
            employee_salary = EmployeeSalary.objects.get(
                employee=employee,
                is_current=True
            )
            basic_salary = employee_salary.basic_amount
        except EmployeeSalary.DoesNotExist:
            basic_salary = Decimal('50000')
        
        attendances = Attendance.objects.filter(
            employee=employee,
            date__range=[start_date, end_date]
        )
        
        working_days = end_date.day
        present_days = attendances.filter(status='present').count()
        half_days = attendances.filter(status='half_day').count() * Decimal('0.5')
        leave_days = attendances.filter(status='on_leave').count()
        absent_days = attendances.filter(status='absent').count()
        
        approved_leaves = LeaveRequest.objects.filter(
            employee=employee,
            status='approved',
            start_date__lte=end_date,
            end_date__gte=start_date
        ).aggregate(total_days=Sum('days_count'))['total_days'] or 0
        
        lop_days = max(0, absent_days - approved_leaves)
        overtime_hours = attendances.aggregate(total=Sum('overtime_hours'))['total'] or Decimal(0)
        overtime_amount = Decimal(0)

        if overtime_hours > 0:
            policy = employee.company.attendance_policies.filter(is_active=True).first()
            multiplier = policy.overtime_rate_multiplier if policy else Decimal('1.5')
            daily_hours = policy.full_day_hours if policy else Decimal('8.0')
            
            if working_days > 0 and daily_hours > 0:
                 gross_salary_val = employee_salary.gross_salary if 'employee_salary' in locals() else basic_salary
                 per_day_salary = gross_salary_val / Decimal(working_days)
                 per_hour_salary = per_day_salary / daily_hours
                 overtime_amount = per_hour_salary * overtime_hours * multiplier
        
        attendance_factor = (present_days + half_days + leave_days) / Decimal(working_days) if working_days > 0 else Decimal(1)
        prorated_basic = basic_salary * attendance_factor
        
        earnings = []
        deductions = []
        total_earnings = prorated_basic
        total_deductions = Decimal(0)
        
        try:
            salary_components = EmployeeSalaryComponent.objects.filter(
                employee_salary=employee_salary
            ).select_related('component')
            
            for comp in salary_components:
                comp_amount = comp.amount
                
                if comp.component.calculation_type == 'attendance_prorated':
                    comp_amount = comp.amount * attendance_factor
                elif comp.component.calculation_type == 'per_day':
                    comp_amount = comp.amount * (present_days + half_days)

                if comp.component.component_type == 'earning':
                    earnings.append({
                        'name': comp.component.name,
                        'code': comp.component.code,
                        'amount': float(comp_amount),
                        'calc_type': comp.component.calculation_type
                    })
                    total_earnings += comp_amount
                else:
                    deductions.append({
                        'name': comp.component.name,
                        'code': comp.component.code,
                        'amount': float(comp_amount),
                        'calc_type': comp.component.calculation_type
                    })
                    total_deductions += comp_amount
        except Exception:
            pass
        
        lop_deduction = Decimal(0)
        if lop_days > 0:
            per_day_salary = basic_salary / Decimal(working_days)
            lop_deduction = per_day_salary * Decimal(lop_days) 
            deductions.append({
                'name': 'Loss of Pay',
                'code': 'LOP',
                'amount': float(lop_deduction)
            })
            total_deductions += lop_deduction
        
        if overtime_amount > 0:
            earnings.append({
                'name': 'Overtime Pay',
                'code': 'OT',
                'amount': float(overtime_amount),
                'calc_type': 'attendance_based'
            })
            total_earnings += overtime_amount

        gross_salary = total_earnings
        net_salary = gross_salary - total_deductions
        
        return {
            'employee_id': str(employee.id),
            'employee_name': str(employee),
            'department': employee.department.name if employee.department else 'N/A',
            'designation': employee.designation.name if employee.designation else 'N/A',
            'attendance': {
                'working_days': working_days,
                'present_days': float(present_days + half_days),
                'leave_days': leave_days,
                'absent_days': absent_days,
                'lop_days': float(lop_days)
            },
            'earnings': earnings,
            'deductions': deductions,
            'basic_salary': float(prorated_basic),
            'gross_salary': float(gross_salary),
            'total_deductions': float(total_deductions),
            'net_salary': float(net_salary)
        }
        
    except Exception as e:
        logger.error(f"Error calculating payroll for employee: {str(e)}")
        raise


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payroll_reports(request):
    """
    Generate various payroll reports
    GET /payroll/reports/
    """
    @safe_api
    def logic():
        report_type = request.query_params.get('type', 'summary')
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id')
        
        if not all([month, year, company_id]):
            return Response(
                {'error': 'month, year, and company_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if report_type == 'summary':
            return _generate_summary_report(company_id, int(month), int(year))
        elif report_type == 'detailed':
            return _generate_detailed_report(company_id, int(month), int(year))
        else:
            return Response(
                {'error': f'Invalid report type: {report_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return logic()


def _generate_summary_report(company_id, month, year):
    """Generate payroll summary report"""
    try:
        employees = Employee.objects.filter(
            company_id=company_id,
            status='active'
        ).count()
        
        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        )
        
        summary = payslips.aggregate(
            total_gross=Sum('gross_salary'),
            total_deductions=Sum('total_deductions'),
            total_net=Sum('net_salary'),
            count=Count('id')
        )
        
        department_breakdown = payslips.values(
            'employee__department__name'
        ).annotate(
            employees=Count('id'),
            gross=Sum('gross_salary'),
            deductions=Sum('total_deductions'),
            net=Sum('net_salary')
        )
        
        status_breakdown = payslips.values('status').annotate(
            count=Count('id'),
            total=Sum('net_salary')
        )
        
        report = {
            'report_type': 'summary',
            'month': month,
            'year': year,
            'generated_at': timezone.now().isoformat(),
            'total_employees': employees,
            'payslips_generated': summary['count'] or 0,
            'totals': {
                'gross': float(summary['total_gross'] or 0),
                'deductions': float(summary['total_deductions'] or 0),
                'net': float(summary['total_net'] or 0)
            },
            'by_department': [
                {
                    'department': item['employee__department__name'] or 'Unassigned',
                    'employees': item['employees'],
                    'gross': float(item['gross'] or 0),
                    'deductions': float(item['deductions'] or 0),
                    'net': float(item['net'] or 0)
                }
                for item in department_breakdown
            ],
            'by_status': [
                {
                    'status': item['status'],
                    'count': item['count'],
                    'amount': float(item['total'] or 0)
                }
                for item in status_breakdown
            ]
        }
        
        return Response(report, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating summary report: {str(e)}")
        raise


def _generate_detailed_report(company_id, month, year):
    """Generate detailed payroll report"""
    try:
        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related(
            'employee', 'employee__department', 'employee__designation'
        ).prefetch_related('components__component')[:100]
        
        payslip_details = []
        for payslip in payslips:
            components = payslip.components.all()
            earnings = [
                {'name': c.component.name, 'amount': float(c.amount)}
                for c in components if c.component.component_type == 'earning'
            ]
            deductions = [
                {'name': c.component.name, 'amount': float(c.amount)}
                for c in components if c.component.component_type == 'deduction'
            ]
            
            payslip_details.append({
                'employee': str(payslip.employee),
                'employee_id': payslip.employee.employee_id,
                'department': payslip.employee.department.name if payslip.employee.department else 'N/A',
                'designation': payslip.employee.designation.name if payslip.employee.designation else 'N/A',
                'basic_salary': float(payslip.basic_amount),
                'earnings': earnings,
                'gross_salary': float(payslip.gross_salary),
                'deductions': deductions,
                'total_deductions': float(payslip.total_deductions),
                'net_salary': float(payslip.net_salary),
                'status': payslip.status
            })
        
        report = {
            'report_type': 'detailed',
            'month': month,
            'year': year,
            'generated_at': timezone.now().isoformat(),
            'payslips': payslip_details
        }
        
        return Response(report, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error generating detailed report: {str(e)}")
        raise
