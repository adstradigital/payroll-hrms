from rest_framework import serializers
from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, EmployeeSalaryComponent, PayrollPeriod, PaySlip, PaySlipComponent
)


class SalaryComponentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    percentage_of_name = serializers.CharField(source='percentage_of.name', read_only=True)
    
    class Meta:
        model = SalaryComponent
        fields = '__all__'


class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = SalaryStructureComponent
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    components = SalaryStructureComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = SalaryStructure
        fields = '__all__'


class EmployeeSalaryComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = EmployeeSalaryComponent
        fields = '__all__'


class EmployeeSalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    structure_name = serializers.CharField(source='salary_structure.name', read_only=True)
    components = EmployeeSalaryComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = EmployeeSalary
        fields = '__all__'


class PaySlipComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = PaySlipComponent
        fields = '__all__'


class PayrollPeriodSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.full_name', read_only=True)
    
    class Meta:
        model = PayrollPeriod
        fields = '__all__'


class PaySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    period_name = serializers.CharField(source='payroll_period.name', read_only=True)
    
    class Meta:
        model = PaySlip
        fields = '__all__'


class PaySlipDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    period_name = serializers.CharField(source='payroll_period.name', read_only=True)
    components = PaySlipComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = PaySlip
        fields = '__all__'


class GeneratePayrollSerializer(serializers.Serializer):
    """For generating payroll for a period"""
    company = serializers.UUIDField(required=False)
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020)