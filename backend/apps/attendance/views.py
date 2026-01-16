from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Avg
from datetime import date, timedelta
from .models import Shift, Attendance, Holiday
from .serializers import (
    ShiftSerializer, AttendanceSerializer, AttendanceDetailSerializer,
    BulkAttendanceSerializer, HolidaySerializer
)


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related('company').all()
    serializer_class = ShiftSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'is_active', 'is_night_shift']
    search_fields = ['name', 'code']


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee', 'shift').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'date', 'status', 'is_late']
    search_fields = ['employee__employee_id', 'employee__first_name']
    ordering_fields = ['date', 'employee']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AttendanceDetailSerializer
        return AttendanceSerializer
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Mark attendance for multiple employees at once"""
        serializer = BulkAttendanceSerializer(data=request.data)
        if serializer.is_valid():
            attendance_date = serializer.validated_data['date']
            employee_ids = serializer.validated_data['employees']
            attendance_status = serializer.validated_data['status']
            remarks = serializer.validated_data.get('remarks', '')
            
            created = []
            for emp_id in employee_ids:
                att, was_created = Attendance.objects.get_or_create(
                    employee_id=emp_id,
                    date=attendance_date,
                    defaults={
                        'status': attendance_status,
                        'remarks': remarks
                    }
                )
                if not was_created:
                    att.status = attendance_status
                    att.remarks = remarks
                    att.save()
                created.append(att.id)
            
            return Response({
                'message': f'Attendance marked for {len(created)} employees',
                'ids': created
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """Get attendance summary for a date"""
        attendance_date = request.query_params.get('date', date.today().isoformat())
        
        summary = Attendance.objects.filter(date=attendance_date).aggregate(
            total=Count('id'),
            present=Count('id', filter=models.Q(status='present')),
            absent=Count('id', filter=models.Q(status='absent')),
            half_day=Count('id', filter=models.Q(status='half_day')),
            on_leave=Count('id', filter=models.Q(status='on_leave')),
            late=Count('id', filter=models.Q(is_late=True)),
        )
        
        return Response({
            'date': attendance_date,
            'summary': summary
        })
    
    @action(detail=False, methods=['get'])
    def employee_monthly(self, request):
        """Get monthly attendance for an employee"""
        employee_id = request.query_params.get('employee')
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        if not employee_id:
            return Response({'error': 'employee parameter required'}, status=400)
        
        attendances = Attendance.objects.filter(
            employee_id=employee_id,
            date__month=month,
            date__year=year
        ).order_by('date')
        
        serializer = AttendanceSerializer(attendances, many=True)
        
        # Summary
        summary = {
            'present': attendances.filter(status='present').count(),
            'absent': attendances.filter(status='absent').count(),
            'half_day': attendances.filter(status='half_day').count(),
            'on_leave': attendances.filter(status='on_leave').count(),
            'late_days': attendances.filter(is_late=True).count(),
            'total_work_hours': sum(a.work_hours for a in attendances),
        }
        
        return Response({
            'records': serializer.data,
            'summary': summary
        })


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.select_related('company').all()
    serializer_class = HolidaySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'is_optional', 'date']
    search_fields = ['name']
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming holidays"""
        company = request.query_params.get('company')
        holidays = self.queryset.filter(date__gte=date.today())
        if company:
            holidays = holidays.filter(company_id=company)
        
        serializer = self.get_serializer(holidays[:10], many=True)
        return Response(serializer.data)
