from django.db import models
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, F, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import date, timedelta, datetime
from django.db import transaction, IntegrityError
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

def get_client_company(user):
    """Helper to get company from user context"""
    if hasattr(user, 'employee_profile') and user.employee_profile:
        return user.employee_profile.company
    elif hasattr(user, 'organization') and user.organization:
        return user.organization
    return None

from apps.accounts.models import Employee
from apps.attendance.models import Attendance, AttendanceSummary
from apps.leave.models import LeaveRequest

from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, EmployeeSalaryComponent, PayrollPeriod, PaySlip, PaySlipComponent,
    TaxSlab, TaxDeclaration, PayrollSettings, Loan, EMI
)
from apps.audit.utils import log_activity
from .serializers import (
    SalaryComponentSerializer, SalaryStructureSerializer, SalaryStructureComponentSerializer,
    EmployeeSalarySerializer, EmployeeSalaryComponentSerializer,
    PayrollPeriodSerializer, PaySlipSerializer, PaySlipDetailSerializer, GeneratePayrollSerializer,
    TaxSlabSerializer, TaxDeclarationSerializer, PayrollSettingsSerializer,
    LoanSerializer, EMISerializer
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def salary_component_list_create(request):
    """Salary Component list and create view"""
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company context not found'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'GET':
            queryset = SalaryComponent.objects.filter(company=company).select_related('company', 'percentage_of')
            
            # Simple filtering
            comp_type = request.query_params.get('component_type')
            is_statutory = request.query_params.get('is_statutory')
            is_active = request.query_params.get('is_active')
            search = request.query_params.get('search')
            
            if comp_type: queryset = queryset.filter(component_type=comp_type)
            if is_statutory: queryset = queryset.filter(is_statutory=(is_statutory.lower() == 'true'))
            if is_active: queryset = queryset.filter(is_active=(is_active.lower() == 'true'))
            if search:
                from django.db.models import Q
                queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))
            
            serializer = SalaryComponentSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            percentage_of_data = data.get('percentage_of')
            percentage_of_obj = None
            
            if percentage_of_data and str(percentage_of_data) != 'BASIC' and not str(percentage_of_data).isdigit():
                percentage_of_obj = SalaryComponent.objects.filter(company=company, code=percentage_of_data).first()
            
            serializer = SalaryComponentSerializer(data=data)
            if serializer.is_valid():
                serializer.save(company=company, percentage_of=percentage_of_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in salary_component_list_create: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def salary_component_detail(request, pk):
    """Salary Component detail, update and delete view"""
    try:
        company = get_client_company(request.user)
        component = get_object_or_404(SalaryComponent, pk=pk, company=company)

        if request.method == 'GET':
            serializer = SalaryComponentSerializer(component)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = SalaryComponentSerializer(component, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            component.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Error in salary_component_detail: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def salary_structure_list_create(request):
    """Salary Structure list and create view"""
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company context not found'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'GET':
            queryset = SalaryStructure.objects.filter(company=company).prefetch_related('components__component')
            
            is_active = request.query_params.get('is_active')
            search = request.query_params.get('search')
            
            if is_active: queryset = queryset.filter(is_active=(is_active.lower() == 'true'))
            if search:
                from django.db.models import Q
                queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))
            
            serializer = SalaryStructureSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = SalaryStructureSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    serializer.save(company=company)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    return Response({"name": ["A salary structure with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in salary_structure_list_create: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def salary_structure_detail(request, pk):
    """Salary Structure detail, update and delete view"""
    try:
        company = get_client_company(request.user)
        structure = get_object_or_404(SalaryStructure, pk=pk, company=company)

        if request.method == 'GET':
            serializer = SalaryStructureSerializer(structure)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = SalaryStructureSerializer(structure, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            structure.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Error in salary_structure_detail: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_structure_add_component(request, pk):
    """Add a component to a salary structure"""
    try:
        company = get_client_company(request.user)
        structure = get_object_or_404(SalaryStructure, pk=pk, company=company)
        
        component_id = request.data.get('component')
        amount = request.data.get('amount')
        percentage = request.data.get('percentage')
        
        ssc, created = SalaryStructureComponent.objects.get_or_create(
            salary_structure=structure,
            component_id=component_id,
            defaults={'amount': amount, 'percentage': percentage}
        )
        
        if not created:
            ssc.amount = amount
            ssc.percentage = percentage
            ssc.save()
        
        serializer = SalaryStructureComponentSerializer(ssc)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_structure_update_components(request, pk):
    """Bulk update components for a salary structure"""
    try:
        company = get_client_company(request.user)
        structure = get_object_or_404(SalaryStructure, pk=pk, company=company)
        components_data = request.data.get('components', [])
        
        incoming_component_ids = []
        for data in components_data:
            component_id = data.get('component_id') or data.get('id')
            if not component_id: continue
                
            calc_type = data.get('calculation_type')
            value = data.get('value', 0)
            percentage = value if calc_type == 'percentage' else 0
            fixed_amount = value if calc_type != 'percentage' else 0
            
            if 'amount' in data: fixed_amount = data['amount']
            if 'percentage' in data: percentage = data['percentage']

            SalaryStructureComponent.objects.update_or_create(
                salary_structure=structure,
                component_id=component_id,
                defaults={'amount': fixed_amount, 'percentage': percentage}
            )
            incoming_component_ids.append(component_id)
            
        SalaryStructureComponent.objects.filter(salary_structure=structure).exclude(component_id__in=incoming_component_ids).delete()
        return Response({'status': 'success', 'message': 'Components updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def process_employee_salary_components(salary, components_data):
    """Utility to process components for employee salary"""
    if components_data and len(components_data) > 0:
        salary.components.all().delete()
        total_earnings = Decimal(0)
        total_deductions = Decimal(0)
        for comp_data in components_data:
            component_id = comp_data.get('component_id') or comp_data.get('component')
            amount = Decimal(str(comp_data.get('amount', 0)))
            if component_id:
                comp_obj = get_object_or_404(SalaryComponent, id=component_id)
                EmployeeSalaryComponent.objects.create(
                    employee_salary=salary, component=comp_obj, amount=amount
                )
                if comp_obj.component_type == 'earning': total_earnings += amount
                else: total_deductions += amount
        salary.gross_salary = salary.basic_salary + total_earnings
        salary.net_salary = salary.gross_salary - total_deductions
        salary.save()
    elif salary.salary_structure:
        salary.components.all().delete()
        total_earnings = Decimal(0)
        total_deductions = Decimal(0)
        for struct_comp in salary.salary_structure.components.all():
            amount = Decimal(0)
            if struct_comp.amount > 0: amount = struct_comp.amount
            elif struct_comp.percentage > 0: amount = (salary.basic_salary * struct_comp.percentage) / 100
            elif struct_comp.component.calculation_type == 'percentage' and struct_comp.component.default_percentage:
                 amount = (salary.basic_salary * struct_comp.component.default_percentage) / 100
            else: amount = struct_comp.component.default_amount
            EmployeeSalaryComponent.objects.create(
                employee_salary=salary, component=struct_comp.component, amount=amount
            )
            if struct_comp.component.component_type == 'earning': total_earnings += amount
            else: total_deductions += amount
        salary.gross_salary = salary.basic_salary + total_earnings
        salary.net_salary = salary.gross_salary - total_deductions
        salary.save()

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_salary_list_create(request):
    try:
        company = get_client_company(request.user)
        if not company: return Response({'error': 'Company not found'}, status=400)
        if request.method == 'GET':
            queryset = EmployeeSalary.objects.filter(employee__company=company).select_related('employee', 'salary_structure').prefetch_related('components__component')
            employee_id = request.query_params.get('employee')
            is_current = request.query_params.get('is_current')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if is_current: queryset = queryset.filter(is_current=(is_current.lower() == 'true'))
            serializer = EmployeeSalarySerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = EmployeeSalarySerializer(data=request.data)
            if serializer.is_valid():
                salary = serializer.save(gross_salary=0, net_salary=0, ctc=0)
                process_employee_salary_components(salary, request.data.get('components', []))
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_salary_detail(request, pk):
    try:
        company = get_client_company(request.user)
        salary = get_object_or_404(EmployeeSalary, pk=pk, employee__company=company)
        if request.method == 'GET':
            serializer = EmployeeSalarySerializer(salary)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = EmployeeSalarySerializer(salary, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                salary = serializer.save()
                if 'components' in request.data:
                    process_employee_salary_components(salary, request.data.get('components', []))
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            salary.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_salary_current(request):
    try:
        employee_id = request.query_params.get('employee')
        if not employee_id: return Response({'error': 'employee parameter required'}, status=400)
        salary = EmployeeSalary.objects.filter(employee_id=employee_id, is_current=True).first()
        if not salary: return Response({'error': 'No current salary found'}, status=404)
        return Response(EmployeeSalarySerializer(salary).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_salary_stats(request):
    try:
        company = get_client_company(request.user)
        queryset = EmployeeSalary.objects.filter(employee__company=company, is_current=True, employee__status='active')
        stats_data = queryset.aggregate(
            total_net=Sum('net_salary'), total_gross=Sum('gross_salary'),
            total_basic=Sum('basic_salary'), avg_net=Avg('net_salary'), employee_count=Count('id')
        )
        return Response({
            'total_net_salary': stats_data['total_net'] or 0, 'total_gross_salary': stats_data['total_gross'] or 0,
            'total_basic_salary': stats_data['total_basic'] or 0, 'avg_net_salary': stats_data['avg_net'] or 0,
            'employee_count': stats_data['employee_count'] or 0
        })
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payroll_period_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = PayrollPeriod.objects.filter(company=company).annotate(
                total_lop_annotated=Coalesce(Sum('payslips__lop_deduction'), Decimal('0'))
            ).select_related('processed_by')
            status_filter = request.query_params.get('status')
            month = request.query_params.get('month')
            year = request.query_params.get('year')
            if status_filter: queryset = queryset.filter(status=status_filter)
            if month: queryset = queryset.filter(month=month)
            if year: queryset = queryset.filter(year=year)
            serializer = PayrollPeriodSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = PayrollPeriodSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payroll_period_detail(request, pk):
    try:
        company = get_client_company(request.user)
        period = get_object_or_404(PayrollPeriod, pk=pk, company=company)
        if request.method == 'GET':
            return Response(PayrollPeriodSerializer(period).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = PayrollPeriodSerializer(period, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            period.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payroll_period_generate(request):
    """Generate payroll for all employees for a month"""
    try:
        company = get_client_company(request.user)
        data = request.data.copy()
        if not data.get('company'): data['company'] = company.id if company else None
        
        serializer = GeneratePayrollSerializer(data=data)
        if not serializer.is_valid(): return Response(serializer.errors, status=400)
        
        company_id = data['company']
        month, year = serializer.validated_data['month'], serializer.validated_data['year']
        force, preview = serializer.validated_data.get('force', False), serializer.validated_data.get('preview', False)
        
        if not force and not preview:
            if PayrollPeriod.objects.filter(company_id=company_id, month=month, year=year).exists():
                return Response({'error': 'Payroll already exists. Use force=true to regenerate.'}, status=400)

        start_date = date(year, month, 1)
        end_date = (date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)) - timedelta(days=1)
        preview_data = []

        with transaction.atomic():
            sid = transaction.savepoint()
            period, created = PayrollPeriod.objects.get_or_create(
                company_id=company_id, month=month, year=year,
                defaults={'name': start_date.strftime('%B %Y'), 'start_date': start_date, 'end_date': end_date, 'status': 'draft'}
            )
            if not created and period.status != 'draft' and not preview:
                if force: PaySlip.objects.filter(payroll_period=period).delete()
                else: return Response({'error': 'Payroll already processed'}, status=400)
            
            if preview and not created: PaySlip.objects.filter(payroll_period=period).delete()
            period.status = 'processing'; period.save()
            
            employees = Employee.objects.filter(company_id=company_id, status='active').select_related('department', 'designation')
            payslips_created, total_gross, total_deductions, total_net, total_lop = 0, Decimal(0), Decimal(0), Decimal(0), Decimal(0)
            
            for employee in employees:
                emp_salary = EmployeeSalary.objects.filter(employee=employee, is_current=True).first()
                if not emp_salary: continue
                summary, _ = AttendanceSummary.objects.get_or_create(employee=employee, month=month, year=year)
                summary.calculate_summary()
                
                working_days = Decimal(summary.total_working_days)
                effective_present = Decimal(summary.present_days) + (Decimal(summary.half_days) * Decimal(0.5))
                paid_days = effective_present + Decimal(summary.leave_days)
                lop_days = max(Decimal(0), working_days - paid_days)
                overtime_hours, overtime_amount = Decimal(summary.overtime_hours), Decimal(0)

                if overtime_hours > 0:
                    policy = employee.company.attendance_policies.filter(is_active=True).first()
                    multiplier, daily_hours = (policy.overtime_rate_multiplier if policy else Decimal('1.5')), (policy.full_day_hours if policy else Decimal('8.0'))
                    if working_days > 0 and daily_hours > 0:
                         overtime_amount = (emp_salary.gross_salary / working_days / daily_hours) * overtime_hours * multiplier

                payslip, _ = PaySlip.objects.update_or_create(
                    employee=employee, payroll_period=period,
                    defaults={'employee_salary': emp_salary, 'working_days': working_days, 'present_days': effective_present, 
                              'leave_days': summary.leave_days, 'absent_days': summary.absent_days, 'lop_days': lop_days, 
                              'overtime_hours': overtime_hours, 'overtime_amount': overtime_amount}
                )
                payslip.calculate_salary(); payslip.save()
                payslips_created += 1; total_gross += payslip.gross_earnings; total_deductions += payslip.total_deductions; total_net += payslip.net_salary; total_lop += payslip.lop_deduction

                if preview:
                    preview_data.append({'employee_id': employee.employee_id, 'name': employee.full_name, 'designation': employee.designation.name if employee.designation else '-', 
                                         'days_paid': float(working_days - lop_days), 'days_lop': float(lop_days), 'basic_salary': float(emp_salary.basic_salary), 
                                         'gross_pay': float(payslip.gross_earnings), 'deductions': float(payslip.total_deductions), 'net_pay': float(payslip.net_salary), 'lop_deduction': float(payslip.lop_deduction)})
            
            period.total_employees, period.total_gross, period.total_deductions, period.total_net, period.status, period.processed_at = payslips_created, total_gross, total_deductions, total_net, 'completed', timezone.now()
            period.save()
            
            if preview:
                transaction.savepoint_rollback(sid)
                return Response({'preview': True, 'employees': preview_data, 'summary': {'total_gross': str(total_gross), 'total_net': str(total_net), 'total_deductions': str(total_deductions), 'total_lop': str(total_lop), 'employee_count': payslips_created}})

            return Response({'message': f'Payroll generated for {payslips_created} employees', 'period_id': period.id, 'total_net': str(total_net), 'total_gross': str(total_gross), 'total_employees': payslips_created})
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payroll_period_mark_paid(request, pk):
    try:
        company = get_client_company(request.user)
        period = get_object_or_404(PayrollPeriod, pk=pk, company=company)
        payment_date = request.data.get('payment_date', date.today().isoformat())
        payment_mode = request.data.get('payment_mode', 'bank')
        
        from .models import EMI # Local import to avoid circular issues if any
        with transaction.atomic():
            PaySlip.objects.filter(payroll_period=period).update(status='paid', payment_date=payment_date, payment_mode=payment_mode)
            
            # Finalize linked EMIs
            payslips = PaySlip.objects.filter(payroll_period=period)
            emis = EMI.objects.filter(payslip__in=payslips, status='unpaid')
            for emi in emis:
                emi.status = 'paid'
                emi.save()
                
                loan = emi.loan
                loan.balance_amount -= emi.amount
                if loan.balance_amount <= 0:
                    loan.status = 'completed'
                    loan.balance_amount = 0
                loan.save()

            period.status = 'paid'
            period.save()
            
        return Response({'message': 'Payroll marked as paid'})
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payslip_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = PaySlip.objects.filter(employee__company=company).select_related('employee', 'payroll_period', 'employee_salary').prefetch_related('components__component')
            employee_id = request.query_params.get('employee')
            period_id = request.query_params.get('payroll_period')
            status_filter = request.query_params.get('status')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if period_id: queryset = queryset.filter(payroll_period_id=period_id)
            if status_filter: queryset = queryset.filter(status=status_filter)
            return Response(PaySlipSerializer(queryset, many=True).data)
        elif request.method == 'POST':
            serializer = PaySlipSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payslip_detail(request, pk):
    try:
        company = get_client_company(request.user)
        payslip = get_object_or_404(PaySlip, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(PaySlipDetailSerializer(payslip).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = PaySlipSerializer(payslip, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            payslip.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_my_payslips(request):
    try:
        employee_id = request.query_params.get('employee')
        if not employee_id: return Response({'error': 'employee parameter required'}, status=400)
        company = get_client_company(request.user)
        payslips = PaySlip.objects.filter(employee_id=employee_id, employee__company=company)
        return Response(PaySlipSerializer(payslips, many=True).data)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_dashboard_stats(request):
    try:
        company = get_client_company(request.user)
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        payslips = PaySlip.objects.filter(employee__company=company, payroll_period__month=month, payroll_period__year=year)
        status_counts = {'paid': payslips.filter(status='paid').count(), 'confirmed': payslips.filter(status='approved').count(), 'review_ongoing': 0, 'draft': payslips.filter(status='generated').count()}
        totals = payslips.aggregate(payslips_generated=Count('id'), total_gross=Sum('gross_earnings') or 0, total_deductions=Sum('total_deductions') or 0, total_lop=Sum('lop_deduction') or 0, total_net=Sum('net_salary') or 0)
        from django.db.models.functions import Concat
        employee_payslips = payslips.select_related('employee').annotate(name=Concat('employee__first_name', Value(' '), 'employee__last_name'), gross=F('gross_earnings')).values('id', 'name', 'gross', 'status')
        department_breakdown = payslips.values(name=F('employee__department__name')).annotate(employee_count=Count('id'), total_gross=Sum('gross_earnings'), total_deductions=Sum('total_deductions'), total_lop=Sum('lop_deduction'), total_net=Sum('net_salary')).order_by('name')
        return Response({'status_counts': status_counts, 'totals': totals, 'employee_payslips': list(employee_payslips), 'department_breakdown': list(department_breakdown)})
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_download(request, pk):
    try:
        company = get_client_company(request.user)
        payslip = get_object_or_404(PaySlip, pk=pk, employee__company=company)
        from .utils import generate_payslip_pdf
        pdf_buffer = generate_payslip_pdf(payslip)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f"Payslip_{payslip.employee.first_name}_{payslip.payroll_period.name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_buffer.getvalue()); return response
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payslip_recalculate(request, pk):
    """Recalculate salary (useful after manual adjustments)"""
    try:
        company = get_client_company(request.user)
        payslip = get_object_or_404(PaySlip, pk=pk, employee__company=company)
        payslip.calculate_salary()
        payslip.save()
        serializer = PaySlipSerializer(payslip) # Using PaySlipSerializer for recalculate response
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in payslip_recalculate: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tax_slab_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            regime = request.query_params.get('regime')
            slabs = TaxSlab.objects.filter(company=company)
            if regime: slabs = slabs.filter(regime=regime)
            return Response(TaxSlabSerializer(slabs.order_by('min_income'), many=True).data)
        elif request.method == 'POST':
            serializer = TaxSlabSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company); return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tax_slab_detail(request, pk):
    try:
        company = get_client_company(request.user)
        slab = get_object_or_404(TaxSlab, pk=pk, company=company)
        if request.method == 'GET': return Response(TaxSlabSerializer(slab).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = TaxSlabSerializer(slab, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            slab.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tax_declaration_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = TaxDeclaration.objects.filter(employee__company=company).select_related('employee', 'verified_by')
            employee_id = request.query_params.get('employee')
            status_filter = request.query_params.get('status')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if status_filter: queryset = queryset.filter(status=status_filter)
            return Response(TaxDeclarationSerializer(queryset.order_by('-created_at'), many=True).data)
        elif request.method == 'POST':
            serializer = TaxDeclarationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tax_declaration_detail(request, pk):
    try:
        company = get_client_company(request.user)
        declaration = get_object_or_404(TaxDeclaration, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(TaxDeclarationSerializer(declaration).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = TaxDeclarationSerializer(declaration, data=request.data, partial=(request.method == 'PATCH'), context={'request': request})
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            declaration.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tax_dashboard_stats(request):
    try:
        company = get_client_company(request.user)
        if not company:
            logger.warning(f"No company found for user {request.user}")
            return Response({'error': 'No company found'}, status=400)
            
        tds_component_ids = SalaryComponent.objects.filter(company=company, statutory_type='tds').values_list('id', flat=True)
        total_tds_monthly = EmployeeSalaryComponent.objects.filter(
            employee_salary__employee__company=company, 
            employee_salary__is_current=True, 
            component_id__in=tds_component_ids
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_count = TaxDeclaration.objects.filter(employee__company=company, status='pending').count()
        regime_counts = TaxDeclaration.objects.filter(employee__company=company).values('regime').annotate(count=Count('id'))
        
        new_regime_count = old_regime_count = 0
        for item in regime_counts:
            if item['regime'] == 'new': new_regime_count = item['count']
            elif item['regime'] == 'old': old_regime_count = item['count']
            
        return Response({
            'projected_tds': total_tds_monthly * 12, 
            'pending_declarations': pending_count, 
            'regime_split': {'new': new_regime_count, 'old': old_regime_count}
        })
    except Exception as e:
        logger.error(f"Error in tax_dashboard_stats: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def payroll_settings_detail(request):
    """Retrieve or update payroll settings for the company"""
    try:
        company = get_client_company(request.user)
        if not company:
            logger.warning(f"No company found for user {request.user}")
            return Response({'error': 'Company not found'}, status=400)
            
        settings, created = PayrollSettings.objects.get_or_create(company=company)
        
        if request.method == 'GET':
            serializer = PayrollSettingsSerializer(settings)
            return Response(serializer.data)
            
        elif request.method in ['PUT', 'PATCH']:
            serializer = PayrollSettingsSerializer(settings, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
            
    except Exception as e:
        logger.error(f"Error in payroll_settings_detail: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def loan_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = Loan.objects.filter(company=company).select_related('employee')
            status_filter = request.query_params.get('status')
            employee_id = request.query_params.get('employee')
            if status_filter: queryset = queryset.filter(status=status_filter)
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            return Response(LoanSerializer(queryset.order_by('-created_at'), many=True).data)
        elif request.method == 'POST':
            serializer = LoanSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def loan_detail(request, pk):
    try:
        company = get_client_company(request.user)
        loan = get_object_or_404(Loan, pk=pk, company=company)
        if request.method == 'GET':
            return Response(LoanSerializer(loan).data)
        elif request.method in ['PUT', 'PATCH']:
            old_status = loan.status
            serializer = LoanSerializer(loan, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                loan = serializer.save()
                if loan.status in ['approved', 'disbursed'] and old_status not in ['approved', 'disbursed']:
                    loan.generate_emis()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            loan.delete(); return Response(status=204)
    except Exception as e: return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def loan_generate_schedule(request, pk):
    """Force generate or regenerate EMI schedule"""
    try:
        company = get_client_company(request.user)
        loan = get_object_or_404(Loan, pk=pk, company=company)
        loan.generate_emis()
        return Response({'message': 'EMI schedule generated successfully', 'emis': EMISerializer(loan.emis.all(), many=True).data})
    except Exception as e: return Response({'error': str(e)}, status=500)