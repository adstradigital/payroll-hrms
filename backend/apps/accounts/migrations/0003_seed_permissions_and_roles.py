# Generated migration to seed system data for Permissions

from django.db import migrations
import uuid


def seed_permissions_data(apps, schema_editor):
    """Seed Modules, Permissions, DataScopes, and System Roles"""
    
    Module = apps.get_model('accounts', 'Module')
    Permission = apps.get_model('accounts', 'Permission')
    DataScope = apps.get_model('accounts', 'DataScope')
    Role = apps.get_model('accounts', 'Role')
    RolePermission = apps.get_model('accounts', 'RolePermission')
    
    # ==================== DATA SCOPES ====================
    scopes = {
        'self': DataScope.objects.get_or_create(
            code='self',
            defaults={'id': uuid.uuid4(), 'name': 'Self Only', 'description': 'Access only own data', 'level': 1}
        )[0],
        'team': DataScope.objects.get_or_create(
            code='team',
            defaults={'id': uuid.uuid4(), 'name': 'Team/Subordinates', 'description': 'Access team members data', 'level': 2}
        )[0],
        'department': DataScope.objects.get_or_create(
            code='department',
            defaults={'id': uuid.uuid4(), 'name': 'Department', 'description': 'Access department data', 'level': 3}
        )[0],
        'company': DataScope.objects.get_or_create(
            code='company',
            defaults={'id': uuid.uuid4(), 'name': 'Company', 'description': 'Access company-wide data', 'level': 4}
        )[0],
        'organization': DataScope.objects.get_or_create(
            code='organization',
            defaults={'id': uuid.uuid4(), 'name': 'Organization', 'description': 'Access all companies in org', 'level': 5}
        )[0],
        'global': DataScope.objects.get_or_create(
            code='global',
            defaults={'id': uuid.uuid4(), 'name': 'Global', 'description': 'System-wide access', 'level': 6}
        )[0],
    }
    
    # ==================== MODULES ====================
    modules_data = [
        ('dashboard', 'Dashboard', 'Main dashboard and widgets', 1),
        ('employees', 'Employees', 'Employee management', 2),
        ('attendance', 'Attendance', 'Attendance and time tracking', 3),
        ('leave', 'Leave', 'Leave management', 4),
        ('payroll', 'Payroll', 'Payroll processing', 5),
        ('recruitment', 'Recruitment', 'Hiring and onboarding', 6),
        ('performance', 'Performance', 'Performance reviews', 7),
        ('documents', 'Documents', 'Document management', 8),
        ('reports', 'Reports', 'Reports and analytics', 9),
        ('settings', 'Settings', 'System settings', 10),
    ]
    
    modules = {}
    for code, name, desc, order in modules_data:
        mod, _ = Module.objects.get_or_create(
            code=code,
            defaults={'id': uuid.uuid4(), 'name': name, 'description': desc, 'sort_order': order, 'is_active': True}
        )
        modules[code] = mod
    
    # ==================== PERMISSIONS ====================
    # Format: (module_code, perm_code, perm_name, description)
    permissions_data = [
        # Dashboard
        ('dashboard', 'dashboard.view', 'View Dashboard', 'Access the dashboard'),
        ('dashboard', 'dashboard.widgets.manage', 'Manage Widgets', 'Add/remove dashboard widgets'),
        
        # Employees
        ('employees', 'employees.view', 'View Employees', 'View employee list and profiles'),
        ('employees', 'employees.create', 'Create Employee', 'Add new employees'),
        ('employees', 'employees.edit', 'Edit Employee', 'Modify employee details'),
        ('employees', 'employees.delete', 'Delete Employee', 'Remove employees'),
        ('employees', 'employees.documents.view', 'View Documents', 'View employee documents'),
        ('employees', 'employees.documents.manage', 'Manage Documents', 'Upload/delete documents'),
        ('employees', 'departments.view', 'View Departments', 'View department list'),
        ('employees', 'departments.manage', 'Manage Departments', 'Create/edit departments'),
        ('employees', 'designations.view', 'View Designations', 'View designation list'),
        ('employees', 'designations.manage', 'Manage Designations', 'Create/edit designations'),
        
        # Attendance
        ('attendance', 'attendance.view', 'View Attendance', 'View attendance records'),
        ('attendance', 'attendance.mark', 'Mark Attendance', 'Clock in/out'),
        ('attendance', 'attendance.edit', 'Edit Attendance', 'Modify attendance records'),
        ('attendance', 'attendance.approve', 'Approve Attendance', 'Approve attendance requests'),
        ('attendance', 'attendance.reports', 'Attendance Reports', 'View attendance reports'),
        
        # Leave
        ('leave', 'leave.view', 'View Leave', 'View leave records'),
        ('leave', 'leave.apply', 'Apply Leave', 'Submit leave requests'),
        ('leave', 'leave.approve', 'Approve Leave', 'Approve leave requests'),
        ('leave', 'leave.manage', 'Manage Leave', 'Full leave management'),
        ('leave', 'leave.policy.manage', 'Manage Leave Policy', 'Configure leave policies'),
        
        # Payroll
        ('payroll', 'payroll.view', 'View Payroll', 'View salary information'),
        ('payroll', 'payroll.process', 'Process Payroll', 'Run payroll'),
        ('payroll', 'payroll.manage', 'Manage Payroll', 'Full payroll management'),
        ('payroll', 'payroll.settings', 'Payroll Settings', 'Configure payroll settings'),
        
        # Recruitment
        ('recruitment', 'recruitment.view', 'View Jobs', 'View job postings'),
        ('recruitment', 'recruitment.manage', 'Manage Recruitment', 'Full recruitment management'),
        
        # Performance
        ('performance', 'performance.view', 'View Performance', 'View performance reviews'),
        ('performance', 'performance.review', 'Conduct Reviews', 'Conduct performance reviews'),
        ('performance', 'performance.manage', 'Manage Performance', 'Full performance management'),
        
        # Documents
        ('documents', 'documents.view', 'View Documents', 'View company documents'),
        ('documents', 'documents.upload', 'Upload Documents', 'Upload new documents'),
        ('documents', 'documents.manage', 'Manage Documents', 'Full document management'),
        
        # Reports
        ('reports', 'reports.view', 'View Reports', 'Access reports'),
        ('reports', 'reports.export', 'Export Reports', 'Export report data'),
        ('reports', 'reports.manage', 'Manage Reports', 'Create custom reports'),
        
        # Settings
        ('settings', 'settings.view', 'View Settings', 'View system settings'),
        ('settings', 'settings.manage', 'Manage Settings', 'Modify system settings'),
        ('settings', 'roles.view', 'View Roles', 'View roles and permissions'),
        ('settings', 'roles.manage', 'Manage Roles', 'Create/edit custom roles'),
    ]
    
    permissions = {}
    for mod_code, perm_code, name, desc in permissions_data:
        perm, _ = Permission.objects.get_or_create(
            code=perm_code,
            defaults={
                'id': uuid.uuid4(),
                'module': modules[mod_code],
                'name': name,
                'description': desc,
                'is_active': True
            }
        )
        permissions[perm_code] = perm
    
    # ==================== SYSTEM ROLES ====================
    # Format: (code, name, description, is_system, default_scope, permission_list)
    
    system_roles_data = [
        (
            'EMPLOYEE',
            'Employee',
            'Basic employee access - view own data, mark attendance, apply leave',
            True,
            'self',
            [
                ('dashboard.view', 'self'),
                ('employees.view', 'self'),
                ('employees.documents.view', 'self'),
                ('attendance.view', 'self'),
                ('attendance.mark', 'self'),
                ('leave.view', 'self'),
                ('leave.apply', 'self'),
                ('payroll.view', 'self'),
                ('performance.view', 'self'),
                ('documents.view', 'self'),
            ]
        ),
        (
            'MANAGER',
            'Manager',
            'Team management - view team data, approve requests',
            True,
            'team',
            [
                ('dashboard.view', 'team'),
                ('employees.view', 'team'),
                ('employees.documents.view', 'team'),
                ('attendance.view', 'team'),
                ('attendance.mark', 'self'),
                ('attendance.approve', 'team'),
                ('attendance.reports', 'team'),
                ('leave.view', 'team'),
                ('leave.apply', 'self'),
                ('leave.approve', 'team'),
                ('payroll.view', 'self'),
                ('performance.view', 'team'),
                ('performance.review', 'team'),
                ('documents.view', 'team'),
                ('reports.view', 'team'),
            ]
        ),
        (
            'HR_MANAGER',
            'HR Manager',
            'HR module full access',
            True,
            'company',
            [
                ('dashboard.view', 'company'),
                ('dashboard.widgets.manage', 'self'),
                ('employees.view', 'company'),
                ('employees.create', 'company'),
                ('employees.edit', 'company'),
                ('employees.documents.view', 'company'),
                ('employees.documents.manage', 'company'),
                ('departments.view', 'company'),
                ('departments.manage', 'company'),
                ('designations.view', 'company'),
                ('designations.manage', 'company'),
                ('attendance.view', 'company'),
                ('attendance.edit', 'company'),
                ('attendance.approve', 'company'),
                ('attendance.reports', 'company'),
                ('leave.view', 'company'),
                ('leave.approve', 'company'),
                ('leave.manage', 'company'),
                ('leave.policy.manage', 'company'),
                ('recruitment.view', 'company'),
                ('recruitment.manage', 'company'),
                ('performance.view', 'company'),
                ('performance.manage', 'company'),
                ('documents.view', 'company'),
                ('documents.manage', 'company'),
                ('reports.view', 'company'),
                ('reports.export', 'company'),
            ]
        ),
        (
            'PAYROLL_ADMIN',
            'Payroll Admin',
            'Payroll module full access',
            True,
            'company',
            [
                ('dashboard.view', 'company'),
                ('employees.view', 'company'),
                ('attendance.view', 'company'),
                ('attendance.reports', 'company'),
                ('payroll.view', 'company'),
                ('payroll.process', 'company'),
                ('payroll.manage', 'company'),
                ('payroll.settings', 'company'),
                ('reports.view', 'company'),
                ('reports.export', 'company'),
            ]
        ),
        (
            'ADMIN',
            'Admin',
            'Organization administrator - full access',
            True,
            'organization',
            [
                ('dashboard.view', 'organization'),
                ('dashboard.widgets.manage', 'organization'),
                ('employees.view', 'organization'),
                ('employees.create', 'organization'),
                ('employees.edit', 'organization'),
                ('employees.delete', 'organization'),
                ('employees.documents.view', 'organization'),
                ('employees.documents.manage', 'organization'),
                ('departments.view', 'organization'),
                ('departments.manage', 'organization'),
                ('designations.view', 'organization'),
                ('designations.manage', 'organization'),
                ('attendance.view', 'organization'),
                ('attendance.mark', 'self'),
                ('attendance.edit', 'organization'),
                ('attendance.approve', 'organization'),
                ('attendance.reports', 'organization'),
                ('leave.view', 'organization'),
                ('leave.apply', 'self'),
                ('leave.approve', 'organization'),
                ('leave.manage', 'organization'),
                ('leave.policy.manage', 'organization'),
                ('payroll.view', 'organization'),
                ('payroll.process', 'organization'),
                ('payroll.manage', 'organization'),
                ('payroll.settings', 'organization'),
                ('recruitment.view', 'organization'),
                ('recruitment.manage', 'organization'),
                ('performance.view', 'organization'),
                ('performance.review', 'organization'),
                ('performance.manage', 'organization'),
                ('documents.view', 'organization'),
                ('documents.upload', 'organization'),
                ('documents.manage', 'organization'),
                ('reports.view', 'organization'),
                ('reports.export', 'organization'),
                ('reports.manage', 'organization'),
                ('settings.view', 'organization'),
                ('settings.manage', 'organization'),
                ('roles.view', 'organization'),
                ('roles.manage', 'organization'),
            ]
        ),
        (
            'RECRUITER',
            'Recruiter',
            'Recruitment module access',
            True,
            'company',
            [
                ('dashboard.view', 'self'),
                ('employees.view', 'company'),
                ('recruitment.view', 'company'),
                ('recruitment.manage', 'company'),
                ('documents.view', 'company'),
            ]
        ),
    ]
    
    for code, name, desc, is_system, default_scope_code, perms in system_roles_data:
        role, created = Role.objects.get_or_create(
            code=code,
            defaults={
                'id': uuid.uuid4(),
                'name': name,
                'description': desc,
                'role_type': 'system',
                'is_system': is_system,
                'is_active': True,
                'default_scope': scopes[default_scope_code],
                'organization': None  # System roles have no org
            }
        )
        
        # Add permissions to role
        if created:
            for perm_code, scope_code in perms:
                if perm_code in permissions:
                    RolePermission.objects.get_or_create(
                        role=role,
                        permission=permissions[perm_code],
                        defaults={
                            'id': uuid.uuid4(),
                            'scope': scopes[scope_code]
                        }
                    )


def reverse_seed(apps, schema_editor):
    """Remove seeded data - be careful in production!"""
    Role = apps.get_model('accounts', 'Role')
    # Only delete system roles
    Role.objects.filter(role_type='system').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_designation_permissions'),
    ]

    operations = [
        migrations.RunPython(seed_permissions_data, reverse_seed),
    ]
