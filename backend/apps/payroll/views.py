from django.db import models
from django.http import HttpResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F, Value
from django.utils import timezone
from datetime import date
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
from .serializers import (
    SalaryComponentSerializer, SalaryStructureSerializer, SalaryStructureComponentSerializer,
    EmployeeSalarySerializer, EmployeeSalaryComponentSerializer,
    PayrollPeriodSerializer, PaySlipSerializer, PaySlipDetailSerializer, GeneratePayrollSerializer
)


class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.select_related('company', 'percentage_of').all()
    serializer_class = SalaryComponentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'component_type', 'is_statutory', 'is_active']
    search_fields = ['name', 'code']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return queryset.filter(company=user.organization)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
            
        # Handle percentage_of mapping if code is provided instead of ID
        percentage_of_data = self.request.data.get('percentage_of')
        percentage_of_obj = None
        if percentage_of_data and str(percentage_of_data) != 'BASIC' and not str(percentage_of_data).isdigit():
            try:
                percentage_of_obj = SalaryComponent.objects.filter(company=company, code=percentage_of_data).first()
            except:
                pass
        
        serializer.save(company=company, percentage_of=percentage_of_obj)



class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.select_related('company').prefetch_related('components__component').all()
    serializer_class = SalaryStructureSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'is_active']
    search_fields = ['name', 'code']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return queryset.filter(company=user.organization)
        return queryset.none()
    
    def perform_create(self, serializer):
        from django.db import IntegrityError
        from rest_framework.exceptions import ValidationError

        user = self.request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
            
        try:
            serializer.save(company=company)
        except IntegrityError:
            raise ValidationError({"name": ["A salary structure with this name already exists."]})

    @action(detail=True, methods=['post'])
    def add_component(self, request, pk=None):
        """Add a component to a salary structure"""
        structure = self.get_object()
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

    @action(detail=True, methods=['post'])
    def update_components(self, request, pk=None):
        """Bulk update components for a salary structure"""
        structure = self.get_object()
        components_data = request.data.get('components', [])
        
        # Keep track of kept component IDs to delete others later if needed
        # Or simple approach: Delete all and recreate? 
        # Delete all is safer to ensure sync, but IDs change. 
        # Better: Update existing, Create new, Delete missing.
        
        incoming_component_ids = []
        
        for data in components_data:
            component_id = data.get('component_id') or data.get('id')
            # Handle cases where just ID is passed or object
            if not component_id: 
                continue
                
            amount = data.get('amount', 0)
            # Check for 'value' from frontend logic which maps to amount or percentage depending on type
            # But the backend model distinguishes amount vs percentage.
            # We need to rely on the frontend sending correct keys or infer it.
            # Let's assume frontend sends 'amount' and 'percentage' explicit keys, 
            # OR 'value' and 'calculation_type'.
            
            calc_type = data.get('calculation_type')
            value = data.get('value', 0)
            
            percentage = 0
            fixed_amount = 0
            
            if calc_type == 'percentage':
                percentage = value
            else:
                fixed_amount = value
                
            # If explicit keys provided, override
            if 'amount' in data: fixed_amount = data['amount']
            if 'percentage' in data: percentage = data['percentage']

            ssc, created = SalaryStructureComponent.objects.update_or_create(
                salary_structure=structure,
                component_id=component_id,
                defaults={
                    'amount': fixed_amount, 
                    'percentage': percentage
                }
            )
            incoming_component_ids.append(component_id)
            
        # Delete components not in incoming list
        SalaryStructureComponent.objects.filter(salary_structure=structure).exclude(component_id__in=incoming_component_ids).delete()
        
        return Response({'status': 'success', 'message': 'Components updated successfully'})


class EmployeeSalaryViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSalary.objects.select_related(
        'employee', 'salary_structure'
    ).prefetch_related('components__component').all()
    serializer_class = EmployeeSalarySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['employee', 'is_current']
    search_fields = ['employee__employee_id', 'employee__first_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return queryset.filter(employee__company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return queryset.filter(employee__company=user.organization)
        return queryset.none()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        salary = serializer.save(gross_salary=0, net_salary=0, ctc=0)
        self._process_components(salary, self.request.data.get('components', []))

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        salary = serializer.save()
        if 'components' in self.request.data:
            self._process_components(salary, self.request.data.get('components', []))

    def _process_components(self, salary, components_data):
        """Helper to create/update components"""
        # If components provided explicitly
        if components_data and len(components_data) > 0:
            # Remove old
            salary.components.all().delete()
            
            total_earnings = Decimal(0)
            total_deductions = Decimal(0)
            
            for comp_data in components_data:
                component_id = comp_data.get('component_id') or comp_data.get('component')
                amount = Decimal(str(comp_data.get('amount', 0)))
                
                if component_id:
                    # DEBUG LOGGING
                    logger.info(f"Processing component_id: {component_id} type: {type(component_id)}")
                    try:
                        comp_obj = SalaryComponent.objects.get(id=component_id)
                    except SalaryComponent.DoesNotExist:
                        logger.error(f"FAILED TO FIND COMPONENT ID: {component_id}")
                        raise
                    
                    EmployeeSalaryComponent.objects.create(
                        employee_salary=salary,
                        component_id=component_id,
                        amount=amount
                    )
                    
                    if comp_obj.component_type == 'earning':
                        total_earnings += amount
                    else:
                        total_deductions += amount
            
            # Recalculate totals
            salary.gross_salary = salary.basic_salary + total_earnings
            salary.net_salary = salary.gross_salary - total_deductions
            salary.save()
            
        # Else if structure provided, auto-generate defaults
        elif salary.salary_structure:
            salary.components.all().delete()
            structure = salary.salary_structure
            
            total_earnings = Decimal(0)
            total_deductions = Decimal(0)
            
            for struct_comp in structure.components.all():
                amount = Decimal(0)
                
                # Logic to calculate amount based on type
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
            
            # Update totals
            salary.gross_salary = salary.basic_salary + total_earnings
            salary.net_salary = salary.gross_salary - total_deductions
            salary.save()
            
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current salary for an employee"""
        employee_id = request.query_params.get('employee')
        if not employee_id:
            return Response({'error': 'employee parameter required'}, status=400)
        
        try:
            salary = self.queryset.filter(employee_id=employee_id, is_current=True).first()
            if not salary:
                 return Response({'error': 'No current salary found'}, status=404)
            serializer = self.get_serializer(salary)
            return Response(serializer.data)
        except Exception:
            return Response({'error': 'No current salary found'}, status=404)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get summary stats for all current salaries of active employees"""
        queryset = self.get_queryset().filter(is_current=True, employee__status='active')
        
        stats = queryset.aggregate(
            total_net=Sum('net_salary'),
            total_gross=Sum('gross_salary'),
            total_basic=Sum('basic_salary'),
            avg_net=Avg('net_salary'),
            employee_count=Count('id')
        )
        
        # Ensure Decimals are converted to strings/floats for JSON compatibility if needed, 
        # though DRF Response usually handles Decimal
        return Response({
            'total_net_salary': stats['total_net'] or 0,
            'total_gross_salary': stats['total_gross'] or 0,
            'total_basic_salary': stats['total_basic'] or 0,
            'avg_net_salary': stats['avg_net'] or 0,
            'employee_count': stats['employee_count'] or 0
        })


class PayrollPeriodViewSet(viewsets.ModelViewSet):
    queryset = PayrollPeriod.objects.select_related('company', 'processed_by').all()
    serializer_class = PayrollPeriodSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['company', 'status', 'month', 'year']
    ordering_fields = ['year', 'month']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            return queryset.filter(company=user.organization)
        return queryset.none()
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate payroll for all employees for a month"""
        serializer = GeneratePayrollSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        company_id = serializer.validated_data.get('company')
        
        # If company not provided, infer from user
        if not company_id:
            user = request.user
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company_id = user.employee_profile.company_id
            elif hasattr(user, 'organization') and user.organization:
                company_id = user.organization.id
            
            if not company_id:
                return Response({'error': 'Could not determine organization context. Please contact support.'}, status=400)

        month = serializer.validated_data['month']
        year = serializer.validated_data['year']
        force = request.data.get('force', False)
        
        # Create or get payroll period
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        
        period, created = PayrollPeriod.objects.get_or_create(
            company_id=company_id,
            month=month,
            year=year,
            defaults={
                'name': start_date.strftime('%B %Y'),
                'start_date': start_date,
                'end_date': end_date,
                'status': 'processing'
            }
        )
        
        if not created and period.status != 'draft':
            if force:
                # Bypass: Delete existing payslips (even if paid) and regenerate
                # Note: In production, we might want to prevent this for 'paid', but for dev/bypass we allow it.
                
                # Delete existing payslips
                PaySlip.objects.filter(payroll_period=period).delete()
                # Reset totals
                period.total_employees = 0
                period.total_gross = 0
                period.total_net = 0
                period.status = 'processing'
                period.save()
            else:
                return Response({'error': 'Payroll already processed for this period'}, status=400)
        
        period.status = 'processing'
        period.save()
        
        # Get all active employees with current salary
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
            # Get current salary
            try:
                emp_salary = EmployeeSalary.objects.get(employee=employee, is_current=True)
            except EmployeeSalary.DoesNotExist:
                continue
            
            # Get or Generate Attendance Summary
            # We ensure it exists and is up to date
            summary, _ = AttendanceSummary.objects.get_or_create(
                employee=employee,
                month=month,
                year=year
            )
            # Recalculate to ensure it captures latest attendance changes
            summary.calculate_summary()
            
            # Step 1: Determine Days (User Formula)
            working_days = Decimal(summary.total_working_days)
            
            # paid_days calculation
            # Note: summary.present_days is usually integer count of rows with status='present'.
            # summary.half_days is count of 'half_day'.
            effective_present = Decimal(summary.present_days) + (Decimal(summary.half_days) * Decimal(0.5))
            paid_days = effective_present + Decimal(summary.leave_days) # + Holidays/WeekOffs? 
            # WAIT: User formula said: "paid_days = summary.present_days + (summary.half_days * 0.5) + summary.leave_days"
            # User formula for LOP: "lop_days = working_days - paid_days"
            
            # IMPORTANT: If 'working_days' excludes Holidays/WeekOffs (which it does in AttendanceSummary logic),
            # then 'paid_days' being just present+leave is correct for "Working Days Only".
            # BUT, standard payroll 'Working Days' often implies 'Billable Days' which 'total_working_days' might be.
            # Let's strictly follow User Formula.
            
            lop_days = max(Decimal(0), working_days - paid_days)
            
            # Overtime from Summary
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

            # Create payslip
            # We map summary fields to payslip fields
            # Note: PaySlip.present_days is Decimal, AttendanceSummary.present_days is Int.
            payslip, _ = PaySlip.objects.update_or_create(
                employee=employee,
                payroll_period=period,
                defaults={
                    'employee_salary': emp_salary,
                    'working_days': working_days,
                    'present_days': effective_present, # Store effective present days
                    'leave_days': summary.leave_days,
                    'absent_days': summary.absent_days,
                    'lop_days': lop_days,
                    'overtime_hours': overtime_hours,
                    'overtime_amount': overtime_amount,
                }
            )
            
            # Calculate salary (Generates components and totals)
            payslip.calculate_salary()
            payslip.save()
            
            payslips_created += 1
            total_gross += payslip.gross_earnings
            total_deductions += payslip.total_deductions
            total_net += payslip.net_salary
            total_lop += payslip.lop_deduction
        
        # Update period totals
        period.total_employees = payslips_created
        period.total_gross = total_gross
        period.total_deductions = total_deductions
        period.total_net = total_net
        period.status = 'completed'
        period.processed_at = timezone.now()
        period.save()
        
        return Response({
            'message': f'Payroll generated for {payslips_created} employees',
            'period_id': period.id,
            'total_net': str(total_net),
            'total_gross': str(total_gross),
            'total_lop': str(total_lop),
            'total_employees': payslips_created
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark all payslips in period as paid"""
        period = self.get_object()
        payment_date = request.data.get('payment_date', date.today().isoformat())
        payment_mode = request.data.get('payment_mode', 'bank')
        
        PaySlip.objects.filter(payroll_period=period).update(
            status='paid',
            payment_date=payment_date,
            payment_mode=payment_mode
        )
        
        period.status = 'paid'
        period.save()
        
        return Response({'message': 'Payroll marked as paid'})


class PaySlipViewSet(viewsets.ModelViewSet):
    queryset = PaySlip.objects.select_related(
        'employee', 'payroll_period', 'employee_salary'
    ).prefetch_related('components__component').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'payroll_period', 'status']
    search_fields = ['employee__employee_id', 'employee__first_name']
    ordering_fields = ['payroll_period__year', 'payroll_period__month']
    
    def get_queryset(self):
        """Filter payslips by the current user's organization"""
        try:
            queryset = super().get_queryset()
            user = self.request.user
            
            # If user has an employee profile, filter by their company
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company = user.employee_profile.company
                if company:
                    queryset = queryset.filter(employee__company=company)
            # If user is a ClientAdmin (has organization), filter by that
            elif hasattr(user, 'organization') and user.organization:
                queryset = queryset.filter(employee__company=user.organization)
            
            return queryset
        except Exception as e:
            return self.queryset.none()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PaySlipDetailSerializer
        return PaySlipSerializer
    
    @action(detail=False, methods=['get'])
    def my_payslips(self, request):
        """Get all payslips for an employee"""
        try:
            employee_id = request.query_params.get('employee')
            if not employee_id:
                return Response({'error': 'employee parameter required'}, status=400)
            
            payslips = self.get_queryset().filter(employee_id=employee_id)
            serializer = PaySlipSerializer(payslips, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get payroll dashboard statistics for a specific month/year"""
        try:
            month = int(request.query_params.get('month', date.today().month))
            year = int(request.query_params.get('year', date.today().year))
            
            from django.db.models import Sum, Count, F, Value
            from django.db.models.functions import Concat
            
            # Get payslips for the specified period (filtered by org)
            payslips = self.get_queryset().filter(
                payroll_period__month=month,
                payroll_period__year=year
            )
            
            # 1. Status Counts
            # Mapping: 'generated'->'draft', 'approved'->'confirmed', 'paid'->'paid'
            status_counts = {
                'paid': payslips.filter(status='paid').count(),
                'confirmed': payslips.filter(status='approved').count(),
                'review_ongoing': 0, # Not currently used in model
                'draft': payslips.filter(status='generated').count(),
            }
            
            # 2. Totals
            totals = payslips.aggregate(
                payslips_generated=Count('id'),
                total_gross=Sum('gross_earnings') or 0,
                total_net=Sum('net_salary') or 0
            )
            
            # 3. Employee Payslips (for chart)
            employee_payslips = payslips.select_related('employee').annotate(
                name=Concat('employee__first_name', Value(' '), 'employee__last_name'),
                gross=F('gross_earnings')
            ).values('id', 'name', 'gross', 'status')
            
            # 4. Department Breakdown
            department_breakdown = payslips.values(
                name=F('employee__department__name')
            ).annotate(
                employee_count=Count('id'),
                total_gross=Sum('gross_earnings'),
                total_net=Sum('net_salary')
            ).order_by('name')
            
            return Response({
                'status_counts': status_counts,
                'totals': totals,
                'employee_payslips': list(employee_payslips),
                'department_breakdown': list(department_breakdown)
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Generate and download PDF payslip"""
        try:
            payslip = self.get_object()
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

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Recalculate salary (useful after manual adjustments)"""
        payslip = self.get_object()
        payslip.calculate_salary()
        payslip.save()
        serializer = self.get_serializer(payslip)
        return Response(serializer.data)