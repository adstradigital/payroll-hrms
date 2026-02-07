from datetime import date, datetime
import logging
try:
    import holidays
except ImportError:
    holidays = None
from calendar import monthrange

logger = logging.getLogger(__name__)

from django.db import transaction
from django.db.models import Q, Sum, Count, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
from apps.accounts.permissions import is_client_admin

from .holiday_engine import get_indian_holidays

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
    AttendanceRegularizationActionSerializer,
    AttendanceSummarySerializer,
    AttendanceListSerializer,
    BulkAttendanceSerializer,
    CheckInSerializer,
    CheckOutSerializer,
    AttendancePunchSerializer
)
from apps.accounts.models import Employee
from django.apps import apps


def safe_api(fn):
    try:
        return fn()
    except Exception as e:
        logger.exception(e)
        # Handle DRF-specific exceptions if needed, but for now simple catch-all
        if hasattr(e, 'detail'):
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ================== ATTENDANCE POLICY ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def policy_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = AttendancePolicy.objects.select_related('company', 'department')
            
            if not user.is_superuser:
                employee = getattr(user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(company=employee.company)
                else:
                    return Response([], status=status.HTTP_200_OK)

            # Basic filtering manually since we're not in a ViewSet
            policy_type = request.query_params.get('policy_type')
            if policy_type:
                queryset = queryset.filter(policy_type=policy_type)
            
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')

            serializer = AttendancePolicySerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = AttendancePolicySerializer(data=request.data)
            if serializer.is_valid():
                company = None
                if hasattr(user, 'employee_profile') and user.employee_profile:
                    company = user.employee_profile.company
                elif hasattr(user, 'organization') and user.organization:
                    company = user.organization
                
                if company:
                    serializer.save(company=company)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response({'error': 'Could not determine company'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def policy_detail(request, pk):
    def logic():
        user = request.user
        queryset = AttendancePolicy.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(company=employee.company)
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = AttendancePolicySerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = AttendancePolicySerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return safe_api(logic)


# ================== SHIFT ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def shift_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = Shift.objects.select_related('company')
            
            if not user.is_superuser:
                employee = getattr(user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(company=employee.company)
                else:
                    return Response([], status=status.HTTP_200_OK)

            # Basic filtering manually
            shift_type = request.query_params.get('shift_type')
            if shift_type:
                queryset = queryset.filter(shift_type=shift_type)
            
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))

            serializer = ShiftSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = ShiftSerializer(data=request.data)
            if serializer.is_valid():
                company = None
                if hasattr(user, 'employee_profile') and user.employee_profile:
                    company = user.employee_profile.company
                elif hasattr(user, 'organization') and user.organization:
                    company = user.organization
                
                if company:
                    if serializer.validated_data.get('is_default'):
                        Shift.objects.filter(company=company, is_default=True).update(is_default=False)
                    serializer.save(company=company)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response({'error': 'Could not determine company'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def shift_detail(request, pk):
    def logic():
        user = request.user
        queryset = Shift.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(company=employee.company)
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = ShiftSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ShiftSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                if serializer.validated_data.get('is_default'):
                    company = instance.company
                    Shift.objects.filter(company=company, is_default=True).exclude(pk=instance.pk).update(is_default=False)
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return safe_api(logic)


# ================== EMPLOYEE SHIFT ASSIGNMENT ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def assignment_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = EmployeeShiftAssignment.objects.select_related('employee', 'shift')
            
            if not user.is_superuser:
                employee = getattr(user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(employee__company=employee.company)
                else:
                    return Response([], status=status.HTTP_200_OK)

            # Basic filtering
            emp_id = request.query_params.get('employee')
            if emp_id:
                queryset = queryset.filter(employee_id=emp_id)
            
            shift_id = request.query_params.get('shift')
            if shift_id:
                queryset = queryset.filter(shift_id=shift_id)
            
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')

            serializer = EmployeeShiftAssignmentSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = EmployeeShiftAssignmentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def assignment_detail(request, pk):
    def logic():
        user = request.user
        queryset = EmployeeShiftAssignment.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(employee__company=employee.company)
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = EmployeeShiftAssignmentSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeShiftAssignmentSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return safe_api(logic)


# ================== ATTENDANCE ==================

# ---------------- ATTENDANCE CORE ----------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def attendance_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = Attendance.objects.select_related('employee', 'shift')
            
            if not user.is_superuser:
                employee = getattr(user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(employee__company=employee.company)
                else:
                    return Response([], status=status.HTTP_200_OK)

            # Basic filtering manually
            emp_id = request.query_params.get('employee')
            if emp_id: queryset = queryset.filter(employee_id=emp_id)
            
            att_date = request.query_params.get('date')
            if att_date: queryset = queryset.filter(date=att_date)
            
            att_status = request.query_params.get('status')
            if att_status: queryset = queryset.filter(status=att_status)
            
            is_late = request.query_params.get('is_late')
            if is_late is not None: queryset = queryset.filter(is_late=is_late.lower() == 'true')
            
            serializer = AttendanceSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = AttendanceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def attendance_detail(request, pk):
    def logic():
        user = request.user
        queryset = Attendance.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(employee__company=employee.company)
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = AttendanceDetailSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = AttendanceSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_in(request):
    def logic():
        employee = get_object_or_404(Employee, pk=request.data.get('employee'))
        today = timezone.localdate()

        attendance, _ = Attendance.objects.get_or_create(employee=employee, date=today)
        
        # Assign shift if not already assigned
        if not attendance.shift:
            # 1. Check for assigned shift
            assignment = EmployeeShiftAssignment.objects.filter(
                employee=employee,
                is_active=True,
                effective_from__lte=today
            ).filter(
                Q(effective_to__isnull=True) | Q(effective_to__gte=today)
            ).first()
            
            if assignment:
                attendance.shift = assignment.shift
            else:
                # 2. Check for default company shift
                default_shift = Shift.objects.filter(
                    company=employee.company, 
                    is_default=True,
                    is_active=True
                ).first()
                if default_shift:
                    attendance.shift = default_shift

        attendance.check_in_time = timezone.now()
        attendance.check_in_device = request.data.get('device', '')
        attendance.check_in_ip = request.META.get('REMOTE_ADDR')
        attendance.status = 'present'  # Mark as present when clocking in
        
        # Calculate Late Status
        if attendance.shift:
            # Combine today's date with shift start time to get naive datetime
            shift_start_naive = datetime.combine(today, attendance.shift.start_time)
            # Make it timezone aware matching the check_in_time's timezone
            shift_start_aware = timezone.make_aware(shift_start_naive)
            
            # Add grace period
            from datetime import timedelta
            grace_limit = shift_start_aware + timedelta(minutes=attendance.shift.grace_period_minutes)
            
            if attendance.check_in_time > grace_limit:
                attendance.is_late = True
                # Calculate minutes late from actual start time (not grace limit)
                late_delta = attendance.check_in_time - shift_start_aware
                attendance.late_by_minutes = int(late_delta.total_seconds() / 60)
        
        attendance.save()
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)

    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_out(request):
    def logic():
        employee = get_object_or_404(Employee, pk=request.data.get('employee'))
        today = timezone.localdate()

        attendance = get_object_or_404(Attendance, employee=employee, date=today)
        
        # Validation: Ensure at least 1 minute has passed since check-in
        if attendance.check_in_time:
            now = timezone.now()
            time_diff = (now - attendance.check_in_time).total_seconds()
            if time_diff < 60:  # Less than 1 minute
                return Response({
                    'error': 'Cannot clock out so soon. Please wait at least 1 minute after clocking in.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        attendance.check_out_time = timezone.now()
        attendance.check_out_device = request.data.get('device', '')
        attendance.check_out_ip = request.META.get('REMOTE_ADDR')
        # Ensure status remains 'present' (in case it was changed)
        if attendance.status not in ['half_day', 'on_leave']:
            attendance.status = 'present'
        attendance.save()

        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)

    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regularize(request, pk):
    def logic():
        user = request.user
        queryset = Attendance.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(employee__company=employee.company)
            else:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        attendance = get_object_or_404(queryset, pk=pk)
        
        # Validate Input
        serializer = AttendanceRegularizationActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Update check-in if provided
        if data.get('check_in_time'):
            # Combine original date with new time
            new_in = datetime.combine(attendance.date, data['check_in_time'])
            attendance.check_in_time = timezone.make_aware(new_in)
        
        # Update check-out if provided
        if data.get('check_out_time'):
            new_out = datetime.combine(attendance.date, data['check_out_time'])
            attendance.check_out_time = timezone.make_aware(new_out)
            
        # Set Regularization Flags
        attendance.is_regularized = True
        attendance.regularization_reason = data['reason']
        
        # If done by employee themselves (self-regularization) logic
        emp_profile = getattr(request.user, 'employee_profile', None)
        if emp_profile:
            attendance.regularized_by = emp_profile
            attendance.regularized_at = timezone.now()
        
        # Ensure status is 'present'
        if attendance.status == 'absent':
            attendance.status = 'present'

        attendance.save() # This triggers model.calculate_hours()
        
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_200_OK)

    return safe_api(logic)


# ================== ATTENDANCE UTILITIES ==================

# ---------------- BREAK MANAGEMENT ----------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_break(request):
    def logic():
        employee_id = request.data.get('employee')
        break_type = request.data.get('break_type', 'short_break')
        
        if not employee_id:
            return Response({'error': 'Employee ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        attendance = Attendance.objects.filter(employee_id=employee_id, date=today).first()
        
        if not attendance:
            return Response({'error': 'No active attendance found for today. Please clock in first.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already on break
        if AttendanceBreak.objects.filter(attendance=attendance, break_end__isnull=True).exists():
            return Response({'error': 'You are already on a break.'}, status=status.HTTP_400_BAD_REQUEST)
        
        break_record = AttendanceBreak.objects.create(
            attendance=attendance,
            break_type=break_type,
            break_start=timezone.now()
        )
        
        return Response({'message': 'Break started successfully', 'id': str(break_record.id)}, status=status.HTTP_201_CREATED)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_break(request):
    def logic():
        employee_id = request.data.get('employee')
        if not employee_id:
            return Response({'error': 'Employee ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        attendance = Attendance.objects.filter(employee_id=employee_id, date=today).first()
        
        if not attendance:
            return Response({'error': 'No attendance record found for today.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find active break
        break_record = AttendanceBreak.objects.filter(attendance=attendance, break_end__isnull=True).first()
        if not break_record:
            return Response({'error': 'No active break found to end.'}, status=status.HTTP_400_BAD_REQUEST)
        
        break_record.break_end = timezone.now()
        break_record.save()
        
        # Recalculate hours
        total_break_minutes = AttendanceBreak.objects.filter(
            attendance=attendance,
            break_end__isnull=False
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        attendance.break_hours = round(total_break_minutes / 60, 2)
        attendance.save() 
        
        return Response({
            'message': 'Break ended successfully',
            'duration_minutes': break_record.duration_minutes,
            'total_break_hours': float(attendance.break_hours)
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)


# ---------------- ATTENDANCE UTILITIES ----------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_mark(request):
    def logic():
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_summary(request):
    def logic():
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_monthly(request):
    def logic():
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    def logic():
        today = timezone.localdate()
        attendance_date = request.query_params.get('date', today)
        
        # Get all employees count
        total_employees = Employee.objects.filter(status='active').count()
        
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offline_employees(request):
    def logic():
        today = timezone.localdate()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 6))
        
        # Get all active employees
        all_employees = Employee.objects.filter(status='active')
        
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def on_break(request):
    def logic():
        # Get employees currently on break (break started but not ended)
        active_breaks = AttendanceBreak.objects.filter(
            break_end__isnull=True
        ).select_related('attendance__employee')
        
        employees_data = []
        for brk in active_breaks:
            employees_data.append({
                'id': str(brk.attendance.employee.id),
                'name': brk.attendance.employee.full_name,
                'employee_id': brk.attendance.employee.employee_id,
                'break_start': brk.break_start,
                'break_type': brk.get_break_type_display()
            })
        
        return Response({
            'count': len(employees_data),
            'employees': employees_data
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overtime_pending(request):
    def logic():
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
    
    return safe_api(logic)


# ---------------- ATTENDANCE ANALYTICS ----------------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def to_validate(request):
    def logic():
        if request.method == 'GET':
            # Get attendance records that need validation
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_data(request):
    def logic():
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
        
        return Response({'error': 'Invalid period'}, status=status.HTTP_400_BAD_REQUEST)
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_overtime(request):
    def logic():
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        # Get overtime by department
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
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_dashboard(request):
    def logic():
        # Check for employee_id override (for Admin viewing employee profile)
        employee_id = request.query_params.get('employee_id')
        if employee_id and (request.user.is_staff or is_client_admin(request.user)):
            # Validate UUID format
            try:
                uuid.UUID(employee_id)
            except ValueError:
                return Response({'error': 'Invalid employee ID format'}, status=status.HTTP_400_BAD_REQUEST)
            
            employee = get_object_or_404(Employee, id=employee_id)
        else:
            employee = getattr(request.user, 'employee_profile', None)
        
        if not employee:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        today = timezone.localdate()
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
            'early_going': attendances.filter(is_early_departure=True).count(),
            'total_hours': attendances.aggregate(Sum('total_hours'))['total_hours__sum'] or 0
        }
        
        # 2. Today's Status
        today_att = Attendance.objects.filter(employee=employee, date=today).first()
        is_on_break = False
        if today_att:
            is_on_break = AttendanceBreak.objects.filter(
                attendance=today_att, 
                break_end__isnull=True
            ).exists()

        today_status = {
            'check_in': today_att.check_in_time if today_att else None,
            'check_out': today_att.check_out_time if today_att else None,
            'status': today_att.status if today_att else 'Not Marked',
            'working_hours': today_att.total_hours if today_att else 0,
            'break_hours': today_att.break_hours if today_att else 0,
            'is_on_break': is_on_break,
            'is_late': today_att.is_late if today_att else False,
            'is_early_departure': today_att.is_early_departure if today_att else False,
            'shift': {
                'name': today_att.shift.name,
                'start_time': today_att.shift.start_time.strftime('%H:%M'),
                'end_time': today_att.shift.end_time.strftime('%H:%M'),
                'grace_period': today_att.shift.grace_period_minutes,
                'early_departure_grace': today_att.shift.early_departure_grace_minutes
            } if today_att and today_att.shift else None
        }
        
        # 3. Monthly Activity (Filtered by month/year)
        recent_logs = Attendance.objects.filter(
            employee=employee,
            date__year=year,
            date__month=month
        ).order_by('-date')
        
        logs_serializer = AttendanceListSerializer(recent_logs, many=True)
        
        # 4. Averages (Current Month)
        from django.db.models.functions import ExtractHour, ExtractMinute
        
        avg_check_in = attendances.exclude(check_in_time__isnull=True).annotate(
            time_in_minutes=ExtractHour('check_in_time') * 60 + ExtractMinute('check_in_time')
        ).aggregate(Avg('time_in_minutes'))['time_in_minutes__avg']
        
        # Convert minutes to HH:MM
        avg_in_str = "09:00" # Default
        if avg_check_in:
            h = int(avg_check_in // 60)
            m = int(avg_check_in % 60)
            avg_in_str = f"{h:02d}:{m:02d}"

        # 5. Policy Settings
        policy = AttendancePolicy.objects.filter(
            Q(department=employee.department) | Q(department__isnull=True),
            company=employee.company,
            is_active=True
        ).first()
        
        track_break_time = policy.track_break_time if policy else True
        enable_shift_system = policy.enable_shift_system if policy else True

        return Response({
            'employee': {
                'id': str(employee.id),
                'name': employee.full_name,
                'code': employee.employee_id
            },
            'stats': stats,
            'today': today_status,
            'recent_logs': logs_serializer.data,
            'averages': {'check_in': avg_in_str},
            'settings': {
                'track_break_time': track_break_time,
                'enable_shift_system': enable_shift_system
            }
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_matrix(request):
    def logic():
        today = date.today()
        month = int(request.query_params.get('month', today.month))
        year = int(request.query_params.get('year', today.year))
        
        # Determine Company
        user = request.user
        company = None
        
        # Using getattr is safer for DRF User proxy/RelatedObjectDoesNotExist
        employee_profile = getattr(user, 'employee_profile', None)
        if employee_profile:
            company = employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
        
        if not company and user.is_superuser:
            # Superusers might not have an employee profile, pick first company for now
            from apps.accounts.models import Organization
            company = Organization.objects.filter(is_active=True).first()

        if not company:
            return Response({'error': 'Company context required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get Employees
        employees = Employee.objects.filter(company=company, status='active').select_related('designation').order_by('first_name')
        
        # Get Attendance
        start_date = date(year, month, 1)
        days_in_m = monthrange(year, month)[1]
        end_date = date(year, month, days_in_m)
        
        attendances = Attendance.objects.filter(
            employee__company=company,
            date__range=(start_date, end_date)
        ).select_related('employee')

        # Fetch Holidays
        holidays_in_month = Holiday.objects.filter(
            company=company,
            date__range=(start_date, end_date),
            is_active=True
        ).values_list('date', flat=True)
        holiday_set = set(holidays_in_month)

        # Fetch Policy for Week Off fallback
        policy = AttendancePolicy.objects.filter(company=company, is_active=True).first()
        policy_week_offs = []
        if policy and policy.working_days != 'custom':
            if policy.working_days == '5_days': policy_week_offs = [5, 6] # Sat, Sun
            elif policy.working_days == '6_days': policy_week_offs = [6] # Sun
        elif policy:
            if not policy.monday: policy_week_offs.append(0)
            if not policy.tuesday: policy_week_offs.append(1)
            if not policy.wednesday: policy_week_offs.append(2)
            if not policy.thursday: policy_week_offs.append(3)
            if not policy.friday: policy_week_offs.append(4)
            if not policy.saturday: policy_week_offs.append(5)
            if not policy.sunday: policy_week_offs.append(6)

        # Fetch Default Shift (Priority 2 before Policy)
        default_shift = Shift.objects.filter(company=company, is_default=True, is_active=True).first()
        default_working_days = set(default_shift.working_days) if default_shift else set()

        # Fetch Shift Assignments (Priority 1)
        shift_assignments = EmployeeShiftAssignment.objects.filter(
            employee__company=company,
            is_active=True
        ).select_related('shift')
        
        # Map: emp_id -> set of working day indices (0-6)
        emp_working_days = {}
        for sa in shift_assignments:
            eid = str(sa.employee_id)
            # Shift.working_days is a JSONField list of indices
            emp_working_days[eid] = set(sa.shift.working_days)
        
        # Build Layout
        # Map: emp_id -> { day: status }
        att_map = {}
        for att in attendances:
            eid = str(att.employee.id)
            day = att.date.day
            code = ''
            
            # Priority mapping
            if att.status == 'present':
                code = 'P'
                if att.is_late:
                    code = '!' # Mark late as a conflict/warning for now
            elif att.status == 'half_day':
                code = 'H'
            elif att.status == 'on_leave':
                code = 'L'
            elif att.status == 'absent':
                code = 'A'
            elif att.status == 'holiday' or att.status == 'week_off':
                code = 'O' # Off
            elif att.status == 'work_from_home':
                code = 'P' # WFH is Present
            else:
                # Fallback to first letter
                code = att.status[:1].upper() if att.status else ''
            
            if eid not in att_map: att_map[eid] = {}
            att_map[eid][day] = code

        # Construct Result
        result_employees = []
        for emp in employees:
            eid = str(emp.id)
            emp_att = att_map.get(eid, {})
            
            status_array = []
            p_count = 0
            a_count = 0
            h_count = 0
            
            for d in range(1, days_in_m + 1):
                s = emp_att.get(d, '')
                
                # If No Attendance Record, check for Off/Holiday
                if s == '':
                    curr_date = date(year, month, d)
                    if curr_date in holiday_set:
                        s = 'O' # Holiday
                    else:
                        # Check Week Off
                        weekday = curr_date.weekday() # 0=Mon, 6=Sun
                        
                        # Use shift-specific working days if assigned
                        if eid in emp_working_days:
                            if weekday not in emp_working_days[eid]:
                                s = 'O' # Assigned Shift Off
                        elif default_working_days:
                            # Use company default shift if no specific assignment
                            if weekday not in default_working_days:
                                s = 'O' # Default Shift Off
                        else:
                            # Final fallback to company policy week offs
                            if weekday in policy_week_offs:
                                s = 'O' # Policy Off
                
                status_array.append(s)
                if s == 'P' or s == '!': p_count += 1
                elif s == 'A': a_count += 1
                elif s == 'H': h_count += 1
                elif s == 'L' or s == 'O': pass # Leave/Off days
                
            result_employees.append({
                'id': eid,
                'name': emp.full_name,
                'employee_id': emp.employee_id,
                'meta': emp.designation.name if emp.designation else 'Employee',
                'stats': {'P': p_count, 'A': a_count, 'H': h_count},
                'status': status_array
            })
            
        return Response({
            'employees': result_employees,
            'days_in_month': days_in_m
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)





# ================== HOLIDAYS ==================



# ================== HOLIDAYS ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def holiday_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            include_deleted = request.query_params.get('include_deleted', 'false').lower() == 'true'
            queryset = Holiday.objects.select_related('company')
            if not include_deleted:
                queryset = queryset.filter(is_active=True)
            
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company = user.employee_profile.company
                if company:
                    queryset = queryset.filter(company=company)
            elif hasattr(user, 'organization') and user.organization:
                queryset = queryset.filter(company=user.organization)
            else:
                return Response([], status=status.HTTP_200_OK)
                
            serializer = HolidaySerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            company = None
            if hasattr(user, 'employee_profile') and user.employee_profile:
                company = user.employee_profile.company
            elif hasattr(user, 'organization') and user.organization:
                company = user.organization
            
            if not company:
                return Response({'error': 'Could not determine company for current user.'}, status=status.HTTP_400_BAD_REQUEST)
                
            serializer = HolidaySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def holiday_detail(request, pk):
    def logic():
        user = request.user
        queryset = Holiday.objects.all()
        if hasattr(user, 'employee_profile') and user.employee_profile:
            queryset = queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            queryset = queryset.filter(company=user.organization)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = HolidaySerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = HolidaySerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            # Soft delete
            instance.is_active = False
            instance.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def holiday_restore(request, pk):
    def logic():
        user = request.user
        queryset = Holiday.objects.all()
        if hasattr(user, 'employee_profile') and user.employee_profile:
            queryset = queryset.filter(company=user.employee_profile.company)
        elif hasattr(user, 'organization') and user.organization:
            queryset = queryset.filter(company=user.organization)
        
        instance = get_object_or_404(queryset, pk=pk)
        instance.is_active = True
        instance.save()
        serializer = HolidaySerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def holiday_delete_all(request):
    def logic():
        user = request.user
        queryset = Holiday.objects.filter(is_active=True)
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
            if company:
                queryset = queryset.filter(company=company)
        elif hasattr(user, 'organization') and user.organization:
            queryset = queryset.filter(company=user.organization)
        else:
            return Response({'error': 'Could not determine company for current user.'}, status=status.HTTP_400_BAD_REQUEST)
            
        count = queryset.count()
        queryset.update(is_active=False)
        return Response({'message': f'Successfully deleted {count} holidays.'}, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def holiday_upcoming(request):
    def logic():
        company_id = request.query_params.get('company')
        holidays = Holiday.objects.filter(date__gte=date.today(), is_active=True)
        if company_id:
            holidays = holidays.filter(company_id=company_id)
        serializer = HolidaySerializer(holidays[:10], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def holiday_preview(request):
    def logic():
        year = request.data.get('year')
        country = request.data.get('country', 'IN')
        include_national = request.data.get('include_national', True)
        states = request.data.get('states', [])

        if not year:
            return Response({'error': 'Year is required'}, status=status.HTTP_400_BAD_REQUEST)

        if country == 'IN':
            holidays = get_indian_holidays(year, states, include_national)
        else:
            holidays = []

        return Response({
            'holidays': holidays,
            'total': len(holidays)
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def holiday_import(request):
    def logic():
        year = request.data.get('year')
        country = request.data.get('country', 'IN')
        include_national = request.data.get('include_national', True)
        states = request.data.get('states', [])

        if not year:
            return Response({'error': 'Year is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization

        if not company:
            return Response({'error': 'Could not determine company for current user'}, status=status.HTTP_400_BAD_REQUEST)

        holiday_previews = []
        if country == 'IN':
            holiday_previews = get_indian_holidays(year, states, include_national)

        holidays_to_create = []
        created_count = 0
        skipped_count = 0

        for h_data in holiday_previews:
            holiday_date = datetime.strptime(h_data['date'], '%Y-%m-%d').date()
            existing = Holiday.objects.filter(company=company, date=holiday_date, name=h_data['name']).first()

            if existing:
                if not existing.is_active:
                    existing.is_active = True
                    existing.holiday_type = h_data['type']
                    existing.description = h_data['description']
                    existing.save()
                    created_count += 1
                else:
                    skipped_count += 1
            else:
                holidays_to_create.append(Holiday(
                    company=company,
                    name=h_data['name'],
                    date=holiday_date,
                    holiday_type=h_data['type'],
                    description=h_data['description'],
                    is_active=True
                ))
                created_count += 1

        if holidays_to_create:
            Holiday.objects.bulk_create(holidays_to_create)

        return Response({
            'message': 'Holidays imported successfully',
            'created': created_count,
            'skipped': skipped_count,
            'total': created_count + skipped_count
        }, status=status.HTTP_201_CREATED)
    
    return safe_api(logic)


# ================== ATTENDANCE SUMMARY ==================

# ================== ATTENDANCE SUMMARY ==================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary_list(request):
    def logic():
        user = request.user
        queryset = AttendanceSummary.objects.select_related('employee').order_by('-year', '-month')
        
        # Filter by company context
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
            if company:
                queryset = queryset.filter(employee__company=company)
        elif hasattr(user, 'organization') and user.organization:
            queryset = queryset.filter(employee__company=user.organization)
        
        # Manual filtering
        emp_id = request.query_params.get('employee')
        if emp_id: queryset = queryset.filter(employee_id=emp_id)
        
        year = request.query_params.get('year')
        if year: queryset = queryset.filter(year=year)
        
        month = request.query_params.get('month')
        if month: queryset = queryset.filter(month=month)
        
        is_finalized = request.query_params.get('is_finalized')
        if is_finalized is not None:
             queryset = queryset.filter(is_finalized=is_finalized.lower() == 'true')

        serializer = AttendanceSummarySerializer(queryset, many=True)
        return Response(serializer.data)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_monthly_summary(request):
    def logic():
        employee_id = request.data.get('employee')
        year = request.data.get('year')
        month = request.data.get('month')

        if not employee_id or not year or not month:
            return Response({'error': 'employee, year, and month are required'}, status=status.HTTP_400_BAD_REQUEST)

        year = int(year)
        month = int(month)
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
    
    return safe_api(logic)


# ================== ATTENDANCE REGULARIZATION REQUEST ==================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def regularization_request_list(request):
    def logic():
        user = request.user
        if request.method == 'GET':
            queryset = AttendanceRegularizationRequest.objects.select_related('employee', 'attendance', 'reviewed_by').order_by('-created_at')
            
            # Company filtering
            if not user.is_superuser:
                employee = getattr(user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(employee__company=employee.company)
            
            # Manual filters
            status_val = request.query_params.get('status')
            if status_val: queryset = queryset.filter(status=status_val)
            
            req_type = request.query_params.get('request_type')
            if req_type: queryset = queryset.filter(request_type=req_type)
            
            emp_id = request.query_params.get('employee')
            if emp_id: queryset = queryset.filter(employee_id=emp_id)

            serializer = AttendanceRegularizationSerializer(queryset, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            serializer = AttendanceRegularizationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    return safe_api(logic)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def regularization_request_detail(request, pk):
    def logic():
        user = request.user
        queryset = AttendanceRegularizationRequest.objects.all()
        if not user.is_superuser:
            employee = getattr(user, 'employee_profile', None)
            if employee:
                queryset = queryset.filter(employee__company=employee.company)
        
        instance = get_object_or_404(queryset, pk=pk)

        if request.method == 'GET':
            serializer = AttendanceRegularizationSerializer(instance)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = AttendanceRegularizationSerializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    return safe_api(logic)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def regularization_pending(request):
    def logic():
        pending_requests = AttendanceRegularizationRequest.objects.filter(
            status='pending'
        ).select_related('employee', 'attendance', 'reviewed_by')
        
        serializer = AttendanceRegularizationSerializer(pending_requests, many=True)
        return Response({
            'count': pending_requests.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regularization_approve(request, pk):
    def logic():
        queryset = AttendanceRegularizationRequest.objects.all()
        instance = get_object_or_404(queryset, pk=pk)
        
        if instance.status != 'pending':
            return Response({'error': 'Only pending requests can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.status = 'approved'
        # Get current user's employee profile for reviewer field
        instance.reviewed_by = getattr(request.user, 'employee_profile', None)
        instance.reviewed_at = timezone.now()
        instance.reviewer_comments = request.data.get('comments', '')
        instance.save()
        
        # Update original attendance
        attendance = instance.attendance
        if instance.requested_check_in:
            attendance.check_in_time = instance.requested_check_in
        if instance.requested_check_out:
            attendance.check_out_time = instance.requested_check_out
        attendance.save()
        
        serializer = AttendanceRegularizationSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return safe_api(logic)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regularization_reject(request, pk):
    def logic():
        queryset = AttendanceRegularizationRequest.objects.all()
        instance = get_object_or_404(queryset, pk=pk)
        
        if instance.status != 'pending':
            return Response({'error': 'Only pending requests can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        instance.status = 'rejected'
        instance.reviewed_by = getattr(request.user, 'employee_profile', None)
        instance.reviewed_at = timezone.now()
        instance.reviewer_comments = request.data.get('comments', '')
        instance.save()
        
        serializer = AttendanceRegularizationSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return safe_api(logic)
