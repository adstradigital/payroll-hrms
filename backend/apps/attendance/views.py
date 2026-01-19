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
