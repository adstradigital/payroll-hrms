from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models_commission import CommissionRule, SalesRecord, CommissionHistory
from .models import Employee, PayrollPeriod
from .services.bonus_engine import CommissionCalculator
from rest_framework import serializers

# Serializers
class CommissionRuleSerializer(serializers.ModelSerializer):
    designation_name = serializers.ReadOnlyField(source='designation.name')
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    
    class Meta:
        model = CommissionRule
        fields = '__all__'

class SalesRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    
    class Meta:
        model = SalesRecord
        fields = '__all__'

class CommissionHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    employee_id_display = serializers.ReadOnlyField(source='employee.employee_id')
    period_display = serializers.ReadOnlyField(source='period.name')
    
    class Meta:
        model = CommissionHistory
        fields = '__all__'

# Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def commission_rule_list_create(request):
    if request.method == 'GET':
        rules = CommissionRule.objects.all()
        serializer = CommissionRuleSerializer(rules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CommissionRuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def commission_rule_detail(request, pk):
    rule = get_object_or_404(CommissionRule, pk=pk)
    
    if request.method == 'GET':
        serializer = CommissionRuleSerializer(rule)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = CommissionRuleSerializer(rule, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sales_record_list_create(request):
    if request.method == 'GET':
        employee_id = request.query_params.get('employee')
        queryset = SalesRecord.objects.all()
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        serializer = SalesRecordSerializer(queryset, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SalesRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_commissions_view(request):
    period_id = request.data.get('period')
    if not period_id:
        return Response({"error": "Period ID is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    period = get_object_or_404(PayrollPeriod, pk=period_id)
    results = CommissionCalculator.process_period(period)
    
    serializer = CommissionHistorySerializer(results, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def commission_history_list(request):
    period_id = request.query_params.get('period')
    queryset = CommissionHistory.objects.all()
    if period_id:
        queryset = queryset.filter(period_id=period_id)
    
    serializer = CommissionHistorySerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_commission_view(request, pk):
    history = get_object_or_404(CommissionHistory, pk=pk)
    try:
        updated_history = CommissionCalculator.approve_commission(history.id)
        serializer = CommissionHistorySerializer(updated_history)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
