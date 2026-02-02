from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ActivityLog
from .serializers import ActivityLogSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activity logs to be viewed.
    """
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated] # Should be restricted to Admin/Auditor in production
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action_type', 'module', 'status', 'user', 'reference_id']
    search_fields = ['description', 'reference_id', 'ip_address']
    ordering_fields = ['timestamp', 'action_type', 'module', 'status']
    ordering = ['-timestamp']

    def get_queryset(self):
        # In a real multi-tenant app, filter by organization here
        return super().get_queryset()
