from django.db import models
from django.http import HttpResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import date, timedelta, datetime
import calendar
from django.db import transaction
from calendar import monthrange
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

from apps.accounts.models import Employee
from apps.attendance.models import Attendance, AttendanceSummary
from apps.leave.models import LeaveRequest

from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, EmployeeSalaryComponent, PayrollPeriod, PaySlip, PaySlipComponent
)
from apps.audit.utils import log_activity
from .serializers import (
    SalaryComponentSerializer, SalaryStructureSerializer, SalaryStructureComponentSerializer,
    EmployeeSalarySerializer, EmployeeSalaryComponentSerializer,
    PayrollPeriodSerializer, PaySlipSerializer, PaySlipDetailSerializer, GeneratePayrollSerializer
)



def safe_api(fn):
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            logger.exception(e)
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    return wrapper


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def salary_component_list(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        if request.method == 'GET':
            queryset = SalaryComponent.objects.filter(company=company).select_related('company', 'percentage_of')
            
            # Filtering
            component_type = request.query_params.get('component_type')
            if component_type:
                queryset = queryset.filter(component_type=component_type)
            
            is_statutory = request.query_params.get('is_statutory')
            if is_statutory is not None:
                queryset = queryset.filter(is_statutory=is_statutory.lower() == 'true')
                
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')

            # Search
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(models.Q(name__icontains=search) | models.Q(code__icontains=search))

            serializer = SalaryComponentSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = SalaryComponentSerializer(data=request.data)
            if serializer.is_valid():
                # Handle percentage_of mapping if code is provided instead of ID
                percentage_of_data = request.data.get('percentage_of')
                percentage_of_obj = None
                if percentage_of_data and str(percentage_of_data) != 'BASIC' and not str(percentage_of_data).isdigit():
                    percentage_of_obj = SalaryComponent.objects.filter(company=company, code=percentage_of_data).first()
                
                serializer.save(company=company, percentage_of=percentage_of_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return logic()


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def salary_component_detail(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        instance = get_object_or_404(SalaryComponent, pk=pk, company=company)

        if request.method == 'GET':
            serializer = SalaryComponentSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = SalaryComponentSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return logic()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def salary_structure_list(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        if request.method == 'GET':
            queryset = SalaryStructure.objects.filter(company=company).prefetch_related('components__component')
            
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')

            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(models.Q(name__icontains=search) | models.Q(code__icontains=search))

            serializer = SalaryStructureSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = SalaryStructureSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    serializer.save(company=company)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    return Response({"name": ["A salary structure with this name already exists."]}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return logic()


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def salary_structure_detail(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        instance = get_object_or_404(SalaryStructure, pk=pk, company=company)

        if request.method == 'GET':
            serializer = SalaryStructureSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = SalaryStructureSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return logic()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_structure_add_component(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

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

    return logic()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_structure_update_components(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        structure = get_object_or_404(SalaryStructure, pk=pk, company=company)
        components_data = request.data.get('components', [])
        
        incoming_component_ids = []
        
        for data in components_data:
            component_id = data.get('component_id') or data.get('id')
            if not component_id: 
                continue
                
            calc_type = data.get('calculation_type')
            value = data.get('value', 0)
            
            percentage = 0
            fixed_amount = 0
            
            if calc_type == 'percentage':
                percentage = value
            else:
                fixed_amount = value
                
            if 'amount' in data: fixed_amount = data['amount']
            if 'percentage' in data: percentage = data['percentage']

            SalaryStructureComponent.objects.update_or_create(
                salary_structure=structure,
                component_id=component_id,
                defaults={
                    'amount': fixed_amount, 
                    'percentage': percentage
                }
            )
            incoming_component_ids.append(component_id)
            
        SalaryStructureComponent.objects.filter(salary_structure=structure).exclude(component_id__in=incoming_component_ids).delete()
        
        return Response({'status': 'success', 'message': 'Components updated successfully'})

    return logic()



def _process_salary_components(salary, components_data):
    """Helper to create/update components"""
    if components_data and len(components_data) > 0:
        salary.components.all().delete()
        
        total_earnings = Decimal(0)
        total_deductions = Decimal(0)
        
        for comp_data in components_data:
            component_id = comp_data.get('component_id') or comp_data.get('component')
            amount = Decimal(str(comp_data.get('amount', 0)))
            
            if component_id:
                try:
                    comp_obj = SalaryComponent.objects.get(id=component_id)
                except SalaryComponent.DoesNotExist:
                    logger.error(f"FAILED TO FIND COMPONENT ID: {component_id}")
                    continue
                
                EmployeeSalaryComponent.objects.create(
                    employee_salary=salary,
                    component_id=component_id,
                    amount=amount
                )
                
                if comp_obj.component_type == 'earning':
                    total_earnings += amount
                else:
                    total_deductions += amount
        
        salary.gross_salary = salary.basic_salary + total_earnings
        salary.net_salary = salary.gross_salary - total_deductions
        salary.save()
        
    elif salary.salary_structure:
        salary.components.all().delete()
        structure = salary.salary_structure
        
        total_earnings = Decimal(0)
        total_deductions = Decimal(0)
        
        for struct_comp in structure.components.all():
            amount = Decimal(0)
            if struct_comp.amount > 0:
                amount = struct_comp.amount
            elif struct_comp.percentage > 0:
                amount = (salary.basic_salary * struct_comp.percentage) / 100
            elif struct_comp.component.calculation_type == 'percentage' and struct_comp.component.default_percentage:
                 amount = (salary.basic_salary * struct_comp.component.default_percentage) / 100
            else:
                amount = struct_comp.component.default_amount
            
            EmployeeSalaryComponent.objects.create(
                employee_salary=salary,
                component=struct_comp.component,
                amount=amount
            )
            
            if struct_comp.component.component_type == 'earning':
                total_earnings += amount
            else:
                total_deductions += amount
        
        salary.gross_salary = salary.basic_salary + total_earnings
        salary.net_salary = salary.gross_salary - total_deductions
        salary.save()


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_salary_list(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        if request.method == 'GET':
            queryset = EmployeeSalary.objects.filter(employee__company=company).select_related(
                'employee', 'salary_structure'
            ).prefetch_related('components__component')
            
            employee_id = request.query_params.get('employee')
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
                
            is_current = request.query_params.get('is_current')
            if is_current is not None:
                queryset = queryset.filter(is_current=is_current.lower() == 'true')
            
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(models.Q(employee__employee_id__icontains=search) | models.Q(employee__first_name__icontains=search))

            serializer = EmployeeSalarySerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = EmployeeSalarySerializer(data=request.data)
            if serializer.is_valid():
                salary = serializer.save(gross_salary=0, net_salary=0, ctc=0)
                _process_salary_components(salary, request.data.get('components', []))
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return logic()


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_salary_detail(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        instance = get_object_or_404(EmployeeSalary, pk=pk, employee__company=company)

        if request.method == 'GET':
            serializer = EmployeeSalarySerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeSalarySerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                salary = serializer.save()
                if 'components' in request.data:
                    _process_salary_components(salary, request.data.get('components', []))
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return logic()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_salary(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        employee_id = request.query_params.get('employee')
        if not employee_id:
            return Response({'error': 'employee parameter required'}, status=400)
        
        salary = EmployeeSalary.objects.filter(employee_id=employee_id, employee__company=company, is_current=True).first()
        if not salary:
             return Response({'error': 'No current salary found'}, status=404)
        serializer = EmployeeSalarySerializer(salary)
        return Response(serializer.data)

    return logic()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_salary_stats(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        queryset = EmployeeSalary.objects.filter(employee__company=company, is_current=True, employee__status='active')
        
        stats = queryset.aggregate(
            total_net=Sum('net_salary'),
            total_gross=Sum('gross_salary'),
            total_basic=Sum('basic_salary'),
            avg_net=Avg('net_salary'),
            employee_count=Count('id')
        )
        
        return Response({
            'total_net_salary': stats['total_net'] or 0,
            'total_gross_salary': stats['total_gross'] or 0,
            'total_basic_salary': stats['total_basic'] or 0,
            'avg_net_salary': stats['avg_net'] or 0,
            'employee_count': stats['employee_count'] or 0
        })

    return logic()



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payroll_period_list(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        if request.method == 'GET':
            queryset = PayrollPeriod.objects.filter(company=company).annotate(
                total_lop_annotated=Coalesce(Sum('payslips__lop_deduction'), Decimal('0'))
            ).select_related('company', 'processed_by')
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
                
            month = request.query_params.get('month')
            if month:
                queryset = queryset.filter(month=month)
                
            year = request.query_params.get('year')
            if year:
                queryset = queryset.filter(year=year)

            queryset = queryset.order_by('-year', '-month')
            serializer = PayrollPeriodSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = PayrollPeriodSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return logic()


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payroll_period_detail(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        instance = get_object_or_404(PayrollPeriod, pk=pk, company=company)

        if request.method == 'GET':
            serializer = PayrollPeriodSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PayrollPeriodSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return logic()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payroll(request):
    """Generate payroll for all employees for a month"""
    @safe_api
    def logic():
        with transaction.atomic():
            serializer = GeneratePayrollSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=400)
            
            company_id = serializer.validated_data.get('company')
            
            if not company_id:
                user = request.user
                if hasattr(user, 'employee_profile') and user.employee_profile:
                    company_id = user.employee_profile.company_id
                elif hasattr(user, 'organization') and user.organization:
                    company_id = user.organization.id
                else:
                    from apps.accounts.models import UserRole
                    user_role = UserRole.objects.filter(user=user, is_active=True).first()
                    if user_role and user_role.organization:
                        company_id = user_role.organization.id

            if not company_id:
                return Response({'error': 'Company ID is required'}, status=400)

            month = serializer.validated_data['month']
            year = serializer.validated_data['year']
            force = serializer.validated_data.get('force', False)
            preview = serializer.validated_data.get('preview', False)
            
            if not force and not preview:
                existing = PayrollPeriod.objects.filter(
                    company_id=company_id,
                    month=month,
                    year=year
                ).exists()
                if existing:
                    return Response({
                        'error': 'Payroll already exists for this period. Use force=true to regenerate.'
                    }, status=400)
            
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(year, month + 1, 1) - timedelta(days=1)

            preview_data = []
            
            sid = transaction.savepoint()
            
            period, created = PayrollPeriod.objects.get_or_create(
                company_id=company_id,
                month=month,
                year=year,
                defaults={
                    'name': start_date.strftime('%B %Y'),
                    'start_date': start_date,
                    'end_date': end_date,
                    'status': 'processing' if not preview else 'draft'
                }
            )
            
            if not created and period.status != 'draft' and not preview:
                if force:
                    PaySlip.objects.filter(payroll_period=period).delete()
                    period.total_employees = 0
                    period.total_gross = 0
                    period.total_net = 0
                    period.total_deductions = 0
                    period.status = 'processing'
                    period.save()
                else:
                    return Response({'error': 'Payroll already processed for this period'}, status=400)
            
            if preview and not created:
                 PaySlip.objects.filter(payroll_period=period).delete()
            
            period.status = 'processing'
            period.save()
            
            employees = Employee.objects.filter(
                company_id=company_id,
                status='active'
            ).select_related('department', 'designation')
            
            payslips_created = 0
            total_gross = Decimal(0)
            total_deductions = Decimal(0)
            total_net = Decimal(0)
            total_lop = Decimal(0)
            
            for employee in employees:
                emp_salary = EmployeeSalary.objects.filter(employee=employee, is_current=True).first()
                if not emp_salary:
                     continue
                
                summary, _ = AttendanceSummary.objects.get_or_create(
                    employee=employee,
                    month=month,
                    year=year
                )
                summary.calculate_summary()
                
                working_days = Decimal(summary.total_working_days)
                effective_present = Decimal(summary.present_days) + (Decimal(summary.half_days) * Decimal(0.5))
                paid_days = effective_present + Decimal(summary.leave_days)
                lop_days = max(Decimal(0), working_days - paid_days)
                
                overtime_hours = Decimal(summary.overtime_hours)
                overtime_amount = Decimal(0)

                if overtime_hours > 0:
                    policy = employee.company.attendance_policies.filter(is_active=True).first()
                    multiplier = policy.overtime_rate_multiplier if policy else Decimal('1.5')
                    daily_hours = policy.full_day_hours if policy else Decimal('8.0')
                    
                    if working_days > 0 and daily_hours > 0:
                         per_day_salary = emp_salary.gross_salary / working_days
                         per_hour_salary = per_day_salary / daily_hours
                         overtime_amount = per_hour_salary * overtime_hours * multiplier

                payslip, _ = PaySlip.objects.update_or_create(
                    employee=employee,
                    payroll_period=period,
                    defaults={
                        'employee_salary': emp_salary,
                        'working_days': working_days,
                        'present_days': effective_present,
                        'leave_days': summary.leave_days,
                        'absent_days': summary.absent_days,
                        'lop_days': lop_days,
                        'overtime_hours': overtime_hours,
                        'overtime_amount': overtime_amount,
                    }
                )
                
                payslip.calculate_salary()
                payslip.save()
                
                payslips_created += 1
                total_gross += payslip.gross_earnings
                total_deductions += payslip.total_deductions
                total_net += payslip.net_salary
                total_lop += payslip.lop_deduction

                if preview:
                    preview_data.append({
                        'employee_id': employee.employee_id,
                        'name': employee.full_name,
                        'designation': employee.designation.name if employee.designation else '-',
                        'days_paid': float(working_days - lop_days),
                        'days_lop': float(lop_days),
                        'basic_salary': float(emp_salary.basic_salary), 
                        'gross_pay': float(payslip.gross_earnings),
                        'deductions': float(payslip.total_deductions),
                        'net_pay': float(payslip.net_salary),
                        'lop_deduction': float(payslip.lop_deduction)
                    })
            
            period.total_employees = payslips_created
            period.total_gross = total_gross
            period.total_deductions = total_deductions
            period.total_net = total_net
            period.status = 'completed'
            period.processed_at = timezone.now()
            period.save()
            
            if preview:
                transaction.savepoint_rollback(sid)
                return Response({
                    'preview': True,
                    'employees': preview_data,
                    'summary': {
                        'total_gross': str(total_gross),
                        'total_net': str(total_net),
                        'total_deductions': str(total_deductions),
                        'total_lop': str(total_lop),
                        'employee_count': payslips_created
                    }
                })

            log_activity(
                user=request.user,
                action_type='PROCESS',
                module='PAYROLL',
                description=f"Generated payroll for {payslips_created} employees for period {period.name}",
                reference_id=str(period.id),
                new_value={'total_net': str(total_net), 'total_employees': payslips_created},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({
                'message': f'Payroll generated for {payslips_created} employees',
                'period_id': period.id,
                'total_net': str(total_net),
                'total_gross': str(total_gross),
                'total_lop': str(total_lop),
                'total_employees': payslips_created
            })

    return logic()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_payroll_paid(request, pk):
    """Mark all payslips in period as paid"""
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        period = get_object_or_404(PayrollPeriod, pk=pk, company=company)
        payment_date = request.data.get('payment_date', date.today().isoformat())
        payment_mode = request.data.get('payment_mode', 'bank')
        
        PaySlip.objects.filter(payroll_period=period).update(
            status='paid',
            payment_date=payment_date,
            payment_mode=payment_mode
        )
        
        period.status = 'paid'
        period.save()
        
        log_activity(
            user=request.user,
            action_type='APPROVE',
            module='PAYROLL',
            description=f"Marked payroll period {period.name} as Paid",
            reference_id=str(period.id),
            new_value={'payment_date': payment_date, 'payment_mode': payment_mode},
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'message': 'Payroll marked as paid'})

    return logic()



def _send_payslip_email(payslip):
    """Helper to send payslip email"""
    try:
        from apps.accounts.utils import send_html_email
        context = {
            'employee_name': payslip.employee.full_name,
            'period': payslip.payroll_period.name,
            'net_salary': payslip.net_salary,
            'payslip_url': f"/payroll/payslips/{payslip.id}/download"
        }
        send_html_email(
            subject=f"Payslip for {payslip.payroll_period.name}",
            template_name='emails/payslip.html',
            context=context,
            recipient_list=[payslip.employee.user.email]
        )
        return True
    except Exception as e:
        logger.error(f"Error sending payslip email: {str(e)}")
        return False


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_list(request):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        queryset = PaySlip.objects.filter(employee__company=company).select_related(
            'employee', 'payroll_period', 'employee_salary'
        ).prefetch_related('components__component')
        
        period_id = request.query_params.get('payroll_period')
        if period_id:
            queryset = queryset.filter(payroll_period_id=period_id)
            
        employee_id = request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(employee__employee_id__icontains=search) | 
                models.Q(employee__first_name__icontains=search)
            )

        queryset = queryset.order_by('-payroll_period__year', '-payroll_period__month')
        serializer = PaySlipSerializer(queryset, many=True)
        return Response(serializer.data)

    return logic()


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payslip_detail(request, pk):
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        instance = get_object_or_404(PaySlip, pk=pk, employee__company=company)

        if request.method == 'GET':
            serializer = PaySlipDetailSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PaySlipSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return logic()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_payslips(request):
    """Get all payslips for an employee"""
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        employee_id = request.query_params.get('employee')
        if not employee_id:
            if hasattr(user, 'employee_profile') and user.employee_profile:
                employee_id = user.employee_profile.id
            else:
                return Response({'error': 'employee parameter required'}, status=400)
        
        payslips = PaySlip.objects.filter(employee_id=employee_id, employee__company=company)
        serializer = PaySlipSerializer(payslips, many=True)
        return Response(serializer.data)

    return logic()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payroll_dashboard_stats(request):
    """Get payroll dashboard statistics for a specific month/year"""
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        from django.db.models import Sum, Count, F, Value
        from django.db.models.functions import Concat
        
        payslips = PaySlip.objects.filter(
            employee__company=company,
            payroll_period__month=month,
            payroll_period__year=year
        )
        
        status_counts = {
            'paid': payslips.filter(status='paid').count(),
            'confirmed': payslips.filter(status='approved').count(),
            'review_ongoing': 0,
            'draft': payslips.filter(status='generated').count(),
        }
        
        totals = payslips.aggregate(
            payslips_generated=Count('id'),
            total_gross=Sum('gross_earnings') or 0,
            total_deductions=Sum('total_deductions') or 0,
            total_lop=Sum('lop_deduction') or 0,
            total_net=Sum('net_salary') or 0
        )
        
        employee_payslips = payslips.select_related('employee').annotate(
            name=Concat('employee__first_name', Value(' '), 'employee__last_name'),
            gross=F('gross_earnings')
        ).values('id', 'name', 'gross', 'status')
        
        department_breakdown = payslips.values(
            name=F('employee__department__name')
        ).annotate(
            employee_count=Count('id'),
            total_gross=Sum('gross_earnings'),
            total_deductions=Sum('total_deductions'),
            total_lop=Sum('lop_deduction'),
            total_net=Sum('net_salary')
        ).order_by('name')
        
        return Response({
            'status_counts': status_counts,
            'totals': totals,
            'employee_payslips': list(employee_payslips),
            'department_breakdown': list(department_breakdown)
        })

    return logic()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_payslip(request, pk):
    """Generate and download PDF payslip"""
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        payslip = get_object_or_404(PaySlip, pk=pk, employee__company=company)
        
        try:
            from .utils import generate_payslip_pdf
            pdf_buffer = generate_payslip_pdf(payslip)
            
            response = HttpResponse(
                pdf_buffer.getvalue(),
                content_type='application/pdf'
            )
            filename = f"Payslip_{payslip.employee.first_name}_{payslip.payroll_period.name.replace(' ', '_')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(pdf_buffer.getvalue())
            
            return response
        except Exception as e:
            logger.exception("Payslip download failed")
            return HttpResponse(
                f"Failed to generate payslip PDF: {str(e)}",
                status=500,
                content_type="text/plain"
            )

    return logic()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_payslip(request, pk):
    """Recalculate salary (useful after manual adjustments)"""
    @safe_api
    def logic():
        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        payslip = get_object_or_404(PaySlip, pk=pk, employee__company=company)
        payslip.calculate_salary()
        payslip.save()
        serializer = PaySlipSerializer(payslip)
        return Response(serializer.data)

    return logic()
    
