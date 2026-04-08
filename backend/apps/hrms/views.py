from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.conf import settings
from django.utils import timezone
from django.http import FileResponse
from django.core.serializers.json import DjangoJSONEncoder
import json
import os

from apps.accounts.permissions import is_client_admin
from apps.accounts.utils import get_employee_or_none
from apps.accounts.models import Organization
from apps.attendance.models import AttendancePolicy, Shift, Holiday
from apps.attendance.serializers import AttendancePolicyListSerializer, ShiftListSerializer, HolidaySerializer
from apps.leave.models import LeaveType
from apps.leave.serializers import LeaveTypeSerializer
from apps.payroll.models import PayrollSettings, TaxSlab
from apps.payroll.serializers import PayrollSettingsSerializer, TaxSlabSerializer

from .models import (
    EmployeeCustomField,
    EmployeeDocumentType,
    OnboardingTemplate,
    OnboardingStep, EmployeeOnboardingStep,
)
from .serializers import (
    EmployeeCustomFieldSerializer,
    EmployeeDocumentTypeSerializer,
    OnboardingTemplateSerializer,
    OnboardingStepSerializer, EmployeeOnboardingStepSerializer,
)


def get_client_company(user):
    from apps.accounts.utils import get_employee_org
    return get_employee_org(user)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_custom_field_list_create(request):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        if request.method == 'GET':
            fields = EmployeeCustomField.objects.filter(company=company).order_by('-created_at')
            return Response(EmployeeCustomFieldSerializer(fields, many=True).data)

        if request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = EmployeeCustomFieldSerializer(data=request.data, context={'company': company})
            if serializer.is_valid():
                obj = serializer.save()
                return Response(EmployeeCustomFieldSerializer(obj).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_custom_field_detail(request, pk):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        obj = get_object_or_404(EmployeeCustomField, id=pk, company=company)

        if request.method == 'PUT':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = EmployeeCustomFieldSerializer(obj, data=request.data, context={'company': company})
            if serializer.is_valid():
                updated = serializer.save()
                return Response(EmployeeCustomFieldSerializer(updated).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_document_type_list_create(request):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        if request.method == 'GET':
            docs = EmployeeDocumentType.objects.filter(company=company).order_by('-created_at')
            return Response(EmployeeDocumentTypeSerializer(docs, many=True).data)

        if request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = EmployeeDocumentTypeSerializer(data=request.data, context={'company': company})
            if serializer.is_valid():
                obj = serializer.save()
                return Response(EmployeeDocumentTypeSerializer(obj).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_document_type_detail(request, pk):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        obj = get_object_or_404(EmployeeDocumentType, id=pk, company=company)

        if request.method == 'PUT':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = EmployeeDocumentTypeSerializer(obj, data=request.data, context={'company': company})
            if serializer.is_valid():
                updated = serializer.save()
                return Response(EmployeeDocumentTypeSerializer(updated).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def onboarding_template_list_create(request):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        if request.method == 'GET':
            templates = OnboardingTemplate.objects.filter(company=company).order_by('-created_at')
            return Response(OnboardingTemplateSerializer(templates, many=True).data)

        if request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = OnboardingTemplateSerializer(data=request.data, context={'company': company})
            if serializer.is_valid():
                obj = serializer.save()
                return Response(OnboardingTemplateSerializer(obj).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def onboarding_template_detail(request, pk):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        obj = get_object_or_404(OnboardingTemplate, id=pk, company=company)

        if request.method == 'PUT':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)

            serializer = OnboardingTemplateSerializer(obj, data=request.data, context={'company': company})
            if serializer.is_valid():
                updated = serializer.save()
                return Response(OnboardingTemplateSerializer(updated).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def onboarding_steps_by_template(request, template_id):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        template = get_object_or_404(OnboardingTemplate, id=template_id, company=company)
        steps = OnboardingStep.objects.filter(template=template).order_by('step_order', 'created_at')
        return Response(OnboardingStepSerializer(steps, many=True).data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_step_create(request):
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)

        template_id = request.data.get('template') or request.data.get('template_id')
        if not template_id:
            return Response({'template': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        template = get_object_or_404(OnboardingTemplate, id=template_id, company=company)
        payload = dict(request.data)
        payload['template'] = str(template.id)

        serializer = OnboardingStepSerializer(data=payload)
        if serializer.is_valid():
            try:
                obj = serializer.save()
            except IntegrityError:
                return Response({'step_order': ['Step order must be unique within the template.']}, status=400)
            return Response(OnboardingStepSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settings_backup(request):
    """
    Create a lightweight backup artifact for settings testing.
    This writes a JSON snapshot with metadata to backend/backups/.
    """
    try:
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)

        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = timezone.now()
        base_name = f"settings-backup-{company.id}-{timestamp.strftime('%Y%m%d%H%M%S')}"
        json_filename = f"{base_name}.json"
        json_path = os.path.join(backup_dir, json_filename)

        attendance_policies = AttendancePolicy.objects.filter(company=company).order_by('-effective_from')
        shifts = Shift.objects.filter(company=company).order_by('start_time')
        holidays = Holiday.objects.filter(company=company).order_by('-date')
        leave_types = LeaveType.objects.filter(company=company).order_by('name')
        payroll_settings = PayrollSettings.objects.filter(company=company).first()
        tax_slabs = TaxSlab.objects.filter(company=company).order_by('min_income')

        payload = {
            'type': 'settings-backup',
            'company_id': str(company.id),
            'company_name': company.name,
            'requested_by': request.user.username,
            'requested_by_email': request.user.email,
            'created_at': timestamp.isoformat(),
            'settings': {
                'company': {
                    'id': str(company.id),
                    'name': company.name,
                    'email': getattr(company, 'email', None),
                    'phone': getattr(company, 'phone', None),
                    'city': getattr(company, 'city', None),
                    'state': getattr(company, 'state', None),
                    'country': getattr(company, 'country', None),
                    'timezone': getattr(company, 'timezone', None),
                    'currency': getattr(company, 'currency', None),
                },
                'attendance_policies': AttendancePolicyListSerializer(attendance_policies, many=True).data,
                'shifts': ShiftListSerializer(shifts, many=True).data,
                'holidays': HolidaySerializer(holidays, many=True).data,
                'leave_types': LeaveTypeSerializer(leave_types, many=True).data,
                'payroll_settings': PayrollSettingsSerializer(payroll_settings).data if payroll_settings else None,
                'tax_slabs': TaxSlabSerializer(tax_slabs, many=True).data,
            },
        }

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, cls=DjangoJSONEncoder)

        return Response(
            {
                'success': True,
                'message': 'Backup created',
                'data': {
                    'file': json_filename,
                    'created_at': payload['created_at'],
                },
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def settings_backup_download(request):
    """
    Download the latest settings backup for the user's company.
    """
    try:
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)

        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found for user'}, status=400)

        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        if not os.path.exists(backup_dir):
            return Response({'error': 'No backups found'}, status=404)

        prefix = f"settings-backup-{company.id}-"
        candidates = [
            f for f in os.listdir(backup_dir)
            if f.startswith(prefix) and f.endswith('.json')
        ]
        if not candidates:
            # Fallback: return latest backup regardless of company (useful for testing environments)
            candidates = [
                f for f in os.listdir(backup_dir)
                if f.startswith("settings-backup-") and f.endswith('.json')
            ]
            if not candidates:
                return Response({'error': 'No backups found'}, status=404)

        latest = max(
            candidates,
            key=lambda name: os.path.getmtime(os.path.join(backup_dir, name)),
        )
        file_path = os.path.join(backup_dir, latest)
        return FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=latest,
            content_type='application/json',
        )
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_onboarding_steps(request, employee_id):
    """Get onboarding steps for a specific employee"""
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found'}, status=400)
            
        from apps.accounts.models import Employee
        employee = get_object_or_404(Employee, id=employee_id, company=company)
        
        steps = EmployeeOnboardingStep.objects.filter(employee=employee).select_related('template_step').order_by('template_step__step_order')
        serializer = EmployeeOnboardingStepSerializer(steps, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_employee_onboarding_step(request, pk):
    """Update status of an onboarding step"""
    try:
        company = get_client_company(request.user)
        if not company:
            return Response({'error': 'Company not found'}, status=400)
            
        from .models import EmployeeOnboardingStep
        step = get_object_or_404(EmployeeOnboardingStep, id=pk, employee__company=company)
        
        serializer = EmployeeOnboardingStepSerializer(step, data=request.data, partial=True)
        if serializer.is_valid():
            if 'is_completed' in serializer.validated_data:
                is_completed = serializer.validated_data['is_completed']
                if is_completed:
                    step.is_completed = True
                    step.completed_at = timezone.now()
                    step.completed_by = request.user
                else:
                    step.is_completed = False
                    step.completed_at = None
                    step.completed_by = None
                step.save()
            
            if 'notes' in serializer.validated_data:
                step.notes = serializer.validated_data['notes']
                step.save()
            
            # Check if all steps are completed to update employee status
            employee = step.employee
            total_steps = employee.onboarding_steps.count()
            completed_steps = employee.onboarding_steps.filter(is_completed=True).count()
            
            if total_steps > 0:
                if completed_steps == total_steps:
                    employee.onboarding_status = 'completed'
                elif completed_steps > 0:
                    employee.onboarding_status = 'in_progress'
                else:
                    employee.onboarding_status = 'pending'
                employee.save()
                
            return Response(EmployeeOnboardingStepSerializer(step).data)
        return Response(serializer.errors, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
