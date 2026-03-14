from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from apps.accounts.permissions import is_client_admin
from apps.accounts.utils import get_employee_or_none
from apps.accounts.models import Organization

from .models import (
    EmployeeCustomField,
    EmployeeDocumentType,
    OnboardingTemplate,
    OnboardingStep,
)
from .serializers import (
    EmployeeCustomFieldSerializer,
    EmployeeDocumentTypeSerializer,
    OnboardingTemplateSerializer,
    OnboardingStepSerializer,
)


def get_client_company(user):
    employee = get_employee_or_none(user)
    if employee and getattr(employee, 'company', None):
        return employee.company

    if user and user.is_authenticated:
        org = Organization.objects.filter(created_by=user).first()
        if org:
            return org

    return None


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
