import uuid

from django.db import models

from apps.accounts.models import Organization


class EmployeeCustomField(models.Model):
    FIELD_TYPE_TEXT = 'text'
    FIELD_TYPE_NUMBER = 'number'
    FIELD_TYPE_DATE = 'date'
    FIELD_TYPE_DROPDOWN = 'dropdown'
    FIELD_TYPE_CHECKBOX = 'checkbox'

    FIELD_TYPE_CHOICES = (
        (FIELD_TYPE_TEXT, 'Text'),
        (FIELD_TYPE_NUMBER, 'Number'),
        (FIELD_TYPE_DATE, 'Date'),
        (FIELD_TYPE_DROPDOWN, 'Dropdown'),
        (FIELD_TYPE_CHECKBOX, 'Checkbox'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='employee_custom_fields')

    field_name = models.CharField(max_length=120)
    field_key = models.SlugField(max_length=140)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES, default=FIELD_TYPE_TEXT)

    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    options = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'field_key')
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['company', 'field_type']),
        ]

    def __str__(self):
        return f"{self.field_name} ({self.company.name})"


class EmployeeDocumentType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='employee_document_types')

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'name')
        indexes = [
            models.Index(fields=['company', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class OnboardingTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='onboarding_templates')

    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'name')
        indexes = [
            models.Index(fields=['company', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class OnboardingStep(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(OnboardingTemplate, on_delete=models.CASCADE, related_name='steps')

    step_name = models.CharField(max_length=200)
    step_order = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('template', 'step_order')
        indexes = [
            models.Index(fields=['template', 'step_order']),
        ]

    def __str__(self):
        return f"{self.template.name}: {self.step_order}. {self.step_name}"
