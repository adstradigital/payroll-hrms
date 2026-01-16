from rest_framework import serializers
from .models import Shift, Attendance, Holiday
from apps.core.serializers import EmployeeListSerializer


class ShiftSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    working_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Shift
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class AttendanceDetailSerializer(serializers.ModelSerializer):
    employee = EmployeeListSerializer(read_only=True)
    shift = ShiftSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class BulkAttendanceSerializer(serializers.Serializer):
    """For marking attendance for multiple employees at once"""
    date = serializers.DateField()
    employees = serializers.ListField(child=serializers.IntegerField())
    status = serializers.ChoiceField(choices=Attendance.STATUS_CHOICES)
    remarks = serializers.CharField(required=False, allow_blank=True)


class HolidaySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Holiday
        fields = '__all__'
