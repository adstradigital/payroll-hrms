from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Company, Department, Designation, Employee
from .serializers import (
    CompanySerializer, DepartmentSerializer, DesignationSerializer,
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateUpdateSerializer
)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

    def list(self, request):
        try:
            return super().list(request)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('company', 'parent')
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'is_active']
    search_fields = ['name', 'code']

    def create(self, request):
        try:
            return super().create(request)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.select_related('company')
    serializer_class = DesignationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company', 'level']

    def list(self, request):
        try:
            return super().list(request)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related(
        'company', 'department', 'designation', 'reporting_manager'
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['company', 'department', 'designation', 'status']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EmployeeCreateUpdateSerializer
        return EmployeeDetailSerializer

    def create(self, request):
        try:
            return super().create(request)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
