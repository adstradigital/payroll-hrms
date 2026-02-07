from rest_framework import serializers
from .models import (
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    EmployeeSalary, EmployeeSalaryComponent, PayrollPeriod, PaySlip, PaySlipComponent,
    TaxSlab, TaxDeclaration, PayrollSettings, Loan, EMI
)


class EMISerializer(serializers.ModelSerializer):
    class Meta:
        model = EMI
        fields = '__all__'


class LoanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    emis = EMISerializer(many=True, read_only=True)
    
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['company', 'total_payable', 'balance_amount']


class PayrollSettingsSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = PayrollSettings
        fields = '__all__'
        read_only_fields = ['company']


class SalaryComponentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    percentage_of_name = serializers.CharField(source='percentage_of.name', read_only=True)
    
    # Aliases for frontend compatibility with safe defaults
    amount = serializers.DecimalField(source='default_amount', max_digits=10, decimal_places=2, required=False, default=0)
    percentage_value = serializers.DecimalField(source='default_percentage', max_digits=5, decimal_places=2, required=False, default=0)
    percentage_of = serializers.PrimaryKeyRelatedField(queryset=SalaryComponent.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = SalaryComponent
        fields = [
            'id', 'company', 'company_name', 'name', 'code', 'component_type',
            'calculation_type', 'percentage_of', 'percentage_of_name',
            'default_amount', 'default_percentage', 'amount', 'percentage_value',
            'is_taxable', 'is_statutory', 'statutory_type', 'display_order', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company']




class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    calculation_type = serializers.CharField(source='component.calculation_type', read_only=True)
    default_amount = serializers.DecimalField(source='component.default_amount', max_digits=10, decimal_places=2, read_only=True)
    default_percentage = serializers.DecimalField(source='component.default_percentage', max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = SalaryStructureComponent
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(read_only=True)
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
        read_only_fields = ['gross_salary', 'net_salary', 'net_salary', 'ctc']


class PaySlipComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component.name', read_only=True)
    component_type = serializers.CharField(source='component.component_type', read_only=True)
    
    class Meta:
        model = PaySlipComponent
        fields = '__all__'


class PayrollPeriodSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.full_name', read_only=True)
    total_lop = serializers.SerializerMethodField()
    
    class Meta:
        model = PayrollPeriod
        fields = '__all__'

    def get_total_lop(self, obj):
        # Use getattr to safely access the annotated field, defaulting to 0
        return getattr(obj, 'total_lop_annotated', 0)


class PaySlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    designation_name = serializers.CharField(source='employee.designation.name', read_only=True)
    company_name = serializers.CharField(source='employee.company.name', read_only=True)
    period_name = serializers.CharField(source='payroll_period.name', read_only=True)
    
    class Meta:
        model = PaySlip
        fields = '__all__'


class PaySlipDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    designation_name = serializers.CharField(source='employee.designation.name', read_only=True)
    company_name = serializers.CharField(source='employee.company.name', read_only=True)
    period_name = serializers.CharField(source='payroll_period.name', read_only=True)
    components = PaySlipComponentSerializer(many=True, read_only=True)
    
    class Meta:
        model = PaySlip
        fields = '__all__'


class GeneratePayrollSerializer(serializers.Serializer):
    """For generating payroll for a period"""
    company = serializers.UUIDField(required=False)
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2100)
    force = serializers.BooleanField(default=False, required=False)
    preview = serializers.BooleanField(default=False, required=False)


class TaxSlabSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = TaxSlab
        fields = '__all__'
        read_only_fields = ['company']


class TaxDeclarationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.full_name', read_only=True)
    
    class Meta:
        model = TaxDeclaration
        fields = '__all__'
        read_only_fields = ['total_declared_amount']  # Calculated or updated via specific logic
        # OR usually total_declared_amount is calculated from the JSON, 
        # so we might want to allow it to be sent or auto-calculate it in validation/save.
        # For now, allowing it to be writable or auto-calculated in frontend?
        # Let's keep it standard.