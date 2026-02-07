import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import DocumentRequest, ShiftRequest, WorkTypeRequest, ReimbursementRequest, EncashmentRequest
from .serializers import (
    DocumentRequestSerializer, ShiftRequestSerializer, WorkTypeRequestSerializer,
    ReimbursementRequestSerializer, EncashmentRequestSerializer
)
from apps.accounts.models import Employee, Organization
from apps.accounts.utils import get_employee_or_none, get_employee_org_id
from apps.audit.utils import log_activity

logger = logging.getLogger(__name__)

def safe_api(fn):
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            logger.exception(e)
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    return wrapper

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def document_request_list(request):
    """List or create document requests with organization isolation"""
    @safe_api
    def logic():
        employee = get_employee_or_none(request.user)
        user_company_id = employee.company_id if employee else None

        if not user_company_id and not request.user.is_superuser:
            return Response({'error': 'Employee profile or organization not found'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            queryset = DocumentRequest.objects.select_related('employee', 'approver').order_by('-created_at')
            
            # Apply Isolation
            if user_company_id:
                queryset = queryset.filter(employee__company_id=user_company_id)
            
            # Additional Filters
            direction = request.query_params.get('direction')
            if direction:
                queryset = queryset.filter(direction=direction)
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            emp_id = request.query_params.get('employee')
            if emp_id:
                queryset = queryset.filter(employee_id=emp_id)
            
            serializer = DocumentRequestSerializer(queryset, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            # Auto-assign employee from current user if not provided, or verify if admin is creating for someone else
            data = request.data.copy()
            if 'employee' not in data and employee:
                data['employee'] = str(employee.id)
            
            serializer = DocumentRequestSerializer(data=data)
            if serializer.is_valid():
                # Verify the employee belongs to the same organization
                target_emp = serializer.validated_data.get('employee')
                if user_company_id and target_emp.company_id != user_company_id:
                    return Response({'error': 'Cannot create request for employee in another organization'}, status=status.HTTP_403_FORBIDDEN)
                
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return logic()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_document(request, pk):
    """Submit a document for a request with isolation check"""
    @safe_api
    def logic():
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        
        # Isolation check
        org_id = get_employee_org_id(request.user)
        if org_id and doc_request.employee.company_id != org_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        document_file = request.FILES.get('document_file')
        if not document_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        doc_request.document_file = document_file
        doc_request.submitted_at = timezone.now()

        if doc_request.direction == 'admin_to_employee':
            doc_request.status = 'pending'
        elif doc_request.direction == 'employee_to_admin':
            doc_request.status = 'approved'
            doc_request.approver = request.user
        
        doc_request.updated_by = request.user
        doc_request.save()
        
        return Response({
            'success': True,
            'message': 'Document submitted successfully',
            'status': doc_request.status,
            'document_url': doc_request.document_file.url if doc_request.document_file else None
        })
    return logic()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_document_request(request, pk):
    """Approve a document request with isolation check"""
    @safe_api
    def logic():
        from apps.accounts.models import EmployeeDocument
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        
        org_id = get_employee_org_id(request.user)
        if org_id and doc_request.employee.company_id != org_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            
        if doc_request.status == 'approved':
             return Response({'success': True, 'message': 'Request already approved'})
             
        doc_request.status = 'approved'
        doc_request.approver = request.user
        doc_request.updated_by = request.user
        doc_request.save()
        
        if doc_request.document_file:
            EmployeeDocument.objects.create(
                employee=doc_request.employee,
                document_type=doc_request.document_type,
                title=f"{doc_request.document_type} (Approved)",
                document_file=doc_request.document_file,
                is_verified=True,
                created_by=request.user,
                company_id=org_id # Ensure organization is set
            )
        
        
        log_activity(
            user=request.user,
            action_type='APPROVE',
            module='REQUESTS',
            description=f"Approved document request: {doc_request.document_type} for {doc_request.employee.full_name}",
            reference_id=str(doc_request.id)
        )
        
        return Response({'success': True, 'message': 'Request approved'})
    return logic()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_document_request(request, pk):
    """Reject a document request with isolation check"""
    @safe_api
    def logic():
        doc_request = get_object_or_404(DocumentRequest, pk=pk)
        
        org_id = get_employee_org_id(request.user)
        if org_id and doc_request.employee.company_id != org_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        doc_request.status = 'rejected'
        doc_request.approver = request.user
        doc_request.rejection_reason = request.data.get('reason', '')
        doc_request.updated_by = request.user
        doc_request.save()
        
        log_activity(
            user=request.user,
            action_type='REJECT',
            module='REQUESTS',
            description=f"Rejected document request: {doc_request.document_type} for {doc_request.employee.full_name}",
            reference_id=str(doc_request.id),
            new_value={'reason': doc_request.rejection_reason}
        )
        
        return Response({'success': True, 'message': 'Request rejected'})
    return logic()

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def shift_request_list(request):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        if request.method == 'GET':
            queryset = ShiftRequest.objects.select_related('employee').all()
            if org_id:
                queryset = queryset.filter(employee__company_id=org_id)
            serializer = ShiftRequestSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = ShiftRequestSerializer(data=request.data)
            if serializer.is_valid():
                if org_id and serializer.validated_data['employee'].company_id != org_id:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return logic()

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def work_type_request_list(request):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        if request.method == 'GET':
            queryset = WorkTypeRequest.objects.select_related('employee').all()
            if org_id:
                queryset = queryset.filter(employee__company_id=org_id)
            serializer = WorkTypeRequestSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = WorkTypeRequestSerializer(data=request.data)
            if serializer.is_valid():
                if org_id and serializer.validated_data['employee'].company_id != org_id:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return logic()

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def reimbursement_request_list(request):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        if request.method == 'GET':
            queryset = ReimbursementRequest.objects.select_related('employee').all()
            if org_id:
                queryset = queryset.filter(employee__company_id=org_id)
            
            # Filters
            emp_id = request.query_params.get('employee')
            if emp_id: queryset = queryset.filter(employee_id=emp_id)
            status_f = request.query_params.get('status')
            if status_f: queryset = queryset.filter(status=status_f)
            
            serializer = ReimbursementRequestSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = ReimbursementRequestSerializer(data=request.data)
            if serializer.is_valid():
                if org_id and serializer.validated_data['employee'].company_id != org_id:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return logic()

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def reimbursement_request_detail(request, pk):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        instance = get_object_or_404(ReimbursementRequest, pk=pk)
        if org_id and instance.employee.company_id != org_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            serializer = ReimbursementRequestSerializer(instance)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = ReimbursementRequestSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    return logic()

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def encashment_request_list(request):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        if request.method == 'GET':
            queryset = EncashmentRequest.objects.select_related('employee', 'leave_type').all()
            if org_id:
                queryset = queryset.filter(employee__company_id=org_id)
            
            emp_id = request.query_params.get('employee')
            if emp_id: queryset = queryset.filter(employee_id=emp_id)
            status_f = request.query_params.get('status')
            if status_f: queryset = queryset.filter(status=status_f)
            
            serializer = EncashmentRequestSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = EncashmentRequestSerializer(data=request.data)
            if serializer.is_valid():
                if org_id and serializer.validated_data['employee'].company_id != org_id:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return logic()

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def encashment_request_detail(request, pk):
    @safe_api
    def logic():
        org_id = get_employee_org_id(request.user)
        instance = get_object_or_404(EncashmentRequest, pk=pk)
        if org_id and instance.employee.company_id != org_id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            serializer = EncashmentRequestSerializer(instance)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = EncashmentRequestSerializer(instance, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    return logic()
