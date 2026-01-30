from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.db import models
from functools import wraps
from rest_framework.response import Response
from rest_framework import status as http_status
import logging
import traceback

logger = logging.getLogger(__name__)

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

# ==================== BASIC EMPLOYEE RIGHTS ====================

EMPLOYEE_BASIC_RIGHTS = {
    # Profile
    'view_own_profile': True,
    'edit_own_basic_profile': True,  # Name, photo, contact only
    
    # Attendance
    'view_own_attendance': True,
    'clock_in': True,
    'clock_out': True,
    'view_attendance_summary': True,
    
    # Leave
    'view_own_leave': True,
    'request_leave': True,
    'cancel_own_leave': True,
    
    # Payroll
    'view_own_payslip': True,
    'download_own_payslip': True,
    
    # Dashboard
    'view_dashboard': True,
    'view_announcements': True,
    
    # Documents
    'view_own_documents': True,
    'upload_own_documents': True,
}

def has_basic_right(user, action):
    """
    Check if user has basic employee right (auto-granted to all active employees).
    These rights do NOT need permission checks.
    """
    if action not in EMPLOYEE_BASIC_RIGHTS:
        return False
    
    try:
        models = _get_models()
        Employee = models['Employee']
        # Check for any active employee record for this user
        employee = Employee.objects.filter(user=user, status='active').first()
        if employee:
            logger.debug(f"✓ Basic right '{action}' granted to {user.email}")
            return True
        return False
    except Exception as e:
        logger.debug(f"✗ Basic right '{action}' check failed: {str(e)}")
        return False

# ==================== QUICK HELPER FUNCTIONS ====================

def is_org_creator(user):
    """Check if user is the organization creator"""
    try:
        if not user or not user.is_authenticated:
            return False
        models = _get_models()
        Organization = models['Organization']
        return Organization.objects.filter(created_by=user).exists()
    except Exception as e:
        logger.error(f"[is_org_creator] ERROR: {str(e)}")
        return False

def is_client_admin(user):
    """
    Check if user is a Client Administrator.
    Admins have ALL permissions automatically.
    """
    try:
        if not user or not user.is_authenticated:
            return False
        
        # Superusers are always admins
        if user.is_superuser:
            return True
            
        # Check if org creator
        if is_org_creator(user):
            return True
        
        # Check employee is_admin flag
        models = _get_models()
        Employee = models['Employee']
        
        try:
            employee = Employee.objects.get(user=user)
            return employee.is_admin
        except Employee.DoesNotExist:
            return False
            
    except Exception as e:
        logger.error(f"[is_client_admin] ERROR: {str(e)}")
        return False

