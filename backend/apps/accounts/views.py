from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.core.exceptions import ValidationError as DjangoValidationError
import logging

from .models import (
    Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience
)
from .serializers import (
    CompanyListSerializer, CompanyDetailSerializer,
    DepartmentListSerializer, DepartmentDetailSerializer,
    DesignationListSerializer, DesignationDetailSerializer,
    EmployeeListSerializer, EmployeeDetailSerializer,
    EmployeeDocumentSerializer, EmployeeEducationSerializer,
    EmployeeExperienceSerializer, EmployeeWithRelationsSerializer
)

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==================== COMPANY VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def company_list_create(request):
    """
    GET: List all companies with filters
    POST: Create a new company
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            
            # Build queryset
            queryset = Company.objects.all()
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(gstin__icontains=search)
                )
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = CompanyListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = CompanyDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Company created: {serializer.data['name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in company_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def company_detail(request, pk):
    """
    GET: Retrieve company details
    PUT/PATCH: Update company
    DELETE: Delete company
    """
    try:
        company = get_object_or_404(Company, pk=pk)
        
        if request.method == 'GET':
            serializer = CompanyDetailSerializer(company)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = CompanyDetailSerializer(company, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Company updated: {company.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            company_name = company.name
            company.delete()
            logger.info(f"Company deleted: {company_name} by {request.user.username}")
            return Response(
                {'message': 'Company deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in company_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== DEPARTMENT VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_list_create(request):
    """
    GET: List all departments with filters
    POST: Create a new department
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            company_id = request.query_params.get('company', None)
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            parent = request.query_params.get('parent', None)
            
            # Build queryset
            queryset = Department.objects.select_related('company', 'parent', 'head')
            
            # Apply filters
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(code__icontains=search)
                )
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            if parent:
                if parent.lower() == 'null':
                    queryset = queryset.filter(parent__isnull=True)
                else:
                    queryset = queryset.filter(parent_id=parent)
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = DepartmentListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = DepartmentDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Department created: {serializer.data['name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in department_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def department_detail(request, pk):
    """
    GET: Retrieve department details
    PUT/PATCH: Update department
    DELETE: Delete department
    """
    try:
        department = get_object_or_404(Department, pk=pk)
        
        if request.method == 'GET':
            serializer = DepartmentDetailSerializer(department)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = DepartmentDetailSerializer(department, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Department updated: {department.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            dept_name = department.name
            department.delete()
            logger.info(f"Department deleted: {dept_name} by {request.user.username}")
            return Response(
                {'message': 'Department deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in department_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== DESIGNATION VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def designation_list_create(request):
    """
    GET: List all designations with filters
    POST: Create a new designation
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            company_id = request.query_params.get('company', None)
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            level = request.query_params.get('level', None)
            
            # Build queryset
            queryset = Designation.objects.select_related('company')
            
            # Apply filters
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(code__icontains=search)
                )
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            if level:
                queryset = queryset.filter(level=level)
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = DesignationListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = DesignationDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Designation created: {serializer.data['name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in designation_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def designation_detail(request, pk):
    """
    GET: Retrieve designation details
    PUT/PATCH: Update designation
    DELETE: Delete designation
    """
    try:
        designation = get_object_or_404(Designation, pk=pk)
        
        if request.method == 'GET':
            serializer = DesignationDetailSerializer(designation)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = DesignationDetailSerializer(designation, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Designation updated: {designation.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            desig_name = designation.name
            designation.delete()
            logger.info(f"Designation deleted: {desig_name} by {request.user.username}")
            return Response(
                {'message': 'Designation deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in designation_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== EMPLOYEE VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_create(request):
    """
    GET: List all employees with filters
    POST: Create a new employee
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            company_id = request.query_params.get('company', None)
            department_id = request.query_params.get('department', None)
            designation_id = request.query_params.get('designation', None)
            search = request.query_params.get('search', None)
            status_filter = request.query_params.get('status', None)
            employment_type = request.query_params.get('employment_type', None)
            
            # Build queryset with select_related for optimization
            queryset = Employee.objects.select_related(
                'company', 'department', 'designation', 'reporting_manager', 'user'
            )
            
            # Apply filters
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            
            if department_id:
                queryset = queryset.filter(department_id=department_id)
            
            if designation_id:
                queryset = queryset.filter(designation_id=designation_id)
            
            if search:
                queryset = queryset.filter(
                    Q(employee_id__icontains=search) |
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone__icontains=search)
                )
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if employment_type:
                queryset = queryset.filter(employment_type=employment_type)
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = EmployeeListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = EmployeeDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Employee created: {serializer.data['employee_id']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in employee_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    """
    GET: Retrieve employee details
    PUT/PATCH: Update employee
    DELETE: Delete employee
    """
    try:
        employee = get_object_or_404(
            Employee.objects.select_related(
                'company', 'department', 'designation', 'reporting_manager', 'user'
            ),
            pk=pk
        )
        
        if request.method == 'GET':
            # Check if detailed view is requested
            include_relations = request.query_params.get('include_relations', 'false').lower() == 'true'
            
            if include_relations:
                serializer = EmployeeWithRelationsSerializer(employee)
            else:
                serializer = EmployeeDetailSerializer(employee)
            
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeDetailSerializer(employee, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Employee updated: {employee.employee_id} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            emp_id = employee.employee_id
            employee.delete()
            logger.info(f"Employee deleted: {emp_id} by {request.user.username}")
            return Response(
                {'message': 'Employee deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in employee_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== EMPLOYEE DOCUMENT VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_document_list_create(request, employee_id):
    """
    GET: List all documents for an employee
    POST: Create a new document for an employee
    """
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            documents = EmployeeDocument.objects.filter(employee=employee)
            document_type = request.query_params.get('document_type', None)
            
            if document_type:
                documents = documents.filter(document_type=document_type)
            
            serializer = EmployeeDocumentSerializer(documents, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['employee'] = employee.id
            
            serializer = EmployeeDocumentSerializer(data=data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Document created for employee: {employee.employee_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in employee_document_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_document_detail(request, employee_id, pk):
    """
    GET: Retrieve document details
    PUT/PATCH: Update document
    DELETE: Delete document
    """
    try:
        document = get_object_or_404(EmployeeDocument, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            serializer = EmployeeDocumentSerializer(document)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeDocumentSerializer(document, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Document updated: {document.title}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            doc_title = document.title
            document.delete()
            logger.info(f"Document deleted: {doc_title}")
            return Response(
                {'message': 'Document deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in employee_document_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== EMPLOYEE EDUCATION VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_education_list_create(request, employee_id):
    """
    GET: List all education records for an employee
    POST: Create a new education record
    """
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            education = EmployeeEducation.objects.filter(employee=employee)
            serializer = EmployeeEducationSerializer(education, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['employee'] = employee.id
            
            serializer = EmployeeEducationSerializer(data=data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Education record created for employee: {employee.employee_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in employee_education_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_education_detail(request, employee_id, pk):
    """Education detail operations"""
    try:
        education = get_object_or_404(EmployeeEducation, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            serializer = EmployeeEducationSerializer(education)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeEducationSerializer(education, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            education.delete()
            return Response(
                {'message': 'Education record deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in employee_education_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== EMPLOYEE EXPERIENCE VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_experience_list_create(request, employee_id):
    """
    GET: List all experience records for an employee
    POST: Create a new experience record
    """
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            experience = EmployeeExperience.objects.filter(employee=employee)
            serializer = EmployeeExperienceSerializer(experience, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['employee'] = employee.id
            
            serializer = EmployeeExperienceSerializer(data=data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Experience record created for employee: {employee.employee_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in employee_experience_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_experience_detail(request, employee_id, pk):
    """Experience detail operations"""
    try:
        experience = get_object_or_404(EmployeeExperience, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            serializer = EmployeeExperienceSerializer(experience)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = EmployeeExperienceSerializer(experience, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            experience.delete()
            return Response(
                {'message': 'Experience record deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in employee_experience_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== ANALYTICS/STATISTICS VIEWS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_statistics(request, pk):
    """Get company statistics"""
    try:
        company = get_object_or_404(Company, pk=pk)
        
        stats = {
            'total_employees': company.employees.count(),
            'active_employees': company.employees.filter(status='active').count(),
            'inactive_employees': company.employees.filter(status='inactive').count(),
            'on_leave_employees': company.employees.filter(status='on_leave').count(),
            'total_departments': company.departments.filter(is_active=True).count(),
            'total_designations': company.designations.filter(is_active=True).count(),
            'employment_types': company.employees.values('employment_type').annotate(count=Count('id')),
            'employees_by_department': company.employees.filter(status='active').values(
                'department__name'
            ).annotate(count=Count('id')),
        }
        
        return Response(stats)
    
    except Exception as e:
        logger.error(f"Error in company_statistics: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )