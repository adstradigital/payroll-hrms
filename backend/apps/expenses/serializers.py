from rest_framework import serializers
from .models import ExpenseCategory, ExpenseClaim
from django.contrib.auth import get_user_model

User = get_user_model()

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'description', 'created_at']

class ExpenseClaimSerializer(serializers.ModelSerializer):
    category = ExpenseCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ExpenseCategory.objects.all(), source='category', write_only=True
    )
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = ExpenseClaim
        fields = [
            'id', 'employee', 'employee_name', 'title', 'category', 'category_id',
            'amount', 'claim_date', 'description', 'receipt', 'status',
            'current_stage', 'approval_history', 'created_at', 'updated_at', 'approved_by'
        ]
        read_only_fields = ['employee', 'status', 'created_at', 'updated_at', 'approved_by']

    def create(self, validated_data):
        validated_data['employee'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)
