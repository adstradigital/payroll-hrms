from django.utils.text import slugify
from rest_framework import serializers

from .models import (
    EmployeeCustomField,
    EmployeeDocumentType,
    OnboardingTemplate,
    OnboardingStep,
)


class EmployeeCustomFieldSerializer(serializers.ModelSerializer):
    field_key = serializers.SlugField(read_only=True)

    class Meta:
        model = EmployeeCustomField
        fields = (
            'id',
            'field_name',
            'field_key',
            'field_type',
            'is_required',
            'is_active',
            'options',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'field_key', 'created_at', 'updated_at')

    def _company(self):
        company = self.context.get('company')
        if not company:
            raise serializers.ValidationError({'company': 'Company context is required.'})
        return company

    def _generate_unique_key(self, company, field_name, instance_id=None):
        base = slugify(field_name or '').replace('-', '_')
        base = (base or '').strip('_')
        if not base:
            raise serializers.ValidationError({'field_name': 'Field name must generate a valid key.'})

        existing = EmployeeCustomField.objects.filter(company=company, field_key=base)
        if instance_id:
            existing = existing.exclude(id=instance_id)
        if not existing.exists():
            return base

        i = 2
        while True:
            candidate = f'{base}_{i}'
            qs = EmployeeCustomField.objects.filter(company=company, field_key=candidate)
            if instance_id:
                qs = qs.exclude(id=instance_id)
            if not qs.exists():
                return candidate
            i += 1

    def validate_field_type(self, value):
        allowed = {choice[0] for choice in EmployeeCustomField.FIELD_TYPE_CHOICES}
        if value not in allowed:
            raise serializers.ValidationError('Invalid field_type.')
        return value

    def validate(self, attrs):
        field_type = attrs.get('field_type') or getattr(self.instance, 'field_type', None) or EmployeeCustomField.FIELD_TYPE_TEXT
        options = attrs.get('options', getattr(self.instance, 'options', None))

        if field_type == EmployeeCustomField.FIELD_TYPE_DROPDOWN:
            if not isinstance(options, list):
                raise serializers.ValidationError({'options': 'Dropdown options must be a list.'})
            cleaned = [str(o).strip() for o in options if str(o).strip()]
            if not cleaned:
                raise serializers.ValidationError({'options': 'Provide at least one option for dropdown fields.'})
            attrs['options'] = cleaned
        else:
            attrs['options'] = None

        return attrs

    def create(self, validated_data):
        company = self._company()
        field_name = validated_data.get('field_name', '')
        validated_data['field_key'] = self._generate_unique_key(company, field_name)
        return EmployeeCustomField.objects.create(company=company, **validated_data)

    def update(self, instance, validated_data):
        company = self._company()

        field_name = validated_data.get('field_name', instance.field_name)
        validated_data['field_key'] = self._generate_unique_key(company, field_name, instance_id=instance.id)

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class EmployeeDocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocumentType
        fields = (
            'id',
            'name',
            'description',
            'is_required',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def _company(self):
        company = self.context.get('company')
        if not company:
            raise serializers.ValidationError({'company': 'Company context is required.'})
        return company

    def validate_name(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Name is required.')
        return text

    def create(self, validated_data):
        company = self._company()
        return EmployeeDocumentType.objects.create(company=company, **validated_data)


class OnboardingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTemplate
        fields = (
            'id',
            'name',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def _company(self):
        company = self.context.get('company')
        if not company:
            raise serializers.ValidationError({'company': 'Company context is required.'})
        return company

    def validate_name(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Name is required.')
        return text

    def create(self, validated_data):
        company = self._company()
        return OnboardingTemplate.objects.create(company=company, **validated_data)


class OnboardingStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingStep
        fields = (
            'id',
            'template',
            'step_name',
            'step_order',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_step_name(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Step name is required.')
        return text

    def validate_step_order(self, value):
        try:
            ivalue = int(value)
        except Exception:
            raise serializers.ValidationError('Step order must be an integer.')
        if ivalue < 1:
            raise serializers.ValidationError('Step order must be >= 1.')
        return ivalue
