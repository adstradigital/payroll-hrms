from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from django.utils import timezone
from datetime import date
from calendar import monthrange
from decimal import Decimal

from apps.accounts.models import Employee
from apps.attendance.models import Attendance
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
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current salary for an employee"""
        employee_id = request.query_params.get('employee')
        if not employee_id:
            return Response({'error': 'employee parameter required'}, status=400)
        
        try:
            salary = self.queryset.get(employee_id=employee_id, is_current=True)
            serializer = self.get_serializer(salary)
            return Response(serializer.data)
        except EmployeeSalary.DoesNotExist:
            return Response({'error': 'No current salary found'}, status=404)


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
        
        for employee in employees:
            # Get current salary
            try:
                emp_salary = EmployeeSalary.objects.get(employee=employee, is_current=True)
            except EmployeeSalary.DoesNotExist:
                continue
            
            # Get attendance summary
            attendances = Attendance.objects.filter(
                employee=employee,
                date__range=[start_date, end_date]
            )
            
            working_days = end_date.day  # Simplified
            present_days = attendances.filter(status='present').count()
            half_days = attendances.filter(status='half_day').count() * Decimal(0.5)
            leave_days = attendances.filter(status='on_leave').count()
            absent_days = attendances.filter(status='absent').count()
            
            # Get approved leaves
            approved_leaves = LeaveRequest.objects.filter(
                employee=employee,
                status='approved',
                start_date__lte=end_date,
                end_date__gte=start_date
            ).aggregate(total_days=Sum('days_count'))['total_days'] or 0
            
            # Calculate LOP (absent without approved leave)
            lop_days = max(0, absent_days - approved_leaves)
            
            # Create payslip
            payslip, _ = PaySlip.objects.update_or_create(
                employee=employee,
                payroll_period=period,
                defaults={
                    'employee_salary': emp_salary,
                    'working_days': working_days,
                    'present_days': present_days + half_days,
                    'leave_days': leave_days,
                    'absent_days': absent_days,
                    'lop_days': lop_days,
                }
            )
            
            # Calculate salary
            payslip.calculate_salary()
            payslip.save()
            
            # Create payslip components
            for comp in emp_salary.components.all():
                PaySlipComponent.objects.update_or_create(
                    payslip=payslip,
                    component=comp.component,
                    defaults={'amount': comp.amount}
                )
            
            payslips_created += 1
            total_gross += payslip.gross_earnings
            total_deductions += payslip.total_deductions
            total_net += payslip.net_salary
        
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
            'total_net': str(total_net)
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