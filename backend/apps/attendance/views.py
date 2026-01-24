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

    def create(self, request, *args, **kwargs):
        print(f"DEBUG: AttendanceViewSet.create received data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"DEBUG: AttendanceViewSet validation FAILED: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

    # ---------------- MONTHLY MATRIX ----------------
    @action(detail=False, methods=['get'])
    def monthly_matrix(self, request):
        try:
            today = date.today()
            month = int(request.query_params.get('month', today.month))
            year = int(request.query_params.get('year', today.year))
            
            # 1. Get all active employees (optimize with select_related if needed)
            employees = Employee.objects.filter(is_active=True).order_by('first_name')
            
            # 2. Get date range
            days_in_month = monthrange(year, month)[1]
            start_date = date(year, month, 1)
            end_date = date(year, month, days_in_month)
            
            # 3. Fetch all attendance for this month
            attendances = Attendance.objects.filter(
                date__range=(start_date, end_date),
                employee__in=employees
            )
            
            # 4. Build lookup dict: attendance_map[emp_id][day_int] = status_code
            attendance_map = {}
            for att in attendances:
                eid = str(att.employee.id)
                if eid not in attendance_map:
                    attendance_map[eid] = {}
                
                # Determine status code for UI
                status_code = ''
                if att.status == 'present':
                    status_code = 'P'
                elif att.status == 'absent':
                    status_code = 'A'
                elif att.status == 'half_day':
                    status_code = 'H'
                elif att.status == 'on_leave':
                    status_code = 'L' # Leave
                elif att.status == 'holiday':
                    status_code = 'O' # Off/Holiday
                else:
                    status_code = att.status[:1].upper()
                    
                attendance_map[eid][att.date.day] = status_code

            # 5. Construct response data
            employee_data = []
            for emp in employees:
                eid = str(emp.id)
                emp_status_list = []
                emp_stats = {'P': 0, 'A': 0, 'L': 0, 'H': 0, 'Conflict': 0}
                
                emp_att_map = attendance_map.get(eid, {})
                
                # Fill array for each day 1..31 (or days_in_month)
                status_array = []
                for d in range(1, 32):
                    if d > days_in_month:
                        status_array.append('')
                        continue
                        
                    st = emp_att_map.get(d, '')
                    status_array.append(st)
                    
                    # Caluclate stats
                    if st == 'P': emp_stats['P'] += 1
                    elif st == 'A': emp_stats['A'] += 1
                    elif st == 'L': emp_stats['L'] += 1
                    elif st == 'H': emp_stats['H'] += 1
                
                employee_data.append({
                    'id': eid,
                    'employee_id': emp.employee_id,
                    'name': emp.full_name,
                    'status': status_array,
                    'stats': emp_stats,
                    'meta': emp.designation.name if emp.designation else ''
                })

            return Response({
                'month': month,
                'year': year,
                'days_in_month': days_in_month,
                'employees': employee_data
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
class AttendanceSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing monthly attendance summaries"""
    queryset = AttendanceSummary.objects.select_related('employee').order_by('-year', '-month')
    serializer_class = AttendanceSummarySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'year', 'month', 'is_finalized']
    search_fields = ['employee__full_name', 'employee__employee_id']
    ordering_fields = ['year', 'month', 'attendance_percentage']


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


    # ---------------- EXCEPTIONS REPORT (LATE/EARLY) ----------------
    @action(detail=False, methods=['get'])
    def exceptions_report(self, request):
        try:
            today = date.today()
            month = int(request.query_params.get('month', today.month))
            year = int(request.query_params.get('year', today.year))
            
            # Filter by date range
            days_in_month = monthrange(year, month)[1]
            start_date = date(year, month, 1)
            end_date = date(year, month, days_in_month)
            
            # Get attendance with exceptions
            exceptions = Attendance.objects.filter(
                date__range=(start_date, end_date)
            ).filter(
                Q(is_late=True) | Q(is_early_departure=True)
            ).select_related('employee', 'shift', 'employee__designation').order_by('-date')
            
            data = []
            for att in exceptions:
                # Determine primary exception (could be both)
                status = ''
                delay = ''
                
                if att.is_late and att.is_early_departure:
                    status = 'Late & Early Out'
                    delay = f"{att.late_by_minutes}m Late / {att.early_departure_minutes}m Early"
                elif att.is_late:
                    status = 'Late'
                    delay = f"{att.late_by_minutes} mins"
                    if att.late_by_minutes > 60:
                        h = att.late_by_minutes // 60
                        m = att.late_by_minutes % 60
                        delay = f"{h}h {m}m"
                elif att.is_early_departure:
                    status = 'Early Out'
                    delay = f"{att.early_departure_minutes} mins"
                
                data.append({
                    'id': str(att.id),
                    'name': att.employee.full_name,
                    'empId': att.employee.employee_id,
                    'date': att.date,
                    'status': status,
                    'delay': delay,
                    'policy': att.shift.name if att.shift else 'General'
                })
                
            return Response({
                'count': len(data),
                'results': data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    # ---------------- ATTENDANCE LOGS (DAILY RECORDS) ----------------
    @action(detail=False, methods=['get'])
    def logs(self, request):
        try:
            # Default to today if no date provided
            today = date.today().isoformat()
            query_date = request.query_params.get('date', today)
            
            # Parse date
            target_date = datetime.strptime(query_date, '%Y-%m-%d').date()
            
            # Fetch logs
            logs = Attendance.objects.filter(
                date=target_date
            ).select_related('employee').order_by('-check_in_time')
            
            # Use serializer for consistent data
            serializer = AttendanceListSerializer(logs, many=True)
            
            return Response({
                'count': logs.count(),
                'date': query_date,
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    # ---------------- MY DASHBOARD (EMPLOYEE VIEW) ----------------
    @action(detail=False, methods=['get'])
    def my_dashboard(self, request):
        try:
            employee = getattr(request.user, 'employee', None)
            if not employee:
                return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            today = date.today()
            month = int(request.query_params.get('month', today.month))
            year = int(request.query_params.get('year', today.year))
            
            # 1. Monthly Stats
            attendances = Attendance.objects.filter(
                employee=employee,
                date__year=year,
                date__month=month
            )
            
            stats = {
                'present': attendances.filter(status='present').count(),
                'absent': attendances.filter(status='absent').count(),
                'half_day': attendances.filter(status='half_day').count(),
                'on_leave': attendances.filter(status='on_leave').count(),
                'late': attendances.filter(is_late=True).count(),
                'total_hours': attendances.aggregate(Sum('total_hours'))['total_hours__sum'] or 0
            }
            
            # 2. Today's Status
            today_att = Attendance.objects.filter(employee=employee, date=today).first()
            today_status = {
                'check_in': today_att.check_in_time if today_att else None,
                'check_out': today_att.check_out_time if today_att else None,
                'status': today_att.status if today_att else 'Not Marked',
                'working_hours': today_att.total_hours if today_att else 0
            }
            
            # 3. Recent Activity (Last 5 days)
            recent_logs = Attendance.objects.filter(
                employee=employee
            ).order_by('-date')[:5]
            
            logs_serializer = AttendanceListSerializer(recent_logs, many=True)
            
            # 4. Averages (Current Month)
            avg_check_in = attendances.exclude(check_in_time__isnull=True).extra(select={'time': "EXTRACT(HOUR FROM check_in_time) * 60 + EXTRACT(MINUTE FROM check_in_time)"}).aggregate(Avg('time'))['time__avg']
            
            # Convert minutes to HH:MM
            avg_in_str = "09:00" # Default
            if avg_check_in:
                h = int(avg_check_in // 60)
                m = int(avg_check_in % 60)
                avg_in_str = f"{h:02d}:{m:02d}"

            return Response({
                'stats': stats,
                'today': today_status,
                'recent_logs': logs_serializer.data,
                'averages': {'check_in': avg_in_str}
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ================== ATTENDANCE REGULARIZATION REQUEST ==================
class AttendanceRegularizationRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRegularizationRequest.objects.select_related('employee', 'attendance', 'reviewed_by')
    serializer_class = AttendanceRegularizationSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'request_type', 'employee']
    search_fields = ['employee__full_name', 'employee__employee_id', 'reason']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        # Clean up mutable data
        data = request.data.copy()
        print(f"DEBUG: Processing create with keys: {data.keys()}")
        
        # Handle attendance date
        if 'attendance_date' in data and 'employee' in data:
            attendance_date = data.get('attendance_date')
            if isinstance(attendance_date, list):
                attendance_date = attendance_date[0]
                
            employee_id = data.get('employee')
            
            # Get or create attendance record
            # Note: Attendance is already imported at module level
            attendance, created = Attendance.objects.get_or_create(
                employee_id=employee_id,
                date=attendance_date,
                defaults={'status': 'absent'}
            )
            print(f"DEBUG: Linked attendance {attendance.id} (Created: {created})")
            
            data['attendance'] = str(attendance.id)
        
        print(f"DEBUG: Final data passed to serializer: {data}")
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print(f"DEBUG: Serializer VALIDATION FAILED. Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending regularization requests"""
        try:
            pending_requests = AttendanceRegularizationRequest.objects.filter(
                status='pending'
            ).select_related('employee', 'attendance', 'reviewed_by')
            
            serializer = self.get_serializer(pending_requests, many=True)
            return Response({
                'count': pending_requests.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a regularization request"""
        try:
            regularization = self.get_object()
            
            if regularization.status != 'pending':
                return Response(
                    {'error': 'Only pending requests can be approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            regularization.status = 'approved'
            regularization.reviewed_by = request.user.employee
            regularization.reviewed_at = timezone.now()
            regularization.reviewer_comments = request.data.get('comments', '')
            regularization.save()
            
            # Update the attendance record if check-in/check-out times were requested
            attendance = regularization.attendance
            if regularization.requested_check_in:
                attendance.check_in_time = regularization.requested_check_in
            if regularization.requested_check_out:
                attendance.check_out_time = regularization.requested_check_out
            attendance.save()
            
            serializer = self.get_serializer(regularization)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a regularization request"""
        try:
            regularization = self.get_object()
            
            if regularization.status != 'pending':
                return Response(
                    {'error': 'Only pending requests can be rejected'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            regularization.status = 'rejected'
            regularization.reviewed_by = request.user.employee
            regularization.reviewed_at = timezone.now()
            regularization.reviewer_comments = request.data.get('comments', '')
            regularization.save()
            
            serializer = self.get_serializer(regularization)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
