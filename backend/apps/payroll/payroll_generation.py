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
from django.http import HttpResponse
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
import io

from apps.accounts.models import Employee
from apps.attendance.models import Attendance
from apps.leave.models import LeaveRequest
from .models import (
    PayrollPeriod, PaySlip, PaySlipComponent,
    EmployeeSalary, EmployeeSalaryComponent, SalaryComponent,
    EMI, AdhocPayment
)

logger = logging.getLogger(__name__)

from .services.excel_export import ExcelExportService
from .services.tds_calculator import TDSCalculator


from rest_framework.decorators import api_view, permission_classes
from apps.accounts.utils import get_employee_org_id


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payroll_advanced(request):
    """
    Advanced payroll generation with automatic calculations
    POST /payroll/generate/
    """
    try:
        company_id = request.data.get('company_id')
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not all([month, year]):
            return Response(
                {'error': 'month and year are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Infer company_id if not provided
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
        
        # Create payroll period dates
        start_date = date(int(year), int(month), 1)
        end_date = date(int(year), int(month), monthrange(int(year), int(month))[1])
        
        # Get all active employees
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
        total_lop = Decimal(0)
        total_statutory = Decimal(0)
        total_advance = Decimal(0)
        errors = []
        
        # Helper for calculation
        calc_engine = PayrollCalculationEngine()
        
        for employee in employees:
            try:
                # Calculate employee payroll
                payroll_detail = calc_engine._calculate_employee_payroll(
                    employee, start_date, end_date
                )
                payroll_data.append(payroll_detail)
                
                total_gross += Decimal(str(payroll_detail['gross_earnings']))
                total_deductions += Decimal(str(payroll_detail['total_deductions']))
                total_net += Decimal(str(payroll_detail['net_salary']))
                total_lop += Decimal(str(payroll_detail['lop_deduction']))
                total_statutory += Decimal(str(payroll_detail['statutory_deductions']))
                total_advance += Decimal(str(payroll_detail['advance_recovery']))
                
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
                'total_net': float(total_net),
                'total_lop': float(total_lop),
                'total_statutory': float(total_statutory),
                'total_advance_recovery': float(total_advance)
            },
            'payroll_data': payroll_data,
            'errors': errors
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in payroll generation: {str(e)}")
        return Response(
            {'error': 'Failed to generate payroll', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class PayrollCalculationEngine:
    def _calculate_employee_payroll(self, employee, start_date, end_date):
        """Calculate complete payroll for an employee"""
        try:
            # Get employee's current salary
            try:
                employee_salary = EmployeeSalary.objects.get(
                    employee=employee,
                    is_current=True
                )
                basic_salary = employee_salary.basic_salary
            except EmployeeSalary.DoesNotExist:
                basic_salary = Decimal('50000')  # Default
            
            # Get attendance
            attendances = Attendance.objects.filter(
                employee=employee,
                date__range=[start_date, end_date]
            )
            
            working_days = end_date.day
            present_days = attendances.filter(status='present').count()
            half_days = attendances.filter(status='half_day').count() * Decimal('0.5')
            leave_days = attendances.filter(status='on_leave').count()
            absent_days = attendances.filter(status='absent').count()
            
            # Get approved leaves
            approved_leaves = LeaveRequest.objects.filter(
                employee=employee,
                status='approved',
                start_date__lte=end_date,
                end_date__gte=start_date
            ).aggregate(total_days=Sum('days_count'))['total_days'] or 0
            
            # Calculate LOP
            lop_days = max(0, absent_days - approved_leaves)

            # Calculate Overtime
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
            statutory_deductions = Decimal(0)
            advance_recovery = Decimal(0)
            lop_deduction = Decimal(0)
            
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
                            'amount': float(comp_amount.quantize(Decimal('0.01'))),
                            'calc_type': comp.component.calculation_type
                        })
                        total_earnings += comp_amount
                    else:
                        amount_val = comp_amount.quantize(Decimal('0.01'))
                        deductions.append({
                            'name': comp.component.name,
                            'code': comp.component.code,
                            'amount': float(amount_val),
                            'calc_type': comp.component.calculation_type
                        })
                        total_deductions += comp_amount
                        if comp.component.is_statutory:
                            statutory_deductions += comp_amount
            except Exception:
                pass
            
            if lop_days > 0:
                per_day_salary = basic_salary / Decimal(working_days)
                lop_deduction = (per_day_salary * Decimal(lop_days)).quantize(Decimal('0.01'))
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
                    'amount': float(overtime_amount.quantize(Decimal('0.01'))),
                    'calc_type': 'attendance_based'
                })
                total_earnings += overtime_amount

            # Process Adhoc Payments (Bonuses/Incentives)
            adhoc_payments = AdhocPayment.objects.filter(
                employee=employee,
                status='pending',
                date__lte=end_date
            )
            
            for payment in adhoc_payments:
                # Determine if earning or deduction based on linked component or amount sign?
                # Usually AdhocPayment is an earning unless specified otherwise or amount is negative (if allowed)
                # But safer to rely on component type if present
                
                is_deduction = False
                if payment.component:
                    is_deduction = payment.component.component_type == 'deduction'
                
                # If no component, assume it's an earning (Bonus)
                
                if is_deduction:
                    deductions.append({
                        'name': payment.name,
                        'code': 'ADHOC_DED',
                        'amount': float(payment.amount),
                        'calc_type': 'fixed'
                    })
                    total_deductions += payment.amount
                else:
                    earnings.append({
                        'name': payment.name,
                        'code': 'ADHOC',
                        'amount': float(payment.amount),
                        'calc_type': 'fixed'
                    })
                    total_earnings += payment.amount

            # Process Loan/Advance EMIs (Preview)
            current_month_emis = EMI.objects.filter(
                loan__employee=employee,
                month=end_date.month,
                year=end_date.year,
                status='unpaid'
            )
            
            for emi in current_month_emis:
                is_advance = emi.loan.loan_type in ['advance', 'Salary Advance']
                comp_name = 'Salary Advance Recovery' if is_advance else 'Loan EMI'
                comp_code = 'SALARY_ADVANCE' if is_advance else 'LOAN_EMI'
                
                deductions.append({
                    'name': comp_name,
                    'code': comp_code,
                    'amount': float(emi.amount.quantize(Decimal('0.01'))),
                    'calc_type': 'fixed'
                })
                total_deductions += emi.amount
                if is_advance:
                    advance_recovery += emi.amount
                else:
                    # Loan EMI is often considered other deduction, but let's check
                    pass

            gross_earnings = total_earnings.quantize(Decimal('0.01'))
            total_deductions = total_deductions.quantize(Decimal('0.01'))
            net_salary = gross_earnings - total_deductions
            
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
                'basic_salary': float(prorated_basic.quantize(Decimal('0.01'))),
                'gross_earnings': float(gross_earnings),
                'total_deductions': float(total_deductions),
                'net_salary': float(net_salary.quantize(Decimal('0.01'))),
                'lop_deduction': float(lop_deduction),
                'statutory_deductions': float(statutory_deductions.quantize(Decimal('0.01'))),
                'advance_recovery': float(advance_recovery.quantize(Decimal('0.01')))
            }
            
        except Exception as e:
            logger.error(f"Error calculating payroll for employee: {str(e)}")
            raise
            
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
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            report_type = request.query_params.get('type', 'summary')
            month = request.query_params.get('month')
            year = request.query_params.get('year')
            company_id = request.query_params.get('company_id')
            
            # Default to current month/year if not provided
            now = timezone.now()
            if not month: month = now.month
            if not year: year = now.year

            # Infer company_id if not provided
            if not company_id:
                user = request.user
                if hasattr(user, 'employee_profile') and user.employee_profile:
                    company_id = user.employee_profile.company_id
                elif hasattr(user, 'organization') and user.organization:
                    company_id = user.organization.id
            
            if not company_id:
                return Response(
                    {'error': 'company_id is required or could not be determined'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if report_type == 'summary':
                return self._generate_summary_report(company_id, int(month), int(year))
            elif report_type == 'detailed':
                return self._generate_detailed_report(company_id, int(month), int(year))
            elif report_type == 'statutory':
                return self._generate_statutory_report(company_id, int(month), int(year))
            else:
                return Response(
                    {'error': f'Invalid report type: {report_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            return Response(
                {'error': 'Failed to generate report', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_summary_report(self, company_id, month, year):
        """Generate payroll summary report"""
        try:
            employees = Employee.objects.filter(
                company_id=company_id,
                status='active'
            ).count()
            
            # Get payslips for this period
            payslips = PaySlip.objects.filter(
                employee__company_id=company_id,
                payroll_period__month=month,
                payroll_period__year=year
            )
            
            summary = payslips.aggregate(
                total_gross=Sum('gross_earnings'),
                total_deductions=Sum('total_deductions'),
                total_net=Sum('net_salary'),
                count=Count('id')
            )
            
            # Group by department
            department_breakdown = payslips.values(
                'employee__department__name'
            ).annotate(
                employees=Count('id'),
                gross=Sum('gross_earnings'),
                deductions=Sum('total_deductions'),
                net=Sum('net_salary')
            )
            
            # Group by status
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
    
    def _generate_detailed_report(self, company_id, month, year):
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
                    'gross_salary': float(payslip.gross_earnings),
                    'earnings': earnings,
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

    def _generate_statutory_report(self, company_id, month, year):
        """Generate EPF & ESI statutory report"""
        try:
            from .models import PayrollSettings
            
            payslips = PaySlip.objects.filter(
                employee__company_id=company_id,
                payroll_period__month=month,
                payroll_period__year=year
            ).select_related(
                'employee', 'employee__department', 'employee_salary'
            ).prefetch_related('components__component')

            settings = PayrollSettings.objects.filter(company_id=company_id).first()
            
            report_data = []
            for payslip in payslips:
                components = payslip.components.all()
                
                # Employee Shares
                pf_emp = sum(c.amount for c in components if c.component.statutory_type == 'pf')
                esi_emp = sum(c.amount for c in components if c.component.statutory_type == 'esi')
                
                # PF Calculation (Employer Share)
                # We use basic_salary from linked employee_salary (as it's the base)
                # Prorated basic is needed. Since we don't store it, we estimate it or 
                # use the sum of earnings if it's simpler. 
                # Better: In calculation we did: pf_base = final_basic
                # final_basic = basic_salary * proration_ratio
                # proration_ratio = (present + leave) / working
                
                working_days = payslip.working_days
                paid_days = working_days - payslip.lop_days
                proration_ratio = paid_days / working_days if working_days > 0 else Decimal(1)
                
                basic_salary = payslip.employee_salary.basic_salary if payslip.employee_salary else Decimal(0)
                pf_base = (basic_salary * proration_ratio).quantize(Decimal('0.01'))
                
                if settings and settings.pf_is_restricted_basic:
                    pf_base = min(pf_base, settings.pf_wage_ceiling)
                
                pf_employer_total = (pf_base * settings.pf_contribution_rate_employer / 100).quantize(Decimal('0.01')) if settings and pf_emp > 0 else Decimal(0)
                
                # EPS Split (capped at 1250 if base > 15000, but we use rates)
                # Standard EPS is 8.33% of base
                pf_eps = (pf_base * settings.pf_contribution_rate_eps / 100).quantize(Decimal('0.01')) if settings and pf_emp > 0 else Decimal(0)
                pf_epf_employer = pf_employer_total - pf_eps
                
                # Admin & EDLI Charges
                pf_admin = (pf_base * settings.pf_admin_charges_rate / 100).quantize(Decimal('0.01')) if settings and pf_emp > 0 else Decimal(0)
                pf_edli = (pf_base * settings.pf_edli_rate / 100).quantize(Decimal('0.01')) if settings and pf_emp > 0 else Decimal(0)

                esi_base = payslip.gross_earnings
                esi_employer = (esi_base * settings.esi_contribution_rate_employer / 100).quantize(Decimal('0.01')) if settings and esi_emp > 0 else Decimal(0)
                
                report_data.append({
                    'employee_name': str(payslip.employee),
                    'employee_id': payslip.employee.employee_id,
                    'gross_salary': float(payslip.gross_earnings),
                    'pf_base': float(pf_base),
                    'pf_employee': float(pf_emp),
                    'pf_employer_epf': float(pf_epf_employer),
                    'pf_employer_eps': float(pf_eps),
                    'pf_admin_charges': float(pf_admin),
                    'pf_edli_charges': float(pf_edli),
                    'pf_employer_total': float(pf_employer_total + pf_admin + pf_edli),
                    'esi_base': float(esi_base),
                    'esi_employee': float(esi_emp),
                    'esi_employer': float(esi_employer),
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating statutory report: {str(e)}")
            raise


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_epf_ecr(request):
    """
    Export EPF ECR in .txt format (Delimited by #)
    GET /payroll/reports/epf-ecr/?month=3&year=2026
    """
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)

        # Get payroll records
        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee', 'employee_salary').prefetch_related('components__component')

        if not payslips.exists():
            return Response({'error': 'No payroll data found for this period'}, status=404)

        from .models import PayrollSettings
        settings = PayrollSettings.objects.filter(company_id=company_id).first()

        ecr_lines = []
        for ps in payslips:
            # Basic values
            uan = getattr(ps.employee, 'pf_number', 'NOT_AVAIL')
            name = ps.employee.full_name.upper()
            gross = ps.gross_earnings
            
            # Components
            pf_emp = sum(c.amount for c in ps.components.all() if c.component.statutory_type == 'pf')
            
            # Base calculation
            working_days = ps.working_days
            paid_days = working_days - ps.lop_days
            proration = paid_days / working_days if working_days > 0 else Decimal(1)
            basic = ps.employee_salary.basic_salary if ps.employee_salary else Decimal(0)
            pf_base = (basic * proration).quantize(Decimal('0.01'))
            
            if settings and settings.pf_is_restricted_basic:
                pf_base = min(pf_base, settings.pf_wage_ceiling)
            
            # Shares
            pf_employer_total = (pf_base * settings.pf_contribution_rate_employer / 100).quantize(Decimal('0.01')) if settings else Decimal(0)
            eps_share = (pf_base * settings.pf_contribution_rate_eps / 100).quantize(Decimal('0.01')) if settings else Decimal(0)
            epf_employer = pf_employer_total - eps_share
            
            ncp_days = int(ps.lop_days)
            
            # Format: UAN#Name#Gross#EPF_Base#EPS_Base#EDLI_Base#EE#ER_EPF#ER_EPS#NCP#Ref
            line = f"{uan}#{name}#{gross}#{pf_base}#{pf_base}#{pf_base}#{pf_emp}#{epf_employer}#{eps_share}#{ncp_days}#0"
            ecr_lines.append(line)

        content = "\n".join(ecr_lines)
        response = HttpResponse(content, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="EPF_ECR_{month}_{year}.txt"'
        return response

    except Exception as e:
        logger.error(f"ECR Export Error: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_esi_challan(request):
    """
    Export ESI Monthly Contribution in Excel format
    GET /payroll/reports/esi-challan/?month=3&year=2026
    """
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id if company_id else request.user.organization.id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee').prefetch_related('components__component')

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "ESI Contribution"

        # Headers
        headers = ["IP Number", "IP Name", "No of Days for which wages paid", "Total Monthly Wages", "Reason Code for Zero workings days", "Last Working Day"]
        ws.append(headers)
        
        # Styles
        for cell in ws[1]:
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal='center')

        for ps in payslips:
            esi_emp = sum(c.amount for c in ps.components.all() if c.component.statutory_type == 'esi')
            if esi_emp > 0:
                paid_days = ps.working_days - ps.lop_days
                ws.append([
                    getattr(ps.employee, 'esi_number', 'N/A'),
                    ps.employee.full_name.upper(),
                    int(paid_days),
                    float(ps.gross_earnings),
                    "0" if paid_days > 0 else "1",
                    ""
                ])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(buffer.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="ESI_Challan_{month}_{year}.xlsx"'
        return response

    except Exception as e:
        logger.error(f"ESI Export Error: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_salary_register(request):
    """Export detailed salary register as Excel"""
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)
        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee', 'employee__department', 'employee__designation').prefetch_related('components__component')

        if not payslips.exists():
            return Response({'error': 'No payroll data found for this period'}, status=404)

        output = ExcelExportService.generate_salary_register(None, None, payslips)
        
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="Salary_Register_{month}_{year}.xlsx"'
        return response
    except Exception as e:
        logger.error(f"Salary Register Export Error: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_payroll_summary(request):
    """Export payroll summary as Excel"""
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)

        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee__department')

        # Aggregate by department
        dept_data = payslips.values('employee__department__name').annotate(
            count=Count('id'),
            gross=Sum('gross_earnings'),
            net=Sum('net_salary')
        )

        from .models import PayrollSettings
        settings = PayrollSettings.objects.filter(company_id=company_id).first()

        summary_list = []
        for d in dept_data:
            dept_name = d['employee__department__name'] or "Unassigned"
            # Estimate PF/ESI for summary
            summary_list.append({
                'department': dept_name,
                'count': d['count'],
                'gross': d['gross'],
                'net': d['net'],
                'epf_employer': 0, # Simplified for now
                'esi_employer': 0
            })

        output = ExcelExportService.generate_payroll_summary(None, None, summary_list)
        
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="Payroll_Summary_{month}_{year}.xlsx"'
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_salary_register_data(request):
    """Get salary register data as JSON for preview"""
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)

        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee', 'employee__department', 'employee__designation')

        data = []
        for p in payslips:
            comp_map = {c.component.statutory_type: float(c.amount) for c in p.components.all() if c.component.statutory_type}
            basic_comp = p.components.filter(component__name__icontains='Basic').first()
            
            data.append({
                'employee': p.employee.get_full_name(),
                'employee_id': p.employee.employee_id,
                'department': p.employee.department.name if p.employee.department else 'N/A',
                'designation': p.employee.designation.name if p.employee.designation else 'N/A',
                'basic': float(basic_comp.amount) if basic_comp else 0.0,
                'gross': float(p.gross_earnings),
                'pf': comp_map.get('pf', 0.0),
                'esi': comp_map.get('esi', 0.0),
                'tds': comp_map.get('tds', 0.0),
                'net': float(p.net_salary)
            })

        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payroll_summary_data(request):
    """Get payroll summary data as JSON for preview and charts"""
    try:
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        company_id = request.query_params.get('company_id') or get_employee_org_id(request.user)

        if not month or not year:
            return Response({'error': 'month and year are required'}, status=400)

        if not company_id:
            return Response({'error': 'company_id is required or could not be determined'}, status=400)

        payslips = PaySlip.objects.filter(
            employee__company_id=company_id,
            payroll_period__month=month,
            payroll_period__year=year
        ).select_related('employee__department')

        # Aggregate by department
        dept_data = payslips.values('employee__department__name').annotate(
            count=Count('id'),
            gross=Sum('gross_earnings'),
            net=Sum('net_salary')
        )

        summary = []
        for d in dept_data:
            summary.append({
                'department': d['employee__department__name'] or "Unassigned",
                'count': d['count'],
                'gross': float(d['gross'] or 0),
                'net': float(d['net'] or 0)
            })

        return Response(summary)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
