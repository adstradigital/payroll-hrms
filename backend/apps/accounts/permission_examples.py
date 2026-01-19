"""
Permission System Usage Examples

This file contains examples for using the RBAC permission system.
NOT for import - documentation only.

Run first:
    python manage.py setup_permissions
"""

# ==================== 1. ASSIGNING ROLES ====================

from apps.accounts.models import Role, DataScope
from apps.accounts.permissions import assign_role, remove_role
from django.contrib.auth.models import User


def example_assign_hr_admin(user, organization, admin_user):
    """Assign HR Admin role to a user"""
    hr_admin_role = Role.objects.get(code='hr_admin')
    
    assign_role(
        user=user,
        role=hr_admin_role,
        organization=organization,
        created_by=admin_user
    )


def example_assign_manager_with_department(user, organization, department):
    """Assign Manager role scoped to specific department"""
    manager_role = Role.objects.get(code='manager')
    dept_scope = DataScope.objects.get(code='department')
    
    assign_role(
        user=user,
        role=manager_role,
        organization=organization,
        department=department,
        scope_override=dept_scope
    )


# ==================== 2. USING DECORATORS ====================

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import require_permission, permission_required


# Single permission check
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('leave.approve_leave', scope='department')
def approve_leave_request(request, leave_id):
    """Only users with department-level approve_leave can access"""
    # Your logic here
    return Response({'message': 'Leave approved'})


# Multiple permissions check
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@permission_required(['employee.view_employees', 'employee.view_employee_salary'])
def view_employee_salaries(request):
    """Requires both permissions"""
    return Response({'data': 'salary info'})


# ==================== 3. MANUAL PERMISSION CHECK ====================

from apps.accounts.permissions import PermissionChecker


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_employee(request, employee_id):
    """Manual permission check in view"""
    from apps.accounts.models import Employee
    
    employee = Employee.objects.get(id=employee_id)
    organization = request.user.employee_profile.company.get_root_parent()
    
    checker = PermissionChecker(request.user, organization)
    
    if not checker.has_permission('employee.edit_employee', scope='department', obj=employee):
        return Response({'error': 'Permission denied'}, status=403)
    
    # Proceed with edit
    return Response({'message': 'Updated'})


# ==================== 4. CONDITIONAL LOGIC BASED ON PERMISSIONS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Show different data based on permissions"""
    organization = request.user.employee_profile.company.get_root_parent()
    checker = PermissionChecker(request.user, organization)
    
    data = {}
    
    if checker.has_permission('payroll.view_payslips', scope='self'):
        data['show_salary'] = True
    
    if checker.has_permission('leave.approve_leave', scope='team'):
        data['show_approvals'] = True
    
    if checker.has_permission('reports.view_reports', scope='company'):
        data['show_company_reports'] = True
    
    return Response(data)


# ==================== 5. GET USER PERMISSIONS/ROLES ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    """Return current user's permissions"""
    organization = request.user.employee_profile.company.get_root_parent()
    checker = PermissionChecker(request.user, organization, log=False)
    
    return Response({
        'permissions': checker.get_user_permissions(),
        'roles': [
            {'name': ur.role.name, 'code': ur.role.code}
            for ur in checker.get_user_roles()
        ]
    })


# ==================== QUICK REFERENCE ====================
"""
SCOPE LEVELS (lowest to highest):
- self: Own data only
- team: Direct subordinates
- department: Department members
- branch: Branch/location
- company: Entire company
- organization: All companies in org
- global: System-wide

USAGE:
1. Setup: python manage.py setup_permissions
2. Assign: assign_role(user, role, organization)
3. Check: @require_permission('module.action', scope='department')
4. Manual: checker.has_permission('leave.approve_leave', scope='team', obj=leave)
"""
