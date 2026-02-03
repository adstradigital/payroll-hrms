from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import BiometricDevice, BiometricLog
from .serializers import BiometricDeviceSerializer, BiometricLogSerializer
from .services import BiometricService

class BiometricDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = BiometricDeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BiometricDevice.objects.filter(company__employees__user=self.request.user).distinct()

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        success, message = BiometricService.test_connection(pk)
        return Response({
            'status': 'success' if success else 'error',
            'message': message
        })

    @action(detail=True, methods=['post'])
    def sync_logs(self, request, pk=None):
        count, message = BiometricService.fetch_logs(pk)
        if count > 0 or "Successfully" in message:
            # Automatically trigger processing after fetch
            device = self.get_object()
            processed = BiometricService.process_logs(device.company_id)
            message += f" and processed {processed} logs into attendance."
            
        return Response({
            'status': 'success',
            'message': message,
            'new_logs': count
        })

    @action(detail=False, methods=['post'])
    def sync_all(self, request):
        devices = self.get_queryset().filter(is_active=True)
        results = []
        total_new = 0
        
        for device in devices:
            count, msg = BiometricService.fetch_logs(device.id)
            if count > 0:
                BiometricService.process_logs(device.company_id)
            total_new += count
            results.append({'device': device.name, 'new_logs': count})
            
        return Response({
            'status': 'success',
            'total_new_logs': total_new,
            'details': results
        })

class BiometricLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BiometricLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BiometricLog.objects.filter(device__company__employees__user=self.request.user).distinct()