def require_admin():
    """Decorator for DRF views to require admin access"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not is_client_admin(request.user):
                return Response(
                    {'error': 'Admin access required'},
                    status=http_status.HTTP_403_FORBIDDEN
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

# ==================== ENHANCED PERMISSION CHECKER ====================

class PermissionChecker:
    """Enhanced permission checking with basic rights support"""
    
    def __init__(self, user, organization=None, log=True):
        self.user = user
        self.organization = organization
        self.log = log
        self._cache = {}
        self._models = _get_models()
        
    def has_permission(self, permission_code, scope_required='self', obj=None, **kwargs):
        """
        Check if user has permission.
        
        Priority Order:
        1. Basic Employee Rights (auto-granted)
        2. Admin Rights (all permissions)
        3. Role-based Permissions
        """
        logger.debug(f"[PermissionChecker] Checking '{permission_code}' for {self.user.email}")
        
        # 1. Check if it's a basic employee right
        if has_basic_right(self.user, permission_code):
            logger.debug(f"✓ Basic right granted")
            return True
        
        # 2. Check if user is admin (admins have ALL permissions)
        if is_client_admin(self.user):
            logger.debug(f"✓ Admin access - all permissions granted")
            return True
        
        # 3. Check role-based permissions
        cache_key = f"{permission_code}:{scope_required}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = self._check_role_permissions(permission_code, scope_required, obj)
        self._cache[cache_key] = result
        
        if self.log:
            self._log_permission_check(permission_code, result, scope_required)
        
        logger.debug(f"[PermissionChecker] Result: {result}")
        return result
    
    def _check_role_permissions(self, permission_code, scope_required, obj):
        """Check permission through user roles"""
        Permission = self._models['Permission']
        RolePermission = self._models['RolePermission']
        Employee = self._models['Employee']
        
        try:
            permission = Permission.objects.get(code=permission_code, is_active=True)
        except Permission.DoesNotExist:
            logger.warning(f"Permission '{permission_code}' not found")
            return False
        
        # Get user's employee record
        try:
            employee = Employee.objects.select_related('designation').get(user=self.user)
        except Employee.DoesNotExist:
            logger.warning(f"No employee record for {self.user.email}")
            return False
        
        # Check designation-based permissions
        if employee.designation:
            # Get roles mapped to designation
            roles = employee.designation.roles.filter(is_active=True)
            
            for role in roles:
                role_perm = RolePermission.objects.filter(
                    role=role,
                    permission=permission
                ).select_related('scope').first()
                
                if role_perm:
                    if self._has_sufficient_scope(role_perm.scope.code, scope_required):
                        if obj and not self._check_object_scope(obj, role_perm.scope.code, employee):
                            continue
                        logger.debug(f"✓ Permission granted via role: {role.name}")
                        return True
        
        logger.debug(f"✗ Permission denied - no matching role")
        return False
    
    def _has_sufficient_scope(self, granted_scope, required_scope):
        """Check if granted scope meets required scope"""
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
    
    def _check_object_scope(self, obj, scope, employee):
        """Check if user can access object based on scope"""
        if scope == 'self':
            return getattr(obj, 'user', None) == self.user or obj == employee
        
        elif scope == 'team':
            if hasattr(obj, 'reporting_manager'):
                return obj.reporting_manager == employee
            return False
        
        elif scope == 'department':
            if hasattr(obj, 'department'):
                return obj.department == employee.department
            return False
        
        elif scope == 'company':
            if hasattr(obj, 'company'):
                return obj.company == employee.company
            return False
        
        elif scope == 'organization':
            if hasattr(obj, 'company'):
                root_org = employee.company.get_root_parent()
                obj_org = obj.company.get_root_parent()
                return obj_org == root_org
            return False
        
        # branch and global always allowed
        return True
    
    def _log_permission_check(self, permission_code, result, scope):
        """Log permission check for audit"""
        try:
            PermissionAuditLog = self._models['PermissionAuditLog']
            Permission = self._models['Permission']
            
            permission = Permission.objects.get(code=permission_code)
            PermissionAuditLog.objects.create(
                user=self.user,
                action='check',
                permission=permission,
                result=result,
                scope_used=scope
            )
        except:
            pass
    
    def get_user_permissions(self):
        """Get all permissions for user"""
        permissions = []
        
        # Always include basic rights
        for right in EMPLOYEE_BASIC_RIGHTS.keys():
            permissions.append({
                'permission': right,
                'name': right.replace('_', ' ').title(),
                'module': 'Employee Self-Service',
                'scope': 'self',
                'source': 'Basic Employee Right'
            })
        
        # If admin, add all permissions
        if is_client_admin(self.user):
            Permission = self._models['Permission']
            all_perms = Permission.objects.filter(is_active=True).select_related('module')
            
            for perm in all_perms:
                permissions.append({
                    'permission': perm.code,
                    'name': perm.name,
                    'module': perm.module.name,
                    'module_code': perm.module.code,
                    'scope': 'organization',
                    'source': 'Admin Access'
                })
            
            return permissions
        
        # Add role-based permissions
        try:
            Employee = self._models['Employee']
            RolePermission = self._models['RolePermission']
            
            employee = Employee.objects.select_related('designation').get(user=self.user)
            
            if employee.designation:
                roles = employee.designation.roles.filter(is_active=True)
                
                for role in roles:
                    role_perms = RolePermission.objects.filter(
                        role=role
                    ).select_related('permission', 'permission__module', 'scope')
                    
                    for rp in role_perms:
                        permissions.append({
                            'permission': rp.permission.code,
                            'name': rp.permission.name,
                            'module': rp.permission.module.name,
                            'module_code': rp.permission.module.code,
                            'scope': rp.scope.code,
                            'source': f"Role: {role.name}"
                        })
        except Employee.DoesNotExist:
            pass
        
        # Add basic rights with default module code
        for i, p in enumerate(permissions):
            if p['source'] == 'Basic Employee Right':
                p['module_code'] = 'core'
        
        return permissions

# ==================== DECORATORS ====================

def require_permission(permission_code, scope='self'):
    """
    Decorator to check permission.
    Automatically allows basic employee rights and admin access.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check basic rights first
            if has_basic_right(request.user, permission_code):
                return view_func(request, *args, **kwargs)
            
            # Check admin access
            if is_client_admin(request.user):
                return view_func(request, *args, **kwargs)
            
            # Check role-based permissions
            try:
                models = _get_models()
                Employee = models['Employee']
                employee = Employee.objects.get(user=request.user)
                organization = employee.company.get_root_parent()
            except Employee.DoesNotExist:
                raise PermissionDenied("Employee profile not found")
            
            checker = PermissionChecker(request.user, organization)
            obj = kwargs.get('obj', None)
            
            if not checker.has_permission(permission_code, scope, obj):
                raise PermissionDenied(f"Permission denied: {permission_code}")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def check_permission(user, permission_code, organization=None, scope='self', obj=None):
    """Standalone permission check"""
    # Check basic rights
    if has_basic_right(user, permission_code):
        return True
    
    # Check admin
    if is_client_admin(user):
        return True
    
    # Check role-based
    checker = PermissionChecker(user, organization, log=False)
    return checker.has_permission(permission_code, scope, obj)

