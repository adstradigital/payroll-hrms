from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import DocumentRequest, ShiftRequest, WorkTypeRequest
from .serializers import DocumentRequestSerializer, ShiftRequestSerializer, WorkTypeRequestSerializer
from apps.accounts.models import Employee


class DocumentRequestListCreate(generics.ListCreateAPIView):
    """
    List and create document requests.
    Supports filtering by:
    - direction: 'admin_to_employee' or 'employee_to_admin'
    - status: 'pending', 'approved', 'rejected'
    - employee: employee ID
    """
    serializer_class = DocumentRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DocumentRequest.objects.select_related('employee', 'approver').order_by('-created_at')
        
        # Filter by direction
        direction = self.request.query_params.get('direction')
        if direction:
            queryset = queryset.filter(direction=direction)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by employee
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        return queryset

    def perform_create(self, serializer):
        # Set created_by if available
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_document(request, pk):
    """
    Submit a document for a request.
    - If admin_to_employee: Employee submits the doc -> Status becomes Pending (for admin verify)
    - If employee_to_admin: Admin provides the doc -> Status becomes Approved
    """
    try:
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        
        # Get the uploaded file
        document_file = request.FILES.get('document_file')
        if not document_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        doc_request.document_file = document_file
        doc_request.submitted_at = timezone.now()

        # Logic based on direction
        if doc_request.direction == 'admin_to_employee':
            # Employee submitting requested doc
            doc_request.status = 'pending'  # Reset to pending for admin review
        elif doc_request.direction == 'employee_to_admin':
            # Admin providing requested doc
            doc_request.status = 'approved'
            doc_request.approver = request.user
        
        doc_request.save()
        
        return Response({
            'success': True,
            'message': 'Document submitted successfully',
            'submitted_at': doc_request.submitted_at,
            'status': doc_request.status,
            'document_url': doc_request.document_file.url if doc_request.document_file else None
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_document_request(request, pk):
    """Approve a document request and copy file to Employee Profile"""
    from apps.accounts.models import EmployeeDocument  # Import here to avoid circular dependency
    
    try:
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        
        # Prevent duplicates
        if doc_request.status == 'approved':
             return Response({'success': True, 'message': 'Request already approved'})
             
        doc_request.status = 'approved'
        doc_request.approver = request.user
        doc_request.save()
        
        # If there is a file, create an EmployeeDocument entry
        if doc_request.document_file:
            # Map request direction to document type category if needed
            # For now, just use the requested type
            
            EmployeeDocument.objects.create(
                employee=doc_request.employee,
                document_type=doc_request.document_type, # Ensure this matches choices or is generic
                title=f"{doc_request.document_type} (Approved)",
                document_file=doc_request.document_file,
                description=f"Approved by {request.user} on {timezone.now().date()}",
                issue_date=timezone.now().date(),
                is_verified=True,
                created_by=request.user
            )
        
        return Response({'success': True, 'message': 'Request approved and document added to profile'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_document_request(request, pk):
    """Reject a document request"""
    try:
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        doc_request.status = 'rejected'
        doc_request.approver = request.user
        doc_request.rejection_reason = request.data.get('reason', '')
        doc_request.save()
        
        return Response({'success': True, 'message': 'Request rejected'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ShiftRequestListCreate(generics.ListCreateAPIView):
    queryset = ShiftRequest.objects.all()
    serializer_class = ShiftRequestSerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkTypeRequestListCreate(generics.ListCreateAPIView):
    queryset = WorkTypeRequest.objects.all()
    serializer_class = WorkTypeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
