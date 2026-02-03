from rest_framework import serializers
from .models import BiometricDevice, BiometricLog

class BiometricDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricDevice
        fields = '__all__'

class BiometricLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = BiometricLog
        fields = '__all__'