# ==================== LEGACY HELPERS (PRESERVED) ====================

def permission_required(permission_codes, scope='self', require_all=True):
    """
    Check multiple permissions (Legacy wrapper support)
    """
    if isinstance(permission_codes, str):
        permission_codes = [permission_codes]
    
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # For multiple permissions, we just verify if the user has specific ones
            # Basic rights check
            results = []
            for code in permission_codes:
                if has_basic_right(request.user, code) or is_client_admin(request.user):
                    results.append(True)
                else:
                    try:
                        models = _get_models()
                        Employee = models['Employee']
                        employee = Employee.objects.get(user=request.user)
                        organization = employee.company.get_root_parent()
                        checker = PermissionChecker(request.user, organization)
                        results.append(checker.has_permission(code, scope))
                    except:
                        results.append(False)
            
            if require_all:
                has_access = all(results)
            else:
                has_access = any(results)
            
            if not has_access:
                raise PermissionDenied("Insufficient permissions")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

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
    models = _get_models()
    UserRole = models['UserRole']
    PermissionAuditLog = models['PermissionAuditLog']
    
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
    try:
        PermissionAuditLog.objects.create(
            user=user,
            action='role_assign',
            role=role,
            result=True,
            metadata={'created_by': created_by.email if created_by else None}
        )
    except:
        pass
    
    return user_role

def remove_role(user, role, organization=None, department=None):
    """Helper to remove role from user"""
    models = _get_models()
    UserRole = models['UserRole']
    PermissionAuditLog = models['PermissionAuditLog']
    
    try:
        user_role = UserRole.objects.get(
            user=user,
            role=role,
            organization=organization,
            department=department
        )
        user_role.is_active = False
        user_role.save()
        
        try:
            PermissionAuditLog.objects.create(
                user=user,
                action='role_remove',
                role=role,
                result=True
            )
        except:
            pass
        
        return True
    except UserRole.DoesNotExist:
        return False
