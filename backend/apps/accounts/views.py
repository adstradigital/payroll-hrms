from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta
import logging
import secrets

from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    Organization, Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience,
    InviteCode, NotificationPreference
)
from apps.subscriptions.models import Package, Subscription, Payment, FeatureUsage

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==================== REGISTRATION & AUTHENTICATION ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_organization(request):
    """
    Register new organization with trial subscription
    """
    try:
        with transaction.atomic():
            email = request.data.get('email')
            password = request.data.get('password')
            org_name = request.data.get('organizationName')
            full_name = request.data.get('fullName', '')
            phone = request.data.get('phone', '')
            employee_count_range = request.data.get('employeeCount', '1-50')
            is_multi_company = request.data.get('isMultiCompany', False)
            companies_data = request.data.get('companies', [])
            
            if not all([email, password, org_name, full_name]):
                return Response(
                    {'error': 'Missing required fields: email, password, organizationName, fullName'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
            
            employee_count_map = {'1-50': 50, '51-200': 200, '201-1000': 1000, '1000+': 10000}
            max_employees = employee_count_map.get(employee_count_range, 50)
            
            username = email.split('@')[0] + '_' + secrets.token_hex(4)
            user = User.objects.create_user(
                username=username, email=email, password=password,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            )
            
            trial_package, _ = Package.objects.get_or_create(
                package_type='free_trial',
                defaults={
                    'name': 'Free Trial', 'monthly_price': 0, 'trial_days': 14,
                    'max_employees': max_employees, 'max_companies': 10 if is_multi_company else 1,
                    'features': {'payroll': True, 'attendance': True, 'leave_management': True,
                                'employee_management': True, 'multi_company': is_multi_company}
                }
            )
            
            slug = slugify(org_name)
            if Organization.objects.filter(slug=slug).exists():
                slug = f"{slug}-{secrets.token_hex(3)}"
            
            main_org = Organization.objects.create(
                name=org_name, slug=slug, email=email, phone=phone,
                is_parent=True, is_active=True, is_verified=False,
                employee_count=1, created_by=user
            )
            
            trial_end = timezone.now().date() + timedelta(days=trial_package.trial_days)
            subscription = Subscription.objects.create(
                organization=main_org, package=trial_package, status='trial',
                billing_cycle='monthly', start_date=timezone.now().date(),
                trial_end_date=trial_end, current_period_start=timezone.now().date(),
                current_period_end=trial_end, price=0, employee_count=1, company_count=1,
                billing_email=email, billing_name=full_name, created_by=user
            )
            
            employee_id = f"EMP-{main_org.id.hex[:8].upper()}-001"
            admin_employee = Employee.objects.create(
                user=user, company=main_org, employee_id=employee_id,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                email=email, phone=phone, date_of_joining=timezone.now().date(),
                status='active', employment_type='permanent', created_by=user
            )
            
            subsidiary_companies = []
            if is_multi_company and companies_data:
                for company_data in companies_data:
                    if company_data.get('name'):
                        sub_slug = slugify(company_data['name'])
                        if Organization.objects.filter(slug=sub_slug).exists():
                            sub_slug = f"{sub_slug}-{secrets.token_hex(3)}"
                        subsidiary = Organization.objects.create(
                            name=company_data['name'], slug=sub_slug, email=email, phone=phone,
                            is_parent=False, parent=main_org, is_active=True, created_by=user
                        )
                        subsidiary_companies.append(subsidiary)
                subscription.company_count = 1 + len(subsidiary_companies)
                subscription.save()
            
            NotificationPreference.objects.create(user=user)
            
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"Organization registered: {org_name} by {email}")
            
            return Response({
                'success': True, 'message': 'Registration successful',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'user': {'id': str(user.id), 'email': user.email, 'name': full_name},
                'organization': {'id': str(main_org.id), 'name': main_org.name, 'slug': main_org.slug},
                'employee': {'id': str(admin_employee.id), 'employee_id': admin_employee.employee_id},
                'subscription': {'id': str(subscription.id), 'package': trial_package.name,
                               'status': subscription.status, 'trial_end_date': str(subscription.trial_end_date),
                               'days_remaining': subscription.days_remaining},
                'subsidiaries': [{'id': str(c.id), 'name': c.name} for c in subsidiary_companies]
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return Response({'error': 'Registration failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def activate_employee(request):
    """Activate employee account with invite code"""
    try:
        email = request.data.get('email')
        invite_code = request.data.get('inviteCode')
        password = request.data.get('password')
        confirm_password = request.data.get('confirmPassword')
        
        if not all([email, invite_code, password, confirm_password]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invite = InviteCode.objects.get(code=invite_code.upper(), email__iexact=email)
        except InviteCode.DoesNotExist:
            return Response({'error': 'Invalid invite code or email'}, status=status.HTTP_404_NOT_FOUND)
        
        if not invite.is_valid:
            error_msg = 'Invite code already used' if invite.is_used else 'Invite code expired'
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            username = email.split('@')[0] + '_' + secrets.token_hex(4)
            user = User.objects.create_user(
                username=username, email=email, password=password,
                first_name=invite.first_name, last_name=invite.last_name
            )
            
            employee_id = f"EMP-{invite.organization.id.hex[:8].upper()}-{secrets.token_hex(3).upper()}"
            employee = Employee.objects.create(
                user=user, company=invite.organization, employee_id=employee_id,
                first_name=invite.first_name, last_name=invite.last_name, email=email,
                date_of_joining=timezone.now().date(), status='active', employment_type='permanent'
            )
            
            invite.is_used = True
            invite.used_at = timezone.now()
            invite.used_by = user
            invite.save()
            
            subscription = invite.organization.subscription
            subscription.employee_count += 1
            subscription.save()
            
            NotificationPreference.objects.create(user=user)
        
        logger.info(f"Employee activated: {email}")
        return Response({
            'success': True, 'message': 'Account activated successfully',
            'employee_id': employee.employee_id, 'organization': invite.organization.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Activation error: {str(e)}", exc_info=True)
        return Response({'error': 'Activation failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== PACKAGE MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def package_list(request):
    """Get all available packages"""
    try:
        packages = Package.objects.filter(is_active=True).exclude(package_type='free_trial').order_by('sort_order', 'monthly_price')
        
        package_data = [{
            'id': str(pkg.id), 'name': pkg.name, 'type': pkg.package_type,
            'description': pkg.description, 'short_description': pkg.short_description, 'tag_line': pkg.tag_line,
            'pricing': {'monthly': float(pkg.monthly_price), 'quarterly': float(pkg.quarterly_price),
                       'yearly': float(pkg.yearly_price), 'quarterly_discount': float(pkg.quarterly_discount_percent),
                       'yearly_discount': float(pkg.yearly_discount_percent)},
            'limits': {'max_employees': pkg.max_employees, 'max_companies': pkg.max_companies,
                      'max_departments': pkg.max_departments, 'max_storage_gb': pkg.max_storage_gb},
            'features': pkg.features, 'is_popular': pkg.is_popular, 'is_featured': pkg.is_featured, 'button_text': pkg.button_text
        } for pkg in packages]
        
        return Response({'success': True, 'packages': package_data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching packages: {str(e)}")
        return Response({'error': 'Failed to fetch packages'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def package_detail(request, package_id):
    """Get package details"""
    try:
        package = get_object_or_404(Package, id=package_id, is_active=True)
        data = {
            'id': str(package.id), 'name': package.name, 'type': package.package_type,
            'description': package.description, 'short_description': package.short_description, 'tag_line': package.tag_line,
            'pricing': {'monthly': float(package.monthly_price), 'quarterly': float(package.quarterly_price),
                       'yearly': float(package.yearly_price)},
            'limits': {'max_employees': package.max_employees, 'max_companies': package.max_companies,
                      'max_departments': package.max_departments, 'max_storage_gb': package.max_storage_gb},
            'features': package.features, 'trial_days': package.trial_days,
            'is_popular': package.is_popular, 'is_featured': package.is_featured, 'button_text': package.button_text
        }
        return Response({'success': True, 'package': data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching package: {str(e)}")
        return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== SUBSCRIPTION MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_detail(request):
    """Get current user's organization subscription"""
    try:
        employee = Employee.objects.select_related('company', 'company__subscription', 'company__subscription__package').get(user=request.user)
        organization = employee.company.get_root_parent()
        subscription = organization.subscription
        
        data = {
            'id': str(subscription.id),
            'organization': {'id': str(organization.id), 'name': organization.name, 'slug': organization.slug},
            'package': {'id': str(subscription.package.id), 'name': subscription.package.name, 'type': subscription.package.package_type},
            'status': subscription.status, 'billing_cycle': subscription.billing_cycle,
            'start_date': str(subscription.start_date),
            'trial_end_date': str(subscription.trial_end_date) if subscription.trial_end_date else None,
            'current_period_start': str(subscription.current_period_start),
            'current_period_end': str(subscription.current_period_end),
            'days_remaining': subscription.days_remaining, 'is_trial': subscription.is_trial, 'is_active': subscription.is_active,
            'price': float(subscription.price), 'currency': subscription.currency,
            'usage': {'employees': subscription.employee_count, 'companies': subscription.company_count, 'storage_gb': float(subscription.storage_used_gb)},
            'limits': {'max_employees': subscription.package.max_employees, 'max_companies': subscription.package.max_companies, 'max_storage_gb': subscription.package.max_storage_gb},
            'auto_renew': subscription.auto_renew
        }
        return Response({'success': True, 'subscription': data}, status=status.HTTP_200_OK)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching subscription: {str(e)}")
        return Response({'error': 'Failed to fetch subscription'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_subscription(request):
    """Upgrade subscription to paid package"""
    try:
        package_id = request.data.get('package_id')
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        
        if not package_id:
            return Response({'error': 'package_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        employee = Employee.objects.select_related('company').get(user=request.user)
        organization = employee.company.get_root_parent()
        package = get_object_or_404(Package, id=package_id, is_active=True)
        subscription = organization.subscription
        
        if subscription.package.package_type != 'free_trial' and subscription.status == 'active':
            return Response({'error': 'Already on a paid plan. Please contact support to change plans.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            subscription.package = package
            subscription.billing_cycle = billing_cycle
            subscription.status = 'active'
            subscription.price = package.get_price(billing_cycle)
            subscription.current_period_start = timezone.now().date()
            
            days_map = {'monthly': 30, 'quarterly': 90, 'yearly': 365}
            subscription.current_period_end = subscription.current_period_start + timedelta(days=days_map.get(billing_cycle, 30))
            subscription.updated_by = request.user
            subscription.save()
        
        return Response({
            'success': True, 'message': 'Subscription upgraded successfully',
            'subscription': {'id': str(subscription.id), 'package': package.name,
                           'billing_cycle': billing_cycle, 'price': float(subscription.price),
                           'next_billing_date': str(subscription.current_period_end)}
        }, status=status.HTTP_200_OK)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error upgrading subscription: {str(e)}")
        return Response({'error': 'Failed to upgrade subscription'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    """Cancel subscription"""
    try:
        employee = Employee.objects.select_related('company').get(user=request.user)
        organization = employee.company.get_root_parent()
        subscription = organization.subscription
        
        if subscription.status == 'trial':
            return Response({'error': 'Cannot cancel trial subscription'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            subscription.status = 'cancelled'
            subscription.cancelled_at = timezone.now()
            subscription.auto_renew = False
            subscription.updated_by = request.user
            subscription.save()
        
        return Response({
            'success': True, 'message': 'Subscription cancelled. Access will continue until end of billing period.',
            'access_until': str(subscription.current_period_end)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        return Response({'error': 'Failed to cancel subscription'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== ORGANIZATION MANAGEMENT ====================

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def organization_detail(request):
    """Get or update organization details"""
    try:
        employee = Employee.objects.select_related('company').get(user=request.user)
        organization = employee.company.get_root_parent()
        
        if request.method == 'GET':
            subsidiaries = organization.subsidiaries.filter(is_active=True)
            data = {
                'id': str(organization.id), 'name': organization.name, 'slug': organization.slug,
                'email': organization.email, 'phone': organization.phone, 'address': organization.address,
                'city': organization.city, 'state': organization.state, 'country': organization.country,
                'pincode': organization.pincode, 'gstin': organization.gstin, 'pan': organization.pan,
                'website': organization.website, 'logo': organization.logo.url if organization.logo else None,
                'employee_count': organization.employee_count,
                'established_date': str(organization.established_date) if organization.established_date else None,
                'industry': organization.industry, 'is_verified': organization.is_verified,
                'subsidiaries': [{'id': str(sub.id), 'name': sub.name, 'slug': sub.slug} for sub in subsidiaries]
            }
            return Response({'success': True, 'organization': data}, status=status.HTTP_200_OK)
        
        elif request.method == 'PATCH':
            allowed_fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'website', 'industry', 'established_date']
            for field in allowed_fields:
                if field in request.data:
                    setattr(organization, field, request.data[field])
            organization.updated_by = request.user
            organization.save()
            return Response({'success': True, 'message': 'Organization updated successfully'}, status=status.HTTP_200_OK)
        
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in organization_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== INVITE CODE MANAGEMENT ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invite_code(request):
    """Create employee invite code"""
    try:
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'employee')
        expires_in_days = request.data.get('expires_in_days', 7)
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        employee = Employee.objects.select_related('company').get(user=request.user)
        organization = employee.company.get_root_parent()
        subscription = organization.subscription
        
        if not subscription.can_add_employee():
            return Response({'error': 'Employee limit reached. Please upgrade your plan.'}, status=status.HTTP_400_BAD_REQUEST)
        
        code = f"INV-{secrets.token_hex(4).upper()}"
        while InviteCode.objects.filter(code=code).exists():
            code = f"INV-{secrets.token_hex(4).upper()}"
        
        invite = InviteCode.objects.create(
            code=code, email=email, organization=organization,
            first_name=first_name, last_name=last_name, role=role,
            expires_at=timezone.now() + timedelta(days=expires_in_days), created_by=request.user
        )
        
        return Response({
            'success': True, 'message': 'Invite code created successfully',
            'invite': {'code': invite.code, 'email': invite.email, 'expires_at': str(invite.expires_at)}
        }, status=status.HTTP_201_CREATED)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating invite: {str(e)}")
        return Response({'error': 'Failed to create invite code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invite_list(request):
    """List all invites for organization"""
    try:
        employee = Employee.objects.select_related('company').get(user=request.user)
        organization = employee.company.get_root_parent()
        invites = InviteCode.objects.filter(organization=organization).order_by('-created_at')
        
        data = [{
            'id': str(invite.id), 'code': invite.code, 'email': invite.email,
            'first_name': invite.first_name, 'last_name': invite.last_name, 'role': invite.role,
            'is_used': invite.is_used, 'is_expired': invite.is_expired,
            'expires_at': str(invite.expires_at), 'created_at': str(invite.created_at)
        } for invite in invites]
        
        return Response({'success': True, 'invites': data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching invites: {str(e)}")
        return Response({'error': 'Failed to fetch invites'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== COMPANY MANAGEMENT ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def company_list_create(request):
    """List or create companies/organizations"""
    try:
        if request.method == 'GET':
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            
            queryset = Organization.objects.all()
            if search:
                queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(gstin__icontains=search))
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            
            data = [{'id': str(org.id), 'name': org.name, 'email': org.email, 'phone': org.phone,
                    'is_active': org.is_active, 'employee_count': org.employee_count} for org in paginated]
            return paginator.get_paginated_response(data)
        
        elif request.method == 'POST':
            name = request.data.get('name')
            if not name:
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            slug = slugify(name)
            if Organization.objects.filter(slug=slug).exists():
                slug = f"{slug}-{secrets.token_hex(3)}"
            
            org = Organization.objects.create(
                name=name, slug=slug, email=request.data.get('email', ''),
                phone=request.data.get('phone', ''), address=request.data.get('address', ''),
                city=request.data.get('city', ''), state=request.data.get('state', ''),
                country=request.data.get('country', ''), is_active=True, created_by=request.user
            )
            return Response({'success': True, 'id': str(org.id), 'name': org.name}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in company_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def company_detail(request, pk):
    """Company detail operations"""
    try:
        company = get_object_or_404(Organization, pk=pk)
        
        if request.method == 'GET':
            data = {
                'id': str(company.id), 'name': company.name, 'slug': company.slug,
                'email': company.email, 'phone': company.phone, 'address': company.address,
                'city': company.city, 'state': company.state, 'country': company.country,
                'pincode': company.pincode, 'gstin': company.gstin, 'pan': company.pan,
                'website': company.website, 'is_active': company.is_active,
                'employee_count': company.employee_count
            }
            return Response({'success': True, 'company': data})
        
        elif request.method in ['PUT', 'PATCH']:
            for field in ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'gstin', 'pan', 'website']:
                if field in request.data:
                    setattr(company, field, request.data[field])
            company.updated_by = request.user
            company.save()
            return Response({'success': True, 'message': 'Company updated'})
        
        elif request.method == 'DELETE':
            company.delete()
            return Response({'message': 'Company deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in company_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_statistics(request, pk):
    """Get company statistics"""
    try:
        company = get_object_or_404(Organization, pk=pk)
        stats = {
            'total_employees': company.employees.count(),
            'active_employees': company.employees.filter(status='active').count(),
            'inactive_employees': company.employees.filter(status='inactive').count(),
            'total_departments': company.departments.filter(is_active=True).count(),
            'total_designations': company.designations.filter(is_active=True).count(),
            'employment_types': list(company.employees.values('employment_type').annotate(count=Count('id'))),
            'employees_by_department': list(company.employees.filter(status='active').values('department__name').annotate(count=Count('id'))),
        }
        return Response(stats)
    except Exception as e:
        logger.error(f"Error in company_statistics: {str(e)}")
        return Response({'error': 'Failed to fetch statistics'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== DEPARTMENT MANAGEMENT ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_list_create(request):
    """List or create departments"""
    try:
        if request.method == 'GET':
            company_id = request.query_params.get('company', None)
            queryset = Department.objects.select_related('company', 'parent', 'head')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            
            data = [{'id': str(d.id), 'name': d.name, 'code': d.code, 'company_name': d.company.name,
                    'is_active': d.is_active} for d in paginated]
            return paginator.get_paginated_response(data)
        
        elif request.method == 'POST':
            dept = Department.objects.create(
                company_id=request.data.get('company'), name=request.data.get('name'),
                code=request.data.get('code', ''), description=request.data.get('description', ''),
                parent_id=request.data.get('parent'), head_id=request.data.get('head'),
                is_active=True, created_by=request.user
            )
            return Response({'success': True, 'id': str(dept.id)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in department_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def department_detail(request, pk):
    """Department detail operations"""
    try:
        dept = get_object_or_404(Department, pk=pk)
        
        if request.method == 'GET':
            data = {'id': str(dept.id), 'name': dept.name, 'code': dept.code, 'description': dept.description,
                   'company': str(dept.company_id), 'parent': str(dept.parent_id) if dept.parent else None,
                   'head': str(dept.head_id) if dept.head else None, 'is_active': dept.is_active}
            return Response({'success': True, 'department': data})
        
        elif request.method in ['PUT', 'PATCH']:
            for field in ['name', 'code', 'description', 'is_active']:
                if field in request.data:
                    setattr(dept, field, request.data[field])
            dept.updated_by = request.user
            dept.save()
            return Response({'success': True, 'message': 'Department updated'})
        
        elif request.method == 'DELETE':
            dept.delete()
            return Response({'message': 'Department deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in department_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== DESIGNATION MANAGEMENT ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def designation_list_create(request):
    """List or create designations"""
    try:
        if request.method == 'GET':
            company_id = request.query_params.get('company', None)
            queryset = Designation.objects.select_related('company')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            
            data = [{'id': str(d.id), 'name': d.name, 'code': d.code, 'level': d.level,
                    'is_active': d.is_active} for d in paginated]
            return paginator.get_paginated_response(data)
        
        elif request.method == 'POST':
            desig = Designation.objects.create(
                company_id=request.data.get('company'), name=request.data.get('name'),
                code=request.data.get('code', ''), level=request.data.get('level', 1),
                is_active=True, created_by=request.user
            )
            return Response({'success': True, 'id': str(desig.id)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in designation_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def designation_detail(request, pk):
    """Designation detail operations"""
    try:
        desig = get_object_or_404(Designation, pk=pk)
        
        if request.method == 'GET':
            data = {'id': str(desig.id), 'name': desig.name, 'code': desig.code, 'description': desig.description,
                   'level': desig.level, 'is_active': desig.is_active}
            return Response({'success': True, 'designation': data})
        
        elif request.method in ['PUT', 'PATCH']:
            for field in ['name', 'code', 'description', 'level', 'is_active']:
                if field in request.data:
                    setattr(desig, field, request.data[field])
            desig.updated_by = request.user
            desig.save()
            return Response({'success': True, 'message': 'Designation updated'})
        
        elif request.method == 'DELETE':
            desig.delete()
            return Response({'message': 'Designation deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in designation_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== EMPLOYEE MANAGEMENT ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_create(request):
    """List or create employees"""
    try:
        if request.method == 'GET':
            company_id = request.query_params.get('company', None)
            department_id = request.query_params.get('department', None)
            status_filter = request.query_params.get('status', None)
            search = request.query_params.get('search', None)
            
            queryset = Employee.objects.select_related('company', 'department', 'designation')
            if company_id:
                queryset = queryset.filter(company_id=company_id)
            if department_id:
                queryset = queryset.filter(department_id=department_id)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if search:
                queryset = queryset.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(email__icontains=search) | Q(employee_id__icontains=search))
            
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            
            data = [{'id': str(e.id), 'employee_id': e.employee_id, 'full_name': e.full_name,
                    'email': e.email, 'department': e.department.name if e.department else None,
                    'designation': e.designation.name if e.designation else None, 'status': e.status} for e in paginated]
            return paginator.get_paginated_response(data)
        
        elif request.method == 'POST':
            emp = Employee.objects.create(
                company_id=request.data.get('company'), employee_id=request.data.get('employee_id'),
                first_name=request.data.get('first_name'), last_name=request.data.get('last_name', ''),
                email=request.data.get('email'), phone=request.data.get('phone', ''),
                department_id=request.data.get('department'), designation_id=request.data.get('designation'),
                date_of_joining=request.data.get('date_of_joining'), status='active', created_by=request.user
            )
            return Response({'success': True, 'id': str(emp.id), 'employee_id': emp.employee_id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in employee_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    """Employee detail operations"""
    try:
        emp = get_object_or_404(Employee.objects.select_related('company', 'department', 'designation', 'reporting_manager'), pk=pk)
        
        if request.method == 'GET':
            data = {
                'id': str(emp.id), 'employee_id': emp.employee_id, 'full_name': emp.full_name,
                'first_name': emp.first_name, 'middle_name': emp.middle_name, 'last_name': emp.last_name,
                'email': emp.email, 'phone': emp.phone, 'date_of_birth': str(emp.date_of_birth) if emp.date_of_birth else None,
                'gender': emp.gender, 'company': {'id': str(emp.company.id), 'name': emp.company.name},
                'department': {'id': str(emp.department.id), 'name': emp.department.name} if emp.department else None,
                'designation': {'id': str(emp.designation.id), 'name': emp.designation.name} if emp.designation else None,
                'status': emp.status, 'employment_type': emp.employment_type,
                'date_of_joining': str(emp.date_of_joining), 'age': emp.age, 'tenure_in_days': emp.tenure_in_days
            }
            return Response({'success': True, 'employee': data})
        
        elif request.method in ['PUT', 'PATCH']:
            allowed = ['first_name', 'middle_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
                      'department', 'designation', 'status', 'employment_type', 'current_address', 'current_city']
            for field in allowed:
                if field in request.data:
                    if field in ['department', 'designation']:
                        setattr(emp, f'{field}_id', request.data[field])
                    else:
                        setattr(emp, field, request.data[field])
            emp.updated_by = request.user
            emp.save()
            return Response({'success': True, 'message': 'Employee updated'})
        
        elif request.method == 'DELETE':
            emp.delete()
            return Response({'message': 'Employee deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in employee_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== EMPLOYEE DOCUMENTS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_document_list_create(request, employee_id):
    """List or create employee documents"""
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            docs = EmployeeDocument.objects.filter(employee=employee)
            data = [{'id': str(d.id), 'title': d.title, 'document_type': d.document_type,
                    'is_verified': d.is_verified} for d in docs]
            return Response({'success': True, 'documents': data})
        
        elif request.method == 'POST':
            doc = EmployeeDocument.objects.create(
                employee=employee, document_type=request.data.get('document_type'),
                title=request.data.get('title'), document_file=request.FILES.get('document_file'),
                created_by=request.user
            )
            return Response({'success': True, 'id': str(doc.id)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in employee_document_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_document_detail(request, employee_id, pk):
    """Document detail operations"""
    try:
        doc = get_object_or_404(EmployeeDocument, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            data = {'id': str(doc.id), 'title': doc.title, 'document_type': doc.document_type,
                   'document_file': doc.document_file.url if doc.document_file else None, 'is_verified': doc.is_verified}
            return Response({'success': True, 'document': data})
        
        elif request.method == 'DELETE':
            doc.delete()
            return Response({'message': 'Document deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in employee_document_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== EMPLOYEE EDUCATION ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_education_list_create(request, employee_id):
    """List or create employee education"""
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            education = EmployeeEducation.objects.filter(employee=employee)
            data = [{'id': str(e.id), 'degree': e.degree, 'institution': e.institution,
                    'start_date': str(e.start_date), 'end_date': str(e.end_date) if e.end_date else None} for e in education]
            return Response({'success': True, 'education': data})
        
        elif request.method == 'POST':
            edu = EmployeeEducation.objects.create(
                employee=employee, degree=request.data.get('degree'), institution=request.data.get('institution'),
                field_of_study=request.data.get('field_of_study', ''), start_date=request.data.get('start_date'),
                end_date=request.data.get('end_date'), grade=request.data.get('grade', ''), created_by=request.user
            )
            return Response({'success': True, 'id': str(edu.id)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in employee_education_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_education_detail(request, employee_id, pk):
    """Education detail operations"""
    try:
        edu = get_object_or_404(EmployeeEducation, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            data = {'id': str(edu.id), 'degree': edu.degree, 'institution': edu.institution,
                   'field_of_study': edu.field_of_study, 'start_date': str(edu.start_date),
                   'end_date': str(edu.end_date) if edu.end_date else None, 'grade': edu.grade}
            return Response({'success': True, 'education': data})
        
        elif request.method == 'DELETE':
            edu.delete()
            return Response({'message': 'Education deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in employee_education_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== EMPLOYEE EXPERIENCE ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_experience_list_create(request, employee_id):
    """List or create employee experience"""
    try:
        employee = get_object_or_404(Employee, pk=employee_id)
        
        if request.method == 'GET':
            experience = EmployeeExperience.objects.filter(employee=employee)
            data = [{'id': str(e.id), 'company_name': e.company_name, 'designation': e.designation,
                    'start_date': str(e.start_date), 'end_date': str(e.end_date) if e.end_date else None, 'is_current': e.is_current} for e in experience]
            return Response({'success': True, 'experience': data})
        
        elif request.method == 'POST':
            exp = EmployeeExperience.objects.create(
                employee=employee, company_name=request.data.get('company_name'), designation=request.data.get('designation'),
                start_date=request.data.get('start_date'), end_date=request.data.get('end_date'),
                responsibilities=request.data.get('responsibilities', ''), reason_for_leaving=request.data.get('reason_for_leaving', ''),
                is_current=request.data.get('is_current', False), created_by=request.user
            )
            return Response({'success': True, 'id': str(exp.id)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error in employee_experience_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_experience_detail(request, employee_id, pk):
    """Experience detail operations"""
    try:
        exp = get_object_or_404(EmployeeExperience, pk=pk, employee_id=employee_id)
        
        if request.method == 'GET':
            data = {'id': str(exp.id), 'company_name': exp.company_name, 'designation': exp.designation,
                   'start_date': str(exp.start_date), 'end_date': str(exp.end_date) if exp.end_date else None,
                   'responsibilities': exp.responsibilities, 'is_current': exp.is_current}
            return Response({'success': True, 'experience': data})
        
        elif request.method == 'DELETE':
            exp.delete()
            return Response({'message': 'Experience deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in employee_experience_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)