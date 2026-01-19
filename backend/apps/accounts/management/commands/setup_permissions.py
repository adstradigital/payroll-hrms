# apps/accounts/management/commands/setup_permissions.py
"""
Management command to setup initial modules, permissions, scopes and roles.

Usage:
    python manage.py setup_permissions
"""

from django.core.management.base import BaseCommand
from apps.accounts.models import Module, Permission, DataScope, Role, RolePermission


class Command(BaseCommand):
    help = 'Setup initial modules, permissions, scopes and roles'

    def handle(self, *args, **kwargs):
        self.stdout.write('Setting up permissions system...')
        
        # 1. Create Data Scopes
        self.setup_scopes()
        
        # 2. Create Modules
        self.setup_modules()
        
        # 3. Create Permissions
        self.setup_permissions()
        
        # 4. Create Default Roles
        self.setup_roles()
        
        self.stdout.write(self.style.SUCCESS('[OK] Permissions system setup complete!'))

    def setup_scopes(self):
        """Create data scopes"""
        self.stdout.write('  Creating data scopes...')
        scopes = [
            {'name': 'Self Only', 'code': 'self', 'level': 1},
            {'name': 'Team/Subordinates', 'code': 'team', 'level': 2},
            {'name': 'Department', 'code': 'department', 'level': 3},
            {'name': 'Branch/Location', 'code': 'branch', 'level': 4},
            {'name': 'Company', 'code': 'company', 'level': 5},
            {'name': 'Organization', 'code': 'organization', 'level': 6},
            {'name': 'Global/All', 'code': 'global', 'level': 7},
        ]
        
        for scope_data in scopes:
            scope, created = DataScope.objects.get_or_create(
                code=scope_data['code'],
                defaults=scope_data
            )
            if created:
                self.stdout.write(f"    Created scope: {scope.name}")

    def setup_modules(self):
        """Create business modules"""
        self.stdout.write('  Creating modules...')
        modules = [
            {'name': 'Core Management', 'code': 'core', 'icon': 'settings', 'sort_order': 1},
            {'name': 'Employee Management', 'code': 'employee', 'icon': 'users', 'sort_order': 2},
            {'name': 'Attendance & Time Tracking', 'code': 'attendance', 'icon': 'clock', 'sort_order': 3},
            {'name': 'Leave Management', 'code': 'leave', 'icon': 'calendar', 'sort_order': 4},
            {'name': 'Shift Management', 'code': 'shift', 'icon': 'rotate', 'sort_order': 5},
            {'name': 'Payroll', 'code': 'payroll', 'icon': 'dollar-sign', 'sort_order': 6},
            {'name': 'Recruitment', 'code': 'recruitment', 'icon': 'briefcase', 'sort_order': 7},
            {'name': 'Performance Management', 'code': 'performance', 'icon': 'trending-up', 'sort_order': 8},
            {'name': 'Training & Development', 'code': 'training', 'icon': 'book', 'sort_order': 9},
            {'name': 'Asset Management', 'code': 'assets', 'icon': 'package', 'sort_order': 10},
            {'name': 'Document Management', 'code': 'documents', 'icon': 'file-text', 'sort_order': 11},
            {'name': 'Reports & Analytics', 'code': 'reports', 'icon': 'bar-chart', 'sort_order': 12},
            {'name': 'System Settings', 'code': 'settings', 'icon': 'settings', 'sort_order': 13},
        ]
        
        for module_data in modules:
            module, created = Module.objects.get_or_create(
                code=module_data['code'],
                defaults=module_data
            )
            if created:
                self.stdout.write(f"    Created module: {module.name}")

    def setup_permissions(self):
        """Create permissions for each module"""
        self.stdout.write('  Creating permissions...')
        
        # Get modules
        modules = {m.code: m for m in Module.objects.all()}
        
        # Define permissions per module
        permissions_data = {
            'core': [
                {'name': 'Manage Organization', 'code': 'manage_organization', 'action': 'manage'},
                {'name': 'View Organization', 'code': 'view_organization', 'action': 'view'},
                {'name': 'Manage Companies', 'code': 'manage_companies', 'action': 'manage'},
                {'name': 'Manage Departments', 'code': 'manage_departments', 'action': 'manage'},
                {'name': 'Manage Designations', 'code': 'manage_designations', 'action': 'manage'},
            ],
            'employee': [
                {'name': 'View Employees', 'code': 'view_employees', 'action': 'view'},
                {'name': 'Create Employee', 'code': 'create_employee', 'action': 'create'},
                {'name': 'Edit Employee', 'code': 'edit_employee', 'action': 'edit'},
                {'name': 'Delete Employee', 'code': 'delete_employee', 'action': 'delete'},
                {'name': 'View Employee Salary', 'code': 'view_employee_salary', 'action': 'view'},
                {'name': 'Edit Employee Salary', 'code': 'edit_employee_salary', 'action': 'edit'},
                {'name': 'View Employee Documents', 'code': 'view_employee_documents', 'action': 'view'},
                {'name': 'Manage Employee Documents', 'code': 'manage_employee_documents', 'action': 'manage'},
            ],
            'attendance': [
                {'name': 'Mark Attendance', 'code': 'mark_attendance', 'action': 'create'},
                {'name': 'View Attendance', 'code': 'view_attendance', 'action': 'view'},
                {'name': 'Edit Attendance', 'code': 'edit_attendance', 'action': 'edit'},
                {'name': 'Approve Attendance', 'code': 'approve_attendance', 'action': 'approve'},
                {'name': 'Export Attendance', 'code': 'export_attendance', 'action': 'export'},
            ],
            'leave': [
                {'name': 'Request Leave', 'code': 'request_leave', 'action': 'create'},
                {'name': 'View Leave', 'code': 'view_leave', 'action': 'view'},
                {'name': 'Edit Leave', 'code': 'edit_leave', 'action': 'edit'},
                {'name': 'Cancel Leave', 'code': 'cancel_leave', 'action': 'delete'},
                {'name': 'Approve Leave', 'code': 'approve_leave', 'action': 'approve'},
                {'name': 'Reject Leave', 'code': 'reject_leave', 'action': 'reject'},
                {'name': 'Manage Leave Policies', 'code': 'manage_leave_policies', 'action': 'manage'},
            ],
            'shift': [
                {'name': 'View Shifts', 'code': 'view_shifts', 'action': 'view'},
                {'name': 'Manage Shifts', 'code': 'manage_shifts', 'action': 'manage'},
                {'name': 'Assign Shifts', 'code': 'assign_shifts', 'action': 'edit'},
            ],
            'payroll': [
                {'name': 'View Payroll', 'code': 'view_payroll', 'action': 'view'},
                {'name': 'Process Payroll', 'code': 'process_payroll', 'action': 'process'},
                {'name': 'Approve Payroll', 'code': 'approve_payroll', 'action': 'approve'},
                {'name': 'View Payslips', 'code': 'view_payslips', 'action': 'view'},
                {'name': 'Generate Payslips', 'code': 'generate_payslips', 'action': 'create'},
                {'name': 'Manage Salary Components', 'code': 'manage_salary_components', 'action': 'manage'},
            ],
            'recruitment': [
                {'name': 'View Jobs', 'code': 'view_jobs', 'action': 'view'},
                {'name': 'Create Job', 'code': 'create_job', 'action': 'create'},
                {'name': 'Manage Jobs', 'code': 'manage_jobs', 'action': 'manage'},
                {'name': 'View Candidates', 'code': 'view_candidates', 'action': 'view'},
                {'name': 'Manage Candidates', 'code': 'manage_candidates', 'action': 'manage'},
                {'name': 'Schedule Interviews', 'code': 'schedule_interviews', 'action': 'create'},
            ],
            'performance': [
                {'name': 'View Performance', 'code': 'view_performance', 'action': 'view'},
                {'name': 'Create Review', 'code': 'create_review', 'action': 'create'},
                {'name': 'Edit Review', 'code': 'edit_review', 'action': 'edit'},
                {'name': 'Approve Review', 'code': 'approve_review', 'action': 'approve'},
                {'name': 'View Goals', 'code': 'view_goals', 'action': 'view'},
                {'name': 'Manage Goals', 'code': 'manage_goals', 'action': 'manage'},
            ],
            'training': [
                {'name': 'View Trainings', 'code': 'view_trainings', 'action': 'view'},
                {'name': 'Create Training', 'code': 'create_training', 'action': 'create'},
                {'name': 'Manage Trainings', 'code': 'manage_trainings', 'action': 'manage'},
                {'name': 'Enroll in Training', 'code': 'enroll_training', 'action': 'create'},
            ],
            'assets': [
                {'name': 'View Assets', 'code': 'view_assets', 'action': 'view'},
                {'name': 'Manage Assets', 'code': 'manage_assets', 'action': 'manage'},
                {'name': 'Assign Assets', 'code': 'assign_assets', 'action': 'edit'},
                {'name': 'Return Assets', 'code': 'return_assets', 'action': 'edit'},
            ],
            'documents': [
                {'name': 'View Documents', 'code': 'view_documents', 'action': 'view'},
                {'name': 'Upload Documents', 'code': 'upload_documents', 'action': 'create'},
                {'name': 'Delete Documents', 'code': 'delete_documents', 'action': 'delete'},
                {'name': 'Manage Document Templates', 'code': 'manage_templates', 'action': 'manage'},
            ],
            'reports': [
                {'name': 'View Reports', 'code': 'view_reports', 'action': 'view'},
                {'name': 'Generate Reports', 'code': 'generate_reports', 'action': 'create'},
                {'name': 'Export Reports', 'code': 'export_reports', 'action': 'export'},
                {'name': 'Schedule Reports', 'code': 'schedule_reports', 'action': 'manage'},
            ],
            'settings': [
                {'name': 'View Settings', 'code': 'view_settings', 'action': 'view'},
                {'name': 'Manage Settings', 'code': 'manage_settings', 'action': 'manage'},
                {'name': 'Manage Roles', 'code': 'manage_roles', 'action': 'manage'},
                {'name': 'Manage Permissions', 'code': 'manage_permissions', 'action': 'manage'},
            ],
        }
        
        for module_code, perms in permissions_data.items():
            module = modules.get(module_code)
            if not module:
                continue
            
            for perm_data in perms:
                full_code = f"{module_code}.{perm_data['code']}"
                perm, created = Permission.objects.get_or_create(
                    code=full_code,
                    defaults={
                        'module': module,
                        'name': perm_data['name'],
                        'action': perm_data['action'],
                        'is_system': True
                    }
                )
                if created:
                    self.stdout.write(f"    Created permission: {perm.name}")

    def setup_roles(self):
        """Create default system roles"""
        self.stdout.write('  Creating default roles...')
        
        # Get scopes
        self_scope = DataScope.objects.get(code='self')
        team_scope = DataScope.objects.get(code='team')
        dept_scope = DataScope.objects.get(code='department')
        company_scope = DataScope.objects.get(code='company')
        org_scope = DataScope.objects.get(code='organization')
        
        # Define roles
        roles_data = [
            {
                'name': 'Super Admin',
                'code': 'super_admin',
                'description': 'Full system access',
                'default_scope': org_scope,
                'permissions': 'all'  # Special case handled separately
            },
            {
                'name': 'HR Admin',
                'code': 'hr_admin',
                'description': 'Full HR management access',
                'default_scope': company_scope,
                'permissions': [
                    ('core.manage_organization', company_scope),
                    ('core.manage_departments', company_scope),
                    ('core.manage_designations', company_scope),
                    ('employee.view_employees', company_scope),
                    ('employee.create_employee', company_scope),
                    ('employee.edit_employee', company_scope),
                    ('employee.view_employee_salary', company_scope),
                    ('employee.edit_employee_salary', company_scope),
                    ('employee.manage_employee_documents', company_scope),
                    ('attendance.view_attendance', company_scope),
                    ('attendance.edit_attendance', company_scope),
                    ('attendance.approve_attendance', company_scope),
                    ('leave.view_leave', company_scope),
                    ('leave.approve_leave', company_scope),
                    ('leave.reject_leave', company_scope),
                    ('leave.manage_leave_policies', company_scope),
                    ('shift.manage_shifts', company_scope),
                    ('reports.view_reports', company_scope),
                    ('reports.generate_reports', company_scope),
                ]
            },
            {
                'name': 'HR Manager',
                'code': 'hr_manager',
                'description': 'HR department manager',
                'default_scope': dept_scope,
                'permissions': [
                    ('employee.view_employees', dept_scope),
                    ('employee.edit_employee', dept_scope),
                    ('employee.view_employee_documents', dept_scope),
                    ('attendance.view_attendance', dept_scope),
                    ('attendance.approve_attendance', dept_scope),
                    ('leave.view_leave', dept_scope),
                    ('leave.approve_leave', dept_scope),
                    ('leave.reject_leave', dept_scope),
                    ('reports.view_reports', dept_scope),
                ]
            },
            {
                'name': 'Payroll Admin',
                'code': 'payroll_admin',
                'description': 'Payroll processing and management',
                'default_scope': company_scope,
                'permissions': [
                    ('employee.view_employees', company_scope),
                    ('employee.view_employee_salary', company_scope),
                    ('employee.edit_employee_salary', company_scope),
                    ('payroll.view_payroll', company_scope),
                    ('payroll.process_payroll', company_scope),
                    ('payroll.approve_payroll', company_scope),
                    ('payroll.view_payslips', company_scope),
                    ('payroll.generate_payslips', company_scope),
                    ('payroll.manage_salary_components', company_scope),
                    ('reports.view_reports', company_scope),
                ]
            },
            {
                'name': 'Manager',
                'code': 'manager',
                'description': 'Team/Department Manager',
                'default_scope': team_scope,
                'permissions': [
                    ('employee.view_employees', team_scope),
                    ('attendance.view_attendance', team_scope),
                    ('attendance.approve_attendance', team_scope),
                    ('leave.view_leave', team_scope),
                    ('leave.approve_leave', team_scope),
                    ('leave.reject_leave', team_scope),
                    ('performance.view_performance', team_scope),
                    ('performance.create_review', team_scope),
                    ('performance.edit_review', team_scope),
                    ('reports.view_reports', team_scope),
                ]
            },
            {
                'name': 'Employee',
                'code': 'employee',
                'description': 'Standard employee access',
                'default_scope': self_scope,
                'permissions': [
                    ('employee.view_employees', self_scope),
                    ('attendance.mark_attendance', self_scope),
                    ('attendance.view_attendance', self_scope),
                    ('leave.request_leave', self_scope),
                    ('leave.view_leave', self_scope),
                    ('leave.cancel_leave', self_scope),
                    ('payroll.view_payslips', self_scope),
                    ('performance.view_performance', self_scope),
                    ('training.view_trainings', self_scope),
                    ('training.enroll_training', self_scope),
                    ('documents.view_documents', self_scope),
                    ('documents.upload_documents', self_scope),
                ]
            },
            {
                'name': 'Recruiter',
                'code': 'recruiter',
                'description': 'Recruitment specialist',
                'default_scope': company_scope,
                'permissions': [
                    ('recruitment.view_jobs', company_scope),
                    ('recruitment.create_job', company_scope),
                    ('recruitment.manage_jobs', company_scope),
                    ('recruitment.view_candidates', company_scope),
                    ('recruitment.manage_candidates', company_scope),
                    ('recruitment.schedule_interviews', company_scope),
                ]
            },
        ]
        
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                code=role_data['code'],
                defaults={
                    'name': role_data['name'],
                    'description': role_data['description'],
                    'role_type': 'system',
                    'default_scope': role_data['default_scope'],
                    'is_system': True
                }
            )
            
            if created:
                self.stdout.write(f"    Created role: {role.name}")
                
                # Assign permissions to role
                if role.code == 'super_admin':
                    # Grant all permissions
                    all_perms = Permission.objects.all()
                    for perm in all_perms:
                        RolePermission.objects.create(
                            role=role,
                            permission=perm,
                            scope=org_scope
                        )
                else:
                    for perm_code, scope in role_data['permissions']:
                        try:
                            permission = Permission.objects.get(code=perm_code)
                            RolePermission.objects.create(
                                role=role,
                                permission=permission,
                                scope=scope
                            )
                        except Permission.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f"      Permission not found: {perm_code}")
                            )
