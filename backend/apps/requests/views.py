from rest_framework import generics, permissions
from .models import DocumentRequest, ShiftRequest, WorkTypeRequest
from .serializers import DocumentRequestSerializer, ShiftRequestSerializer, WorkTypeRequestSerializer

class DocumentRequestListCreate(generics.ListCreateAPIView):
    queryset = DocumentRequest.objects.all()
    serializer_class = DocumentRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

class ShiftRequestListCreate(generics.ListCreateAPIView):
    queryset = ShiftRequest.objects.all()
    serializer_class = ShiftRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

class WorkTypeRequestListCreate(generics.ListCreateAPIView):
    queryset = WorkTypeRequest.objects.all()
    serializer_class = WorkTypeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
