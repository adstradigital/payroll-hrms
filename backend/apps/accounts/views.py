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
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import (
    Organization, Company, Department, Designation, Employee,
    EmployeeDocument, EmployeeEducation, EmployeeExperience,
    InviteCode, NotificationPreference, Role, Module, Permission,
    DataScope, RolePermission, DesignationPermission
)
from apps.audit.utils import log_activity
from apps.subscriptions.models import Package, Subscription, Payment, FeatureUsage
from .serializers import (
    MyTokenObtainPairSerializer, ModuleSerializer, PermissionSerializer,
    DataScopeSerializer, RoleSerializer, RolePermissionSerializer,
    DesignationListSerializer, DesignationDetailSerializer, DepartmentListSerializer
)
from .permissions import is_client_admin, require_admin, require_permission, PermissionChecker

logger = logging.getLogger(__name__)


class MyTokenObtainPairView(TokenObtainPairView):
    """Custom Token View to use our enhanced serializer"""
    serializer_class = MyTokenObtainPairSerializer

class SuperAdminTokenObtainPairView(TokenObtainPairView):
    """
    Super Admin Login View
    Uses SuperAdminTokenObtainPairSerializer to enforce superuser check and username login.
    """
    from .serializers import SuperAdminTokenObtainPairSerializer
    serializer_class = SuperAdminTokenObtainPairSerializer


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
            
            # Create Administrator designation for the organization
            admin_designation, _ = Designation.objects.get_or_create(
                company=main_org,
                code='admin',
                defaults={
                    'name': 'Administrator',
                    'description': 'Organization Administrator with full access',
                    'level': 1,
                    'is_active': True,
                    'is_managerial': True,
                    'created_by': user
                }
            )
            
            # Assign Super Admin role to Administrator designation if exists
            try:
                super_admin_role = Role.objects.get(code='super_admin')
                admin_designation.roles.add(super_admin_role)
            except Role.DoesNotExist:
                pass  # Role will be created when setup_permissions is run
            
            admin_employee = Employee.objects.create(
                user=user, company=main_org, employee_id=employee_id,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                email=email, phone=phone, date_of_joining=timezone.now().date(),
                status='active', employment_type='permanent', 
                designation=admin_designation,
                is_admin=True, created_by=user
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
                'user': {
                    'id': str(user.id), 
                    'email': user.email, 
                    'name': full_name,
                    'role': 'admin' # First user is always admin
                },
                'organization': {'id': str(main_org.id), 'name': main_org.name, 'slug': main_org.slug},
                'employee': {'id': str(admin_employee.id), 'employee_id': admin_employee.employee_id, 'is_admin': True},
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
            # Isolate data by user's company
            current_employee = Employee.objects.filter(user=request.user).first()
            if current_employee:
                user_company_id = current_employee.company_id
            else:
                org = Organization.objects.filter(created_by=request.user).first()
                user_company_id = org.id if org else None

            company_id = request.query_params.get('company', user_company_id)
            queryset = Department.objects.select_related('company', 'parent', 'head')
            
            if user_company_id:
                queryset = queryset.filter(company_id=user_company_id)
            elif company_id:
                queryset = queryset.filter(company_id=company_id)
            
            # Use specific serializer for list
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            serializer = DepartmentListSerializer(paginated, many=True)
            return paginator.get_paginated_response(serializer.data)
        elif request.method == 'POST':
            # Check permission - requires Client Admin or Org Creator level access
            if not is_client_admin(request.user):
                 return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            # Determine company
            company_id = request.data.get('company')
            if not company_id:
                current_employee = Employee.objects.filter(user=request.user).first()
                if current_employee:
                    company_id = current_employee.company_id
                else:
                    org = Organization.objects.filter(created_by=request.user).first()
                    company_id = org.id if org else None

            if not company_id:
                return Response({'error': 'Company identifier is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Use serializer for validation and save
            # We need to inject company into data or context, or handle in perform_create equivalent
            # But here we can just update the data before passing to serializer or save manually with serializer validation
            
            data = request.data.copy()
            data['company'] = company_id
            
            serializer = DepartmentDetailSerializer(data=data) # Use Detail serializer for creation to accept all fields
            if serializer.is_valid():
                dept = serializer.save(created_by=request.user)
                # Return serialized data matches frontend expectation
                return Response({'success': True, 'id': str(dept.id), **DepartmentListSerializer(dept).data}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
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
            serializer = DepartmentDetailSerializer(dept)
            return Response({'success': True, 'department': serializer.data})
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = DepartmentDetailSerializer(dept, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                dept = serializer.save(updated_by=request.user)
                # Return data in list format for consistent UI update if needed, or Detail format
                # The frontend expects 'success': True, and likely the updated object data
                return Response({'success': True, **DepartmentListSerializer(dept).data})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
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
        # POST requires admin access
        if request.method == 'POST' and not is_client_admin(request.user):
            return Response({'error': 'Admin access required to manage designations'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            # Isolate data by user's company
            current_employee = Employee.objects.filter(user=request.user).first()
            if current_employee:
                user_company_id = current_employee.company_id
            else:
                org = Organization.objects.filter(created_by=request.user).first()
                user_company_id = org.id if org else None

            company_id = request.query_params.get('company', user_company_id)
            queryset = Designation.objects.select_related('company').prefetch_related('roles')
            
            if user_company_id:
                queryset = queryset.filter(company_id=user_company_id)
            elif company_id:
                queryset = queryset.filter(company_id=company_id)
            
            paginator = StandardResultsSetPagination()
            paginated = paginator.paginate_queryset(queryset, request)
            
            serializer = DesignationListSerializer(paginated, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            # Determine company
            company = None
            company_id = request.data.get('company')
            
            if company_id:
                try:
                    company = Organization.objects.get(id=company_id)
                except Organization.DoesNotExist:
                    pass
            
            if not company:
                current_employee = Employee.objects.filter(user=request.user).first()
                if current_employee:
                    company = current_employee.company
                else:
                    company = Organization.objects.filter(created_by=request.user).first()
            
            if not company:
                return Response({'error': 'Company could not be determined'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = DesignationDetailSerializer(data=request.data)
            if serializer.is_valid():
                desig = serializer.save(created_by=request.user, company=company)
                return Response({'success': True, 'id': str(desig.id)}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in designation_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def designation_detail(request, pk):
    """Designation detail operations"""
    try:
        desig = get_object_or_404(Designation.objects.select_related('company').prefetch_related('roles'), pk=pk)
        
        if request.method == 'GET':
            serializer = DesignationDetailSerializer(desig)
            return Response({'success': True, 'designation': serializer.data})
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = DesignationDetailSerializer(desig, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response({'success': True, 'message': 'Designation updated'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            desig.delete()
            return Response({'message': 'Designation deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(f"Error in designation_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def designation_permissions(request, pk):
    """Update permissions for a designation (designation IS the role)"""
    try:
        desig = get_object_or_404(Designation, pk=pk)
        
        # permissions format: [{ permission: uuid, scope: uuid }, ...]
        permissions_data = request.data.get('permissions', [])
        
        with transaction.atomic():
            # Clear existing permissions
            DesignationPermission.objects.filter(designation=desig).delete()
            
            # Create new permissions
            for perm_data in permissions_data:
                perm_id = perm_data.get('permission')
                scope_id = perm_data.get('scope')
                
                if perm_id and scope_id:
                    DesignationPermission.objects.create(
                        designation=desig,
                        permission_id=perm_id,
                        scope_id=scope_id,
                        conditions=perm_data.get('conditions', {})
                    )
                else:
                    logger.warning(f"[designation_permissions] Skipping permission save: Missing ID or Scope. Data: {perm_data}")
            
            desig.updated_by = request.user
            desig.save()
        
        return Response({
            'success': True, 
            'message': f'Permissions updated for {desig.name}',
            'permissions_count': desig.designationpermission_set.count()
        })
    except Exception as e:
        import traceback
        logger.error(f"Error in designation_permissions: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': f'Failed to update permissions: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def permission_list(request):
    """List all available permissions grouped by module"""
    try:
        permissions = Permission.objects.select_related('module').filter(is_active=True).order_by('module__sort_order', 'name')
        serializer = PermissionSerializer(permissions, many=True)
        return Response({'success': True, 'permissions': serializer.data})
    except Exception as e:
        logger.error(f"Error in permission_list: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def datascope_list(request):
    """List all available data scopes"""
    try:
        scopes = DataScope.objects.all().order_by('level')
        serializer = DataScopeSerializer(scopes, many=True)
        return Response({'success': True, 'scopes': serializer.data})
    except Exception as e:
        logger.error(f"Error in datascope_list: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def role_list_create(request):
    """List or create roles"""
    try:
        # Try to get employee, but handle users without employee records (virtual admins)
        employee = Employee.objects.filter(user=request.user).first()
        
        if employee:
            org = employee.company.get_root_parent() if hasattr(employee.company, 'get_root_parent') else employee.company
        else:
            # For users without employee records, get their organization via subscription/other means
            # or just return system roles
            org = None
        
        if request.method == 'GET':
            # Organization-specific roles + system roles
            if org:
                roles = Role.objects.filter(
                    Q(organization=org) | Q(role_type='system'),
                    is_active=True
                ).order_by('name')
            else:
                # Just return system roles for users without org
                roles = Role.objects.filter(role_type='system', is_active=True).order_by('name')
            
            serializer = RoleSerializer(roles, many=True)
            return Response({'success': True, 'roles': serializer.data})
            
        elif request.method == 'POST':
            # Only admins can create roles
            if not is_client_admin(request.user):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
                
            org = employee.company.get_root_parent() if hasattr(employee.company, 'get_root_parent') else employee.company
            
            with transaction.atomic():
                serializer = RoleSerializer(data=request.data)
                if serializer.is_valid():
                    role = serializer.save(
                        organization=org,
                        role_type='custom',
                        created_by=request.user
                    )
                    
                    # Handle permissions mapping if provided
                    permissions_data = request.data.get('permissions', [])
                    for perm_item in permissions_data:
                        RolePermission.objects.create(
                            role=role,
                            permission_id=perm_item.get('permission'),
                            scope_id=perm_item.get('scope'),
                            conditions=perm_item.get('conditions', {})
                        )
                        
                    return Response({'success': True, 'id': str(role.id)}, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in role_list_create: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def role_detail(request, pk):
    """Manage individual role"""
    try:
        employee = get_object_or_404(Employee, user=request.user)
        org = employee.company.get_root_parent()
        
        # Check if role exists and belongs to org (System roles are read-only)
        role = get_object_or_404(Role, pk=pk)
        
        if request.method == 'GET':
            serializer = RoleSerializer(role)
            return Response({'success': True, 'role': serializer.data})
            
        # Prevent modifications to system roles
        if role.role_type == 'system' and request.method != 'GET':
            return Response({'error': 'System roles cannot be modified'}, status=status.HTTP_403_FORBIDDEN)
            
        # Permission Check: Superuser OR (Client Admin AND same organization)
        is_admin = is_client_admin(request.user)
        
        # If not superuser, we must verify the organization match
        if not request.user.is_superuser:
            if not is_admin or role.organization != org:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        if request.method in ['PUT', 'PATCH']:
            serializer = RoleSerializer(role, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                with transaction.atomic():
                    role = serializer.save(updated_by=request.user)
                    
                    # Handle permissions mapping update if provided
                    if 'permissions' in request.data:
                        # Clear existing and re-create (simple approach for now)
                        RolePermission.objects.filter(role=role).delete()
                        permissions_data = request.data.get('permissions', [])
                        for perm_item in permissions_data:
                            RolePermission.objects.create(
                                role=role,
                                permission_id=perm_item.get('permission'),
                                scope_id=perm_item.get('scope'),
                                conditions=perm_item.get('conditions', {})
                            )
                    
                return Response({'success': True, 'message': 'Role updated'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif request.method == 'DELETE':
            role.delete()
            return Response({'message': 'Role deleted'}, status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger.error(f"Error in role_detail: {str(e)}")
        return Response({'error': 'Failed to process request'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== EMPLOYEE MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    """Get the profile of the currently logged-in user"""
    try:
        try:
            employee = Employee.objects.select_related('company', 'department', 'designation', 'reporting_manager').get(user=request.user)
            data = {
                'id': str(employee.id), 'employee_id': employee.employee_id, 'full_name': employee.full_name,
                'first_name': employee.first_name, 'middle_name': employee.middle_name, 'last_name': employee.last_name,
                'email': employee.email, 'phone': employee.phone, 'date_of_birth': str(employee.date_of_birth) if employee.date_of_birth else None,
                'gender': employee.gender, 'company': {'id': str(employee.company.id), 'name': employee.company.name},
                'department': {'id': str(employee.department.id), 'name': employee.department.name} if employee.department else None,
                'designation': {'id': str(employee.designation.id), 'name': employee.designation.name} if employee.designation else None,
                'status': employee.status, 'employment_type': employee.employment_type,
                'is_admin': employee.is_admin,
                'date_of_joining': str(employee.date_of_joining), 'age': employee.age, 'tenure_in_days': employee.tenure_in_days
            }
            return Response({'success': True, 'employee': data})
        except Employee.DoesNotExist:
            # Fallback for users without an employee record (like the registering Admin)
            # Find the organization they created
            main_org = Organization.objects.filter(created_by=request.user).first()
            
            data = {
                'id': None,
                'user_id': str(request.user.id),
                'full_name': request.user.get_full_name() or request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'status': 'active',
                'designation_name': 'Administrator',
                'is_admin': True,
                'role': 'admin',
                'is_virtual': True,
                'company': {'id': str(main_org.id), 'name': main_org.name} if main_org else None
            }
            return Response({'success': True, 'employee': data})
    except Exception as e:
        logger.error(f"Error in get_my_profile: {str(e)}")
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_permissions(request):
    """
    Get the current user's permissions including basic rights and role-based permissions.
    """
    try:
        logger.info(f"[get_my_permissions] Fetching permissions for user: {request.user}")
        
        # Determine organization context
        employee = Employee.objects.filter(user=request.user).first()
        organization = employee.company.get_root_parent() if employee else None
        
        # Use PermissionChecker to get consolidated permissions
        checker = PermissionChecker(request.user, organization, log=False)
        permissions = checker.get_user_permissions()
        
        # Extract straight permission codes for easy frontend checking
        permission_codes = [p['permission'] for p in permissions]
        
        response_data = {
            'success': True,
            'is_admin': is_client_admin(request.user),
            'role': 'admin' if is_client_admin(request.user) else 'employee',
            'designation': employee.designation.name if employee and employee.designation else None,
            'permissions': permissions,
            'permission_codes': permission_codes
        }
        
        logger.info(f"[get_my_permissions] Total permissions: {len(permissions)}")
        return Response(response_data)
        
    except Exception as e:
        import traceback
        logger.error(f"[get_my_permissions] Error: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        import traceback
        logger.error(f"[get_my_permissions] Error: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_create(request):
    """List or create employees"""
    try:
        # POST requires admin access
        if request.method == 'POST' and not is_client_admin(request.user):
            return Response({'error': 'Admin access required to create employees'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            # Determine the user's company to enforce isolation
            current_employee = Employee.objects.filter(user=request.user).first()
            if current_employee:
                user_company_id = current_employee.company_id
            else:
                # Fallback for virtual admins (org creators)
                org = Organization.objects.filter(created_by=request.user).first()
                user_company_id = org.id if org else None

            company_id = request.query_params.get('company', user_company_id)
            department_id = request.query_params.get('department', None)
            status_filter = request.query_params.get('status', None)
            search = request.query_params.get('search', None)
            
            queryset = Employee.objects.select_related('company', 'department', 'designation')
            
            # CRITICAL: Always filter by the user's company (or the requested one if valid)
            if user_company_id:
                 # If user has a company, strict filter. 
                 # Even if they request another company_id via params, they shouldn't see it unless logic allows (e.g. superuser)
                 # For now, we enforce the user's company or the one they manage.
                 queryset = queryset.filter(company_id=user_company_id)
            elif company_id:
                 # Fallback if we couldn't determine user's company but param exists (unsafe generally, but for superadmin maybe)
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
            # Handle empty strings for foreign keys
            # Handle empty strings for foreign keys
            dept_id = request.data.get('department')
            desig_id = request.data.get('designation')
            user_id = request.data.get('user')  # Direct user ID if provided
            
            # Clean empty strings
            if dept_id == '': dept_id = None
            if desig_id == '': desig_id = None
            if user_id == '': user_id = None

            # Infer Company ID
            company_id = request.data.get('company')
            if not company_id:
                current_employee = Employee.objects.filter(user=request.user).first()
                if current_employee:
                    company_id = current_employee.company_id
                else:
                    org = Organization.objects.filter(created_by=request.user).first()
                    company_id = org.id if org else None
            
            if not company_id:
                return Response({'error': 'Company is required'}, status=status.HTTP_400_BAD_REQUEST)

             # Handle User Account Creation
            username = request.data.get('username')
            password = request.data.get('password')
            enable_login = request.data.get('enable_login')

            if enable_login and username and (password or not user_id):
                # If creating new user or updating
                if User.objects.filter(username=username).exists():
                     return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    user = User.objects.create_user(username=username, email=request.data.get('email'), password=password)
                    user_id = user.id
                    logger.info(f"[employee_create] Created user: {username} (ID: {user_id})")
                except Exception as e:
                    logger.error(f"[employee_create] Failed to create user: {str(e)}")
                    return Response({'error': f'Failed to create user account: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            # Generate employee_id if not provided
            employee_id_val = request.data.get('employee_id', '').strip()
            if not employee_id_val:
                # Auto-generate: EMP + timestamp + random digits
                import random
                employee_id_val = f"EMP{timezone.now().strftime('%y%m%d')}{random.randint(1000, 9999)}"
                logger.info(f"[employee_create] Auto-generated employee_id: {employee_id_val}")

            logger.info(f"[employee_create] Creating employee with data:")
            logger.info(f"  - company_id: {company_id}")
            logger.info(f"  - employee_id: {employee_id_val}")
            logger.info(f"  - first_name: {request.data.get('first_name')}")
            logger.info(f"  - email: {request.data.get('email')}")
            logger.info(f"  - department_id: {dept_id}")
            logger.info(f"  - designation_id: {desig_id}")
            logger.info(f"  - is_admin: {request.data.get('is_admin', False)}")

            emp = Employee.objects.create(
                company_id=company_id, 
                user_id=user_id,
                employee_id=employee_id_val,
                first_name=request.data.get('first_name'), 
                last_name=request.data.get('last_name', ''),
                email=request.data.get('email'), 
                phone=request.data.get('phone', ''),
                department_id=dept_id, 
                designation_id=desig_id,
                date_of_joining=request.data.get('date_of_joining') or timezone.now().date(),
                status='active', 
                is_admin=request.data.get('is_admin', False),
                created_by=request.user
            )
            logger.info(f"[employee_create] ✓ SUCCESS: Created employee {emp.full_name} (ID: {emp.id})")
            
            # Log activity
            log_activity(
                user=request.user,
                action_type='CREATE',
                module='EMPLOYEE',
                description=f"Created employee profile for '{emp.full_name}' ({emp.employee_id})",
                reference_id=str(emp.id),
                new_value={'employee_id': emp.employee_id, 'email': emp.email, 'department': str(emp.department_id)},
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'success': True, 'id': str(emp.id), 'employee_id': emp.employee_id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        logger.error(f"[employee_list_create] ✗ ERROR: {str(e)}")
        logger.error(f"[employee_list_create] Traceback:\n{traceback.format_exc()}")
        return Response({'error': f'Failed to process request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
    """Employee detail operations"""
    try:
        emp = get_object_or_404(Employee.objects.select_related('company', 'department', 'designation', 'reporting_manager'), pk=pk)
        
        if request.method == 'GET':
            from .serializers import EmployeeDetailSerializer
            serializer = EmployeeDetailSerializer(emp)
            return Response({'success': True, 'employee': serializer.data})
        
        elif request.method in ['PUT', 'PATCH']:
            # Create a mutable copy of data
            data = request.data.copy()
            
            # Clean empty strings for Foreign Keys/Date fields to avoid validation errors
            nullable_fields = ['department', 'designation', 'reporting_manager', 'date_of_birth', 
                             'date_of_joining', 'confirmation_date', 'resignation_date', 
                             'last_working_date', 'termination_date']
            
            for field in nullable_fields:
                if field in data and (data[field] == '' or data[field] == 'null'):
                    data[field] = None

            # Map 'bank_ifsc' to 'bank_ifsc_code' if present (frontend compatibility)
            if 'bank_ifsc' in data:
                data['bank_ifsc_code'] = data.pop('bank_ifsc')

            from .serializers import EmployeeDetailSerializer
            serializer = EmployeeDetailSerializer(emp, data=data, partial=(request.method == 'PATCH'))
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                
                # Handle User Account Creation/Update
                enable_login = request.data.get('enable_login')
                username = request.data.get('username')
                password = request.data.get('password')
                
                if enable_login:
                    if not emp.user:
                        # Employee doesn't have a user account, create one
                        if not username:
                            username = emp.email  # Default to email as username
                        
                        if User.objects.filter(username=username).exists():
                            # If username exists, check if it's the same user (unlikely if emp.user is None)
                             pass # Ideally return error, but we already saved employee profile. 
                             # For now, let's just log or ignore collision to avoid crashing the whole update?
                             # Better: Check before serializer save? 
                             # Given existing logic, we'll try to create and fail gracefully if duplicate.
                        
                        if not User.objects.filter(username=username).exists():
                             try:
                                user = User.objects.create_user(
                                    username=username, 
                                    email=emp.email, 
                                    password=password,
                                    first_name=emp.first_name,
                                    last_name=emp.last_name or ''
                                )
                                emp.user = user
                                emp.save()
                             except Exception as e:
                                logger.error(f"Failed to create user for employee {emp.id}: {e}")
                    else:
                        # Employee already has a user account, update password if provided
                        if password:
                            emp.user.set_password(password)
                            emp.user.save()
                
                # Log activity
                log_activity(
                    user=request.user,
                    action_type='UPDATE',
                    module='EMPLOYEE',
                    description=f"Updated employee profile for '{emp.full_name}'",
                    reference_id=str(emp.id),
                    new_value=data, # For simplicity, logging the incoming request data
                    ip_address=request.META.get('REMOTE_ADDR')
                )
            
                return Response({'success': True, 'message': 'Employee updated', 'has_user': emp.user is not None})
            else:
                return Response({'error': str(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            full_name = emp.full_name
            emp_id = emp.id
            emp.delete()
            
            # Log activity
            log_activity(
                user=request.user,
                action_type='DELETE',
                module='EMPLOYEE',
                description=f"Deleted employee profile for '{full_name}'",
                reference_id=str(emp_id),
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'message': 'Employee deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        import traceback
        logger.error(f"Error in employee_detail: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': f'Failed to process request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                    'document_file': request.build_absolute_uri(d.document_file.url) if d.document_file else None,
                    'created_at': str(d.created_at) if d.created_at else None,
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

# ==================== SUPER ADMIN ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """List all users (Super Admin only)"""
    print(f"DEBUG: user_list called by {request.user.email} (ID: {request.user.id})")
    print(f"DEBUG: is_superuser: {request.user.is_superuser}, is_staff: {request.user.is_staff}")
    
    if not request.user.is_superuser:
        print("DEBUG: Access Denied")
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by('-date_joined')
    data = [{
        'id': str(u.id),
        'email': u.email,
        'name': f"{u.first_name} {u.last_name}",
        'is_active': u.is_active,
        'is_staff': u.is_staff,
        'is_superuser': u.is_superuser,
        'last_login': str(u.last_login) if u.last_login else None,
        'date_joined': str(u.date_joined)
    } for u in users]
    
    return Response({'success': True, 'results': data})


# ==================== ORGANIZATION REGISTRATION APPROVALS ====================

from .models import OrganizationRegistration
from .serializers import (
    OrganizationRegistrationListSerializer,
    OrganizationRegistrationDetailSerializer,
    OrganizationRegistrationCreateSerializer
)
from .emails import send_registration_confirmation, send_login_credentials, send_registration_rejected

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_organization_registration(request):
    """
    Public endpoint for submitting organization registration requests.
    No password is collected - credentials will be generated upon approval.
    """
    try:
        serializer = OrganizationRegistrationCreateSerializer(data=request.data)
        if serializer.is_valid():
            registration = serializer.save()
            logger.info(f"Organization registration submitted: {registration.organization_name}")
            
            # Send confirmation email
            send_registration_confirmation(
                admin_email=registration.admin_email,
                admin_name=registration.admin_name,
                organization_name=registration.organization_name
            )
            
            return Response({
                'success': True,
                'message': 'Registration submitted successfully. Awaiting admin approval.',
                'registration_id': str(registration.id)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Registration submission error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to submit registration'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_registrations_list(request):
    """
    List pending organization registrations (Super Admin only).
    """
    if not request.user.is_superuser:
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        status_filter = request.query_params.get('status', 'pending')
        registrations = OrganizationRegistration.objects.filter(status=status_filter).order_by('-created_at')
        serializer = OrganizationRegistrationListSerializer(registrations, many=True)
        return Response({
            'success': True,
            'results': serializer.data,
            'count': registrations.count()
        })
    except Exception as e:
        logger.error(f"Error fetching registrations: {str(e)}")
        return Response({'error': 'Failed to fetch registrations'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def registration_detail(request, pk):
    """
    Get registration detail (Super Admin only).
    """
    if not request.user.is_superuser:
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        registration = get_object_or_404(OrganizationRegistration, pk=pk)
        serializer = OrganizationRegistrationDetailSerializer(registration)
        return Response({'success': True, 'registration': serializer.data})
    except Exception as e:
        logger.error(f"Error fetching registration detail: {str(e)}")
        return Response({'error': 'Failed to fetch registration'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_registration(request, pk):
    """
    Approve organization registration and create credentials (Super Admin only).
    This will:
    1. Create the Organization
    2. Create the admin User with auto-generated password
    3. Create the admin Employee record
    4. Send credentials via email (simulated for now)
    """
    if not request.user.is_superuser:
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        registration = get_object_or_404(OrganizationRegistration, pk=pk)
        
        if registration.status != 'pending':
            return Response({'error': 'Registration already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Generate password
            generated_password = secrets.token_urlsafe(12)
            
            # Create user
            username = registration.admin_email.split('@')[0] + '_' + secrets.token_hex(4)
            name_parts = registration.admin_name.split()
            user = User.objects.create_user(
                username=username,
                email=registration.admin_email,
                password=generated_password,
                first_name=name_parts[0] if name_parts else '',
                last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            )
            
            # Create organization
            slug = slugify(registration.organization_name)
            if Organization.objects.filter(slug=slug).exists():
                slug = f"{slug}-{secrets.token_hex(3)}"
            
            organization = Organization.objects.create(
                name=registration.organization_name,
                slug=slug,
                email=registration.admin_email,
                phone=registration.admin_phone,
                industry=registration.industry,
                is_parent=True,
                is_active=True,
                is_verified=True,
                verified_at=timezone.now(),
                created_by=user
            )
            
            # Create trial subscription
            trial_package, _ = Package.objects.get_or_create(
                package_type='free_trial',
                defaults={
                    'name': 'Free Trial',
                    'monthly_price': 0,
                    'trial_days': 14,
                    'max_employees': 50,
                    'max_companies': 1,
                    'features': {'payroll': True, 'attendance': True, 'leave_management': True}
                }
            )
            
            trial_end = timezone.now().date() + timedelta(days=trial_package.trial_days)
            Subscription.objects.create(
                organization=organization,
                package=trial_package,
                status='trial',
                billing_cycle='monthly',
                start_date=timezone.now().date(),
                trial_end_date=trial_end,
                current_period_start=timezone.now().date(),
                current_period_end=trial_end,
                price=0,
                employee_count=1,
                company_count=1,
                billing_email=registration.admin_email,
                billing_name=registration.admin_name,
                created_by=user
            )
            
            # Create admin designation
            admin_designation, _ = Designation.objects.get_or_create(
                company=organization,
                code='admin',
                defaults={
                    'name': 'Administrator',
                    'description': 'Organization Administrator',
                    'level': 1,
                    'is_active': True,
                    'is_managerial': True,
                    'created_by': user
                }
            )
            
            # Create admin employee
            employee_id = f"EMP-{organization.id.hex[:8].upper()}-001"
            Employee.objects.create(
                user=user,
                company=organization,
                employee_id=employee_id,
                first_name=name_parts[0] if name_parts else '',
                last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
                email=registration.admin_email,
                phone=registration.admin_phone,
                date_of_joining=timezone.now().date(),
                status='active',
                employment_type='permanent',
                designation=admin_designation,
                is_admin=True,
                created_by=user
            )
            
            # Create subsidiaries if multi-company
            if registration.is_multi_company and registration.subsidiaries:
                for sub_data in registration.subsidiaries:
                    if sub_data.get('name'):
                        sub_slug = slugify(sub_data['name'])
                        if Organization.objects.filter(slug=sub_slug).exists():
                            sub_slug = f"{sub_slug}-{secrets.token_hex(3)}"
                        Organization.objects.create(
                            name=sub_data['name'],
                            slug=sub_slug,
                            is_parent=False,
                            parent=organization,
                            is_active=True,
                            created_by=user
                        )
            
            # Update registration status
            registration.status = 'approved'
            registration.reviewed_by = request.user
            registration.reviewed_at = timezone.now()
            registration.organization = organization
            registration.save()
            
            # Send login credentials email
            email_sent = send_login_credentials(
                admin_email=registration.admin_email,
                admin_name=registration.admin_name,
                organization_name=registration.organization_name,
                username=registration.admin_email,
                password=generated_password,
                login_url="http://localhost:3000/login"  # Update for production
            )
            
            if email_sent:
                logger.info(f"Organization approved and credentials sent: {organization.name}")
            else:
                logger.warning(f"Organization approved but email failed: {organization.name}. Password: {generated_password}")
            
            NotificationPreference.objects.create(user=user)
        
        return Response({
            'success': True,
            'message': f'Organization "{registration.organization_name}" approved successfully!',
            'credentials_sent_to': registration.admin_email,
            'organization_id': str(organization.id)
        })
    except Exception as e:
        logger.error(f"Approval error: {str(e)}", exc_info=True)
        return Response({'error': 'Failed to approve registration'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_registration(request, pk):
    """
    Reject organization registration (Super Admin only).
    """
    if not request.user.is_superuser:
        return Response({'error': 'Super Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        registration = get_object_or_404(OrganizationRegistration, pk=pk)
        
        if registration.status != 'pending':
            return Response({'error': 'Registration already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        registration.status = 'rejected'
        registration.reviewed_by = request.user
        registration.reviewed_at = timezone.now()
        registration.rejection_reason = request.data.get('rejection_reason', '')
        registration.save()
        
        # Send rejection email
        send_registration_rejected(
            admin_email=registration.admin_email,
            admin_name=registration.admin_name,
            organization_name=registration.organization_name,
            rejection_reason=registration.rejection_reason
        )
        
        logger.info(f"Organization rejected: {registration.organization_name}")
        
        return Response({
            'success': True,
            'message': f'Registration for "{registration.organization_name}" has been rejected.'
        })
    except Exception as e:
        logger.error(f"Rejection error: {str(e)}")
        return Response({'error': 'Failed to reject registration'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

