from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Company, Department, Designation, Employee, BankDetails
from .serializers import (
    CompanySerializer, DepartmentSerializer, DesignationSerializer,
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateUpdateSerializer,
    BankDetailsSerializer
)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'gstin']
    ordering_fields = ['name', 'created_at']


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('company', 'parent').all()
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.select_related('company').all()
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'level', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'level', 'created_at']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related(
        'company', 'department', 'designation', 'reporting_manager'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'department', 'designation', 'status', 'employment_type']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']
    ordering_fields = ['employee_id', 'first_name', 'date_of_joining', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EmployeeCreateUpdateSerializer
        return EmployeeDetailSerializer
    
    @action(detail=True, methods=['get'])
    def bank_accounts(self, request, pk=None):
        """Get all bank accounts for an employee"""
        employee = self.get_object()
        accounts = employee.bank_accounts.all()
        serializer = BankDetailsSerializer(accounts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active employees"""
        employees = self.queryset.filter(status='active')
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)


class BankDetailsViewSet(viewsets.ModelViewSet):
    queryset = BankDetails.objects.select_related('employee').all()
    serializer_class = BankDetailsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'is_primary']
