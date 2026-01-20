from datetime import date
from calendar import monthrange

from django.db import transaction
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    AttendancePolicy,
    Shift,
    EmployeeShiftAssignment,
    Attendance,
    AttendanceBreak,
    Holiday,
    AttendanceRegularizationRequest,
    AttendanceSummary
)
from .serializers import (
    AttendancePolicySerializer,
    ShiftSerializer,
    EmployeeShiftAssignmentSerializer,
    AttendanceSerializer,
    AttendanceDetailSerializer,
    AttendanceBreakSerializer,
    HolidaySerializer,
    AttendanceRegularizationSerializer,
    AttendanceSummarySerializer
)
from apps.accounts.models import Employee


# ================== ATTENDANCE POLICY ==================
class AttendancePolicyViewSet(viewsets.ModelViewSet):
    queryset = AttendancePolicy.objects.select_related('company', 'department')
    serializer_class = AttendancePolicySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company', 'department', 'policy_type', 'is_active']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ================== SHIFT ==================
class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related('company')
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'shift_type', 'is_active']
    search_fields = ['name', 'code']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ================== EMPLOYEE SHIFT ASSIGNMENT ==================
class EmployeeShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeShiftAssignment.objects.select_related('employee', 'shift')
    serializer_class = EmployeeShiftAssignmentSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'shift', 'is_active']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ================== ATTENDANCE ==================
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee', 'shift')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'date', 'status', 'is_late']
    search_fields = ['employee__full_name', 'employee__employee_id']
    ordering_fields = ['date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AttendanceDetailSerializer
        return AttendanceSerializer

    # ---------------- CHECK-IN ----------------
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        try:
            employee = get_object_or_404(Employee, pk=request.data.get('employee'))
            today = timezone.localdate()

            attendance, _ = Attendance.objects.get_or_create(employee=employee, date=today)
            attendance.check_in_time = timezone.now()
            attendance.check_in_device = request.data.get('device', '')
            attendance.check_in_ip = request.META.get('REMOTE_ADDR')
            attendance.save()

            return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- CHECK-OUT ----------------
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        try:
            employee = get_object_or_404(Employee, pk=request.data.get('employee'))
            today = timezone.localdate()

            attendance = get_object_or_404(Attendance, employee=employee, date=today)
            attendance.check_out_time = timezone.now()
            attendance.check_out_device = request.data.get('device', '')
            attendance.check_out_ip = request.META.get('REMOTE_ADDR')
            attendance.save()

            return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- BULK ATTENDANCE ----------------
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        try:
            employee_ids = request.data.get('employees', [])
            status_val = request.data.get('status', 'present')
            attendance_date = request.data.get('date', timezone.localdate())
            remarks = request.data.get('remarks', '')

            ids = []
            for emp_id in employee_ids:
                attendance, _ = Attendance.objects.update_or_create(
                    employee_id=emp_id,
                    date=attendance_date,
                    defaults={'status': status_val, 'remarks': remarks}
                )
                ids.append(str(attendance.id))

            return Response({
                'message': 'Bulk attendance marked successfully',
                'count': len(ids),
                'attendance_ids': ids
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- DAILY SUMMARY ----------------
    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        try:
            attendance_date = request.query_params.get('date', timezone.localdate())
            summary = Attendance.objects.filter(date=attendance_date).aggregate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                half_day=Count('id', filter=Q(status='half_day')),
                on_leave=Count('id', filter=Q(status='on_leave')),
                late=Count('id', filter=Q(is_late=True)),
            )
            return Response({'date': attendance_date, 'summary': summary}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- EMPLOYEE MONTHLY ----------------
    @action(detail=False, methods=['get'])
    def employee_monthly(self, request):
        try:
            employee_id = request.query_params.get('employee')
            month = int(request.query_params.get('month', date.today().month))
            year = int(request.query_params.get('year', date.today().year))

            if not employee_id:
                return Response({'error': 'employee parameter required'}, status=status.HTTP_400_BAD_REQUEST)

            attendances = Attendance.objects.filter(
                employee_id=employee_id, date__month=month, date__year=year
            )

            summary = attendances.aggregate(
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                half_day=Count('id', filter=Q(status='half_day')),
                on_leave=Count('id', filter=Q(status='on_leave')),
                late_days=Count('id', filter=Q(is_late=True)),
                total_hours=Sum('total_hours'),
                overtime_hours=Sum('overtime_hours')
            )

            serializer = AttendanceSerializer(attendances, many=True)
            return Response({'records': serializer.data, 'summary': summary}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- DASHBOARD STATISTICS ----------------
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        try:
            today = timezone.localdate()
            attendance_date = request.query_params.get('date', today)
            
            # Get all employees count
            total_employees = Employee.objects.filter(is_active=True).count()
            
            # Get today's attendance records
            today_attendances = Attendance.objects.filter(date=attendance_date)
            
            # Calculate statistics
            total_present = today_attendances.filter(status='present').count()
            on_time = today_attendances.filter(is_late=False, status='present').count()
            late_come = today_attendances.filter(is_late=True).count()
            
            # Calculate percentage
            attendance_percentage = (total_present / total_employees * 100) if total_employees > 0 else 0
            
            return Response({
                'date': attendance_date,
                'total_employees': total_employees,
                'total_present': total_present,
                'attendance_percentage': round(attendance_percentage, 2),
                'on_time': on_time,
                'late_come': late_come,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- OFFLINE EMPLOYEES ----------------
    @action(detail=False, methods=['get'])
    def offline_employees(self, request):
        try:
            today = timezone.localdate()
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 6))
            
            # Get all active employees
            all_employees = Employee.objects.filter(is_active=True)
            
            # Get employees who checked in today
            checked_in_ids = Attendance.objects.filter(
                date=today,
                check_in_time__isnull=False
            ).values_list('employee_id', flat=True)
            
            # Get offline employees
            offline_employees = all_employees.exclude(id__in=checked_in_ids)
            
            # Pagination
            start = (page - 1) * page_size
            end = start + page_size
            total = offline_employees.count()
            total_pages = (total + page_size - 1) // page_size
            
            employees_data = []
            for emp in offline_employees[start:end]:
                employees_data.append({
                    'id': str(emp.id),
                    'name': emp.full_name,
                    'employee_id': emp.employee_id,
                    'status': 'Expected',  # Can be customized based on shift or other logic
                    'avatar': emp.full_name[0].upper() if emp.full_name else 'U'
                })
            
            return Response({
                'employees': employees_data,
                'page': page,
                'page_size': page_size,
                'total': total,
                'total_pages': total_pages
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- ON BREAK EMPLOYEES ----------------
    @action(detail=False, methods=['get'])
    def on_break(self, request):
        try:
            # Get employees currently on break (break started but not ended)
            from .models import AttendanceBreak
            
            active_breaks = AttendanceBreak.objects.filter(
                end_time__isnull=True
            ).select_related('attendance__employee')
            
            employees_data = []
            for brk in active_breaks:
                employees_data.append({
                    'id': str(brk.attendance.employee.id),
                    'name': brk.attendance.employee.full_name,
                    'employee_id': brk.attendance.employee.employee_id,
                    'break_start': brk.start_time,
                    'break_type': brk.break_type if hasattr(brk, 'break_type') else 'Break'
                })
            
            return Response({
                'count': len(employees_data),
                'employees': employees_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- OVERTIME PENDING APPROVAL ----------------
    @action(detail=False, methods=['get'])
    def overtime_pending(self, request):
        try:
            # Get attendance records with overtime but not approved
            pending_overtime = Attendance.objects.filter(
                overtime_hours__gt=0,
                status='present'
            ).exclude(
                remarks__icontains='approved'
            ).select_related('employee')[:10]
            
            overtime_data = []
            for att in pending_overtime:
                overtime_data.append({
                    'id': str(att.id),
                    'employee': {
                        'id': str(att.employee.id),
                        'name': att.employee.full_name,
                        'employee_id': att.employee.employee_id
                    },
                    'date': att.date,
                    'overtime_hours': float(att.overtime_hours) if att.overtime_hours else 0,
                    'total_hours': float(att.total_hours) if att.total_hours else 0
                })
            
            return Response({
                'count': len(overtime_data),
                'records': overtime_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- ATTENDANCE VALIDATION ----------------
    @action(detail=False, methods=['get', 'post'])
    def to_validate(self, request):
        try:
            if request.method == 'GET':
                # Get attendance records that need validation
                # (e.g., manual entries, late check-ins needing approval)
                pending_validation = Attendance.objects.filter(
                    check_in_time__isnull=False,
                    status='present'
                ).exclude(
                    remarks__icontains='validated'
                ).select_related('employee').order_by('-date')[:10]
                
                validation_data = []
                for att in pending_validation:
                    validation_data.append({
                        'id': str(att.id),
                        'employee': {
                            'id': str(att.employee.id),
                            'name': att.employee.full_name,
                            'employee_id': att.employee.employee_id,
                            'avatar': att.employee.full_name[0].upper() if att.employee.full_name else 'U'
                        },
                        'date': att.date,
                        'check_in': att.check_in_time.strftime('%H:%M') if att.check_in_time else None,
                        'in_date': att.date
                    })
                
                return Response({
                    'count': len(validation_data),
                    'records': validation_data
                }, status=status.HTTP_200_OK)
            
            elif request.method == 'POST':
                # Validate an attendance record
                attendance_id = request.data.get('attendance_id')
                if not attendance_id:
                    return Response({'error': 'attendance_id required'}, status=status.HTTP_400_BAD_REQUEST)
                
                attendance = get_object_or_404(Attendance, pk=attendance_id)
                attendance.remarks = 'Validated'
                attendance.save()
                
                return Response({
                    'message': 'Attendance validated successfully',
                    'attendance_id': str(attendance.id)
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- ANALYTICS DATA ----------------
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        try:
            period = request.query_params.get('period', 'Day')  # Day, Week, Month
            today = timezone.localdate()
            
            if period == 'Day':
                # Last 7 days
                from datetime import timedelta
                dates = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
                
                analytics_data = []
                for d in dates:
                    day_attendances = Attendance.objects.filter(date=d)
                    total = day_attendances.count()
                    on_time = day_attendances.filter(is_late=False, status='present').count()
                    late = day_attendances.filter(is_late=True).count()
                    early_out = 0  # Can be calculated if you have early_out field
                    
                    analytics_data.append({
                        'date': d.strftime('%Y-%m-%d'),
                        'label': d.strftime('%a'),  # Mon, Tue, etc.
                        'on_time': on_time,
                        'late_come': late,
                        'early_out': early_out,
                        'total': total,
                        'percentage': round((on_time / total * 100) if total > 0 else 0, 1)
                    })
                
                return Response({
                    'period': period,
                    'data': analytics_data
                }, status=status.HTTP_200_OK)
            
            # Add Week and Month logic if needed
            return Response({'error': 'Invalid period'}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- DEPARTMENT OVERTIME CHART ----------------
    @action(detail=False, methods=['get'])
    def department_overtime(self, request):
        try:
            month = int(request.query_params.get('month', date.today().month))
            year = int(request.query_params.get('year', date.today().year))
            
            # Get overtime by department
            from django.db.models import Sum
            from apps.accounts.models import Department
            
            departments = Department.objects.all()
            overtime_data = []
            
            for dept in departments:
                overtime_sum = Attendance.objects.filter(
                    employee__department=dept,
                    date__month=month,
                    date__year=year
                ).aggregate(
                    total_overtime=Sum('overtime_hours')
                )['total_overtime'] or 0
                
                if overtime_sum > 0:
                    overtime_data.append({
                        'department': dept.name,
                        'overtime_hours': float(overtime_sum),
                        'color': '#3b82f6' if 'Manager' in dept.name else '#ec4899'
                    })
            
            return Response({
                'month': month,
                'year': year,
                'data': overtime_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



# ================== HOLIDAYS ==================
class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.select_related('company')
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'holiday_type', 'date']
    search_fields = ['name']

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        try:
            company = request.query_params.get('company')
            holidays = Holiday.objects.filter(date__gte=date.today(), is_active=True)
            if company:
                holidays = holidays.filter(company_id=company)
            serializer = self.get_serializer(holidays[:10], many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ================== ATTENDANCE SUMMARY ==================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_monthly_summary(request):
    try:
        employee_id = request.data.get('employee')
        year = int(request.data.get('year'))
        month = int(request.data.get('month'))

        if not employee_id or not year or not month:
            return Response({'error': 'employee, year, and month are required'}, status=status.HTTP_400_BAD_REQUEST)

        employee = get_object_or_404(Employee, pk=employee_id)
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])

        attendances = Attendance.objects.filter(employee=employee, date__range=(start_date, end_date))
        aggregates = attendances.aggregate(
            total_days=Count('id'),
            present_days=Count('id', filter=Q(status='present')),
            absent_days=Count('id', filter=Q(status='absent')),
            half_days=Count('id', filter=Q(status='half_day')),
            leave_days=Count('id', filter=Q(status='on_leave')),
            late_days=Count('id', filter=Q(is_late=True)),
            total_hours=Sum('total_hours'),
            overtime_hours=Sum('overtime_hours')
        )

        summary, created = AttendanceSummary.objects.update_or_create(
            employee=employee,
            year=year,
            month=month,
            defaults={
                'total_working_days': aggregates['total_days'] or 0,
                'present_days': aggregates['present_days'] or 0,
                'absent_days': aggregates['absent_days'] or 0,
                'half_days': aggregates['half_days'] or 0,
                'leave_days': aggregates['leave_days'] or 0,
                'total_hours_worked': aggregates['total_hours'] or 0,
                'overtime_hours': aggregates['overtime_hours'] or 0,
                'late_arrivals': aggregates['late_days'] or 0,
                'generated_at': timezone.now()
            }
        )

        serializer = AttendanceSummarySerializer(summary)
        return Response({'created': created, 'summary': serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
