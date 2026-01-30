from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.db import models
from functools import wraps
from rest_framework.response import Response
from rest_framework import status as http_status
import logging
import traceback

# Set up logger for this module
logger = logging.getLogger(__name__)

# Import models here to avoid circular imports at module level
def _get_models():
    from .models import (
        UserRole, UserPermission, RolePermission, Permission,
        DataScope, PermissionAuditLog, Employee, Organization
    )
    return {
        'UserRole': UserRole,
        'UserPermission': UserPermission,
        'RolePermission': RolePermission,
        'Permission': Permission,
        'DataScope': DataScope,
        'PermissionAuditLog': PermissionAuditLog,
        'Employee': Employee,
        'Organization': Organization
    }


# ==================== QUICK HELPER FUNCTIONS ====================

def is_org_creator(user):
    """Check if user is the organization creator (super admin)"""
    try:
        if not user or not user.is_authenticated:
            logger.debug(f"[is_org_creator] User not authenticated: {user}")
            return False
        
        models = _get_models()
        Organization = models['Organization']
        
        result = Organization.objects.filter(created_by=user).exists()
        logger.info(f"[is_org_creator] User: {user.username} (ID: {user.id}) -> {result}")
        
        # Also log the orgs this user created
        if result:
            orgs = Organization.objects.filter(created_by=user).values_list('name', 'id')
            logger.info(f"[is_org_creator] User created orgs: {list(orgs)}")
        
        return result
    except Exception as e:
        logger.error(f"[is_org_creator] ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def is_client_admin(user):
    """
    Check if user is a Client Administrator.
    Returns True if:
    - User is a Django superuser, OR
    - User is the organization creator, OR
    - User's employee record has is_admin=True
    """
    try:
        logger.info(f"[is_client_admin] ===== Checking admin status for user =====")
        
        if not user:
            logger.warning(f"[is_client_admin] User is None")
            return False
            
        if not user.is_authenticated:
            logger.warning(f"[is_client_admin] User not authenticated")
            return False
        
        logger.info(f"[is_client_admin] User: {user.username} (ID: {user.id})")
        logger.info(f"[is_client_admin] is_superuser: {user.is_superuser}")
        logger.info(f"[is_client_admin] is_staff: {user.is_staff}")
        
        # Superusers and staff are always admins in this environment
        if user.is_superuser or user.is_staff:
            logger.info(f"[is_client_admin] ✓ GRANTED: User is superuser/staff")
            return True
            
        # Check if org creator
        if is_org_creator(user):
            logger.info(f"[is_client_admin] ✓ GRANTED: User is org creator")
            return True
        
        # Check employee is_admin flag
        models = _get_models()
        Employee = models['Employee']
        
        try:
            employee = Employee.objects.select_related('company', 'designation').get(user=user)
            logger.info(f"[is_client_admin] Found employee: {employee.full_name} (ID: {employee.id})")
            logger.info(f"[is_client_admin] employee.is_admin: {employee.is_admin}")
            logger.info(f"[is_client_admin] employee.company: {employee.company.name if employee.company else 'None'}")
            logger.info(f"[is_client_admin] employee.designation: {employee.designation.name if employee.designation else 'None'}")
            
            if employee.is_admin:
                logger.info(f"[is_client_admin] ✓ GRANTED: Employee has is_admin=True")
                return True
        except Employee.DoesNotExist:
            logger.warning(f"[is_client_admin] No employee record found for user {user.username}")
        except Exception as e:
            logger.error(f"[is_client_admin] Error fetching employee: {str(e)}")
            logger.error(traceback.format_exc())
        
        logger.info(f"[is_client_admin] ✗ DENIED: User is not an admin")
        return False
        
    except Exception as e:
        logger.error(f"[is_client_admin] CRITICAL ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def require_admin():
    """
    Decorator for DRF views to require client admin access.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            logger.info(f"[require_admin] Checking admin for: {request.user} on {request.method} {request.path}")
            
            if not is_client_admin(request.user):
                logger.warning(f"[require_admin] ✗ ACCESS DENIED for user {request.user}")
                return Response(
                    {'error': 'Admin access required'},
                    status=http_status.HTTP_403_FORBIDDEN
                )
            
            logger.info(f"[require_admin] ✓ ACCESS GRANTED for user {request.user}")
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


class PermissionChecker:
    """Central permission checking system"""
    
    def __init__(self, user, organization=None, log=True):
        self.user = user
        self.organization = organization
        self.log = log
        self._cache = {}
        self._models = _get_models()  # Lazy load models
        
    def has_permission(self, permission_code, scope_required='self', obj=None, **kwargs):
        """
        Check if user has a specific permission
        
        Args:
            permission_code: str - Permission code (e.g., 'leave.approve_leave')
            scope_required: str - Required scope level
            obj: object - Object being accessed (for scope checking)
            **kwargs: Additional context
            
        Returns:
            bool - True if user has permission
        """
        logger.debug(f"[PermissionChecker] Checking '{permission_code}' with scope '{scope_required}'")
        
        cache_key = f"{permission_code}:{scope_required}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = self._check_permission(permission_code, scope_required, obj, **kwargs)
        self._cache[cache_key] = result
        
        # Log permission check
        if self.log:
            self._log_permission_check(permission_code, result, scope_required)
        
        logger.debug(f"[PermissionChecker] Result for '{permission_code}': {result}")
        return result
    
    def _check_permission(self, permission_code, scope_required, obj, **kwargs):
        """Internal permission checking logic"""
        Permission = self._models['Permission']
        try:
            permission = Permission.objects.get(code=permission_code, is_active=True)
        except Permission.DoesNotExist:
            return False
        
        # 1. Check direct permissions (GRANT/REVOKE)
        direct_permission = self._check_direct_permission(permission, scope_required)
        if direct_permission is not None:
            return direct_permission
        
        # 2. Check role-based permissions
        role_permission = self._check_role_permission(permission, scope_required, obj)
        
        return role_permission
    
    def _check_direct_permission(self, permission, scope_required):
        """Check UserPermission for direct grants/revokes"""
        now = timezone.now()
        
        # Check for active direct permissions
        direct_perms = UserPermission.objects.filter(
            user=self.user,
            permission=permission,
            is_active=True,
            organization=self.organization
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        )
        
        # Check for explicit revoke
        if direct_perms.filter(grant_type='revoke').exists():
            return False
        
        # Check for explicit grant with sufficient scope
        granted = direct_perms.filter(grant_type='grant')
        if granted.exists():
            for perm in granted:
                if self._has_sufficient_scope(perm.scope.code, scope_required):
                    return True
        
        return None  # No direct permission found
    
    def _check_role_permission(self, permission, scope_required, obj):
        """Check permission through user roles (direct and designation-based)"""
        now = timezone.now()
        
        # 1. Get active direct user roles
        direct_roles = UserRole.objects.filter(
            user=self.user,
            is_active=True,
            organization=self.organization
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        ).select_related('role', 'scope_override')
        
        # 2. Get roles from user's designation
        designation_roles = []
        try:
            employee = Employee.objects.select_related('designation').get(user=self.user)
            if employee.designation:
                designation_roles = employee.designation.roles.filter(is_active=True)
        except Employee.DoesNotExist:
            pass

        # 3. Check direct roles first (they might have scope overrides)
        for user_role in direct_roles:
            role_perm = RolePermission.objects.filter(
                role=user_role.role,
                permission=permission
            ).select_related('scope').first()
            
            if role_perm:
                effective_scope = (
                    user_role.scope_override.code if user_role.scope_override
                    else role_perm.scope.code
                )
                if self._has_sufficient_scope(effective_scope, scope_required):
                    if obj and not self._check_object_scope(obj, effective_scope, user_role):
                        continue
                    return True

        # 4. Check designation-based roles
        for role in designation_roles:
            role_perm = RolePermission.objects.filter(
                role=role,
                permission=permission
            ).select_related('scope').first()
            
            if role_perm:
                effective_scope = role_perm.scope.code
                if self._has_sufficient_scope(effective_scope, scope_required):
                    if obj and not self._check_object_scope(obj, effective_scope, None):
                        continue
                    return True
        
        return False
    
    def _has_sufficient_scope(self, granted_scope, required_scope):
        """Check if granted scope is sufficient for required scope"""
        scope_hierarchy = {
            'self': 1,
            'team': 2,
            'department': 3,
            'branch': 4,
            'company': 5,
            'organization': 6,
            'global': 7
        }
        
        granted_level = scope_hierarchy.get(granted_scope, 0)
        required_level = scope_hierarchy.get(required_scope, 0)
        
        return granted_level >= required_level
    
    def _check_object_scope(self, obj, scope, user_role):
        """Check if user can access object based on scope"""
        try:
            employee = Employee.objects.select_related(
                'company', 'department', 'reporting_manager'
            ).get(user=self.user)
        except Employee.DoesNotExist:
            return False
        
        if scope == 'self':
            # Can only access own data
            return getattr(obj, 'user', None) == self.user or obj == employee
        
        elif scope == 'team':
            # Can access subordinates' data
            if hasattr(obj, 'reporting_manager'):
                return obj.reporting_manager == employee
            return False
        
        elif scope == 'department':
            # Can access department data
            if hasattr(obj, 'department'):
                return obj.department == employee.department
            return False
        
        elif scope == 'company':
            # Can access company data
            if hasattr(obj, 'company'):
                return obj.company == employee.company
            return False
        
        elif scope == 'organization':
            # Can access organization data
            if hasattr(obj, 'company'):
                root_org = employee.company.get_root_parent()
                obj_org = obj.company.get_root_parent()
                return obj_org == root_org
            return False
        
        elif scope in ['branch', 'global']:
            # Branch and global always allowed if permission exists
            return True
        
        return False
    
    def _log_permission_check(self, permission_code, result, scope):
        """Log permission check for audit"""
        try:
            permission = Permission.objects.get(code=permission_code)
            PermissionAuditLog.objects.create(
                user=self.user,
                action='check',
                permission=permission,
                result=result,
                scope_used=scope
            )
        except:
            pass  # Don't fail on logging errors
    
    def get_user_permissions(self):
        """Get all permissions for user (direct, role-based, and designation-based)"""
        permissions_dict = {}  # Use dict to avoid duplicates
        
        # 1. Get from active direct roles
        now = timezone.now()
        user_roles = UserRole.objects.filter(
            user=self.user,
            is_active=True,
            organization=self.organization
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        ).select_related('role', 'scope_override')
        
        for user_role in user_roles:
            role_perms = RolePermission.objects.filter(
                role=user_role.role
            ).select_related('permission', 'permission__module', 'scope')
            
            for rp in role_perms:
                scope = user_role.scope_override.code if user_role.scope_override else rp.scope.code
                perm_code = rp.permission.code
                
                # Keep highest scope if permission exists
                if perm_code not in permissions_dict or self._has_sufficient_scope(scope, permissions_dict[perm_code]['scope']):
                    permissions_dict[perm_code] = {
                        'permission': perm_code,
                        'name': rp.permission.name,
                        'module': rp.permission.module.name,
                        'scope': scope,
                        'source': f"Role: {user_role.role.name}"
                    }
        
        # 2. Get from designation-based roles
        try:
            employee = Employee.objects.select_related('designation').get(user=self.user)
            if employee.designation:
                designation_roles = employee.designation.roles.filter(is_active=True)
                for role in designation_roles:
                    role_perms = RolePermission.objects.filter(
                        role=role
                    ).select_related('permission', 'permission__module', 'scope')
                    
                    for rp in role_perms:
                        perm_code = rp.permission.code
                        scope = rp.scope.code
                        
                        if perm_code not in permissions_dict or self._has_sufficient_scope(scope, permissions_dict[perm_code]['scope']):
                            permissions_dict[perm_code] = {
                                'permission': perm_code,
                                'name': rp.permission.name,
                                'module': rp.permission.module.name,
                                'scope': scope,
                                'source': f"Designation: {employee.designation.name}"
                            }
        except Employee.DoesNotExist:
            pass
        
        # 3. Get direct permissions
        direct_perms = UserPermission.objects.filter(
            user=self.user,
            is_active=True,
            grant_type='grant',
            organization=self.organization
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        ).select_related('permission', 'permission__module', 'scope')
        
        for dp in direct_perms:
            perm_code = dp.permission.code
            scope = dp.scope.code
            
            if perm_code not in permissions_dict or self._has_sufficient_scope(scope, permissions_dict[perm_code]['scope']):
                permissions_dict[perm_code] = {
                    'permission': perm_code,
                    'name': dp.permission.name,
                    'module': dp.permission.module.name,
                    'scope': scope,
                    'source': 'Direct Grant'
                }
        
        # 4. Handle revokes (removing from the set)
        revoked_perms = UserPermission.objects.filter(
            user=self.user,
            is_active=True,
            grant_type='revoke',
            organization=self.organization
        ).values_list('permission__code', flat=True)
        
        for code in revoked_perms:
            if code in permissions_dict:
                del permissions_dict[code]
        
        return list(permissions_dict.values())

    def get_user_roles(self):
        """Get all roles for user (direct and designation-based)"""
        roles_info = []
        
        # Direct roles
        now = timezone.now()
        direct_roles = UserRole.objects.filter(
            user=self.user,
            is_active=True,
            organization=self.organization
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now)
        ).select_related('role', 'scope_override')
        
        for ur in direct_roles:
            roles_info.append({
                'id': ur.role.id,
                'name': ur.role.name,
                'code': ur.role.code,
                'type': ur.role.role_type,
                'source': 'direct',
                'scope_override': ur.scope_override.code if ur.scope_override else None
            })
            
        # Designation roles
        try:
            employee = Employee.objects.select_related('designation').get(user=self.user)
            if employee.designation:
                designation_roles = employee.designation.roles.filter(is_active=True)
                for role in designation_roles:
                    # Avoid duplicates if already directly assigned
                    if not any(r['id'] == role.id for r in roles_info):
                        roles_info.append({
                            'id': role.id,
                            'name': role.name,
                            'code': role.code,
                            'type': role.role_type,
                            'source': 'designation',
                            'designation': employee.designation.name
                        })
        except Employee.DoesNotExist:
            pass
            
        return roles_info


# ==================== DECORATORS ====================

def require_permission(permission_code, scope='self', raise_exception=True):
    """
    Decorator to check permission before view execution
    
    Usage:
        @require_permission('leave.approve_leave', scope='department')
        def approve_leave(request, leave_id):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Get organization from request or employee
            organization = getattr(request, 'organization', None)
            if not organization:
                try:
                    employee = Employee.objects.get(user=request.user)
                    organization = employee.company.get_root_parent()
                except Employee.DoesNotExist:
                    if raise_exception:
                        raise PermissionDenied("Employee profile not found")
                    return None
            
            # Check permission
            checker = PermissionChecker(request.user, organization)
            
            # Get object if provided in kwargs
            obj = kwargs.get('obj', None)
            
            if not checker.has_permission(permission_code, scope, obj):
                if raise_exception:
                    raise PermissionDenied(f"Permission denied: {permission_code}")
                return None
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def permission_required(permission_codes, scope='self', require_all=True):
    """
    Check multiple permissions
    
    Usage:
        @permission_required(['leave.view_leave', 'leave.approve_leave'], scope='department')
        def view_function(request):
            ...
    """
    if isinstance(permission_codes, str):
        permission_codes = [permission_codes]
    
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                employee = Employee.objects.get(user=request.user)
                organization = employee.company.get_root_parent()
            except Employee.DoesNotExist:
                raise PermissionDenied("Employee profile not found")
            
            checker = PermissionChecker(request.user, organization)
            obj = kwargs.get('obj', None)
            
            results = [
                checker.has_permission(perm, scope, obj)
                for perm in permission_codes
            ]
            
            if require_all:
                has_access = all(results)
            else:
                has_access = any(results)
            
            if not has_access:
                raise PermissionDenied("Insufficient permissions")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


# ==================== HELPER FUNCTIONS ====================

def check_permission(user, permission_code, organization=None, scope='self', obj=None):
    """Standalone permission check function"""
    checker = PermissionChecker(user, organization, log=False)
    return checker.has_permission(permission_code, scope, obj)


def get_user_module_permissions(user, module_code, organization=None):
    """Get all permissions for a specific module"""
    checker = PermissionChecker(user, organization, log=False)
    all_perms = checker.get_user_permissions()
    
    return [
        p for p in all_perms
        if p['permission'].startswith(f"{module_code}.")
    ]


def assign_role(user, role, organization=None, department=None, scope_override=None, created_by=None):
    """Helper to assign role to user"""
    from .models import Role
    
    user_role, created = UserRole.objects.get_or_create(
        user=user,
        role=role,
        organization=organization,
        department=department,
        defaults={
            'scope_override': scope_override,
            'is_active': True,
            'created_by': created_by
        }
    )
    
    if not created and not user_role.is_active:
        user_role.is_active = True
        user_role.save()
    
    # Log role assignment
    PermissionAuditLog.objects.create(
        user=user,
        action='role_assign',
        role=role,
        result=True,
        metadata={'created_by': created_by.email if created_by else None}
    )
    
    return user_role


def remove_role(user, role, organization=None, department=None):
    """Helper to remove role from user"""
    try:
        user_role = UserRole.objects.get(
            user=user,
            role=role,
            organization=organization,
            department=department
        )
        user_role.is_active = False
        user_role.save()
        
        # Log role removal
        PermissionAuditLog.objects.create(
            user=user,
            action='role_remove',
            role=role,
            result=True
        )
        
        return True
    except UserRole.DoesNotExist:
        return False
