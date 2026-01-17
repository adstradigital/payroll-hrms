from rest_framework import serializers
from .models import *

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"


class EmployeeShiftAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeShiftAssignment
        fields = "__all__"


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"


class AttendanceDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = "__all__"


class BulkAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    employees = serializers.ListField(child=serializers.UUIDField())
    status = serializers.ChoiceField(choices=Attendance.STATUS_CHOICES)
    remarks = serializers.CharField(required=False, allow_blank=True)


class AttendancePunchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePunch
        fields = "__all__"


class AttendanceRegularizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRegularization
        fields = "__all__"


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"


class AttendanceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSummary
        fields = "__all__"
