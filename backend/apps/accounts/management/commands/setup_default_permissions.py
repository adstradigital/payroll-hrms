# management/commands/setup_default_permissions.py
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import (
    Module, Permission, DataScope, Role, RolePermission
)

class Command(BaseCommand):
    help = 'Setup default modules, permissions, scopes, and roles (Employee, Manager, HR, Admin)'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            self.stdout.write(self.style.WARNING('* Setting up HRMS Permissions System...'))
            
            # Step 1: Create Data Scopes
            scopes = self.create_scopes()
            
            # Step 2: Create Modules
            modules = self.create_modules()
            
            # Step 3: Create Permissions
            permissions = self.create_permissions(modules)
            
            # Step 4: Create Default Roles
            self.create_default_roles(scopes, permissions)
            
            self.stdout.write(self.style.SUCCESS('[OK] HRMS Permissions System Setup Complete!'))
            self.stdout.write(self.style.SUCCESS('   - 3 Default Roles Created (Employee, Manager, HR)'))
            self.stdout.write(self.style.SUCCESS('   - Admins automatically get all permissions'))
            self.stdout.write(self.style.SUCCESS('   - You can now create custom roles via the Admin UI'))

    def create_scopes(self):
        """Create data access scopes"""
        self.stdout.write('> Creating Data Scopes...')
        
        scopes = {
            'self': DataScope.objects.get_or_create(
                code='self',
                defaults={
                    'name': 'Self Only',
                    'description': 'Access only own data',
                    'level': 1
                }
            )[0],
            'team': DataScope.objects.get_or_create(
                code='team',
                defaults={
                    'name': 'Team/Subordinates',
                    'description': 'Access team members data',
                    'level': 2
                }
            )[0],
            'department': DataScope.objects.get_or_create(
                code='department',
                defaults={
                    'name': 'Department',
                    'description': 'Access department data',
                    'level': 3
                }
            )[0],
            'company': DataScope.objects.get_or_create(
                code='company',
                defaults={
                    'name': 'Company',
                    'description': 'Access company-wide data',
                    'level': 5
                }
            )[0],
            'organization': DataScope.objects.get_or_create(
                code='organization',
                defaults={
                    'name': 'Organization',
                    'description': 'Access all companies in organization',
                    'level': 6
                }
            )[0],
        }
        
        self.stdout.write(self.style.SUCCESS(f'   + Created {len(scopes)} scopes'))
        return scopes

    def create_modules(self):
        """Create business modules"""
        self.stdout.write('> Creating Modules...')
        
        modules_data = [
            ('core', 'Core Management', 'Building', 1),
            ('employee', 'Employee Management', 'Users', 2),
            ('attendance', 'Attendance & Time Tracking', 'Clock', 3),
            ('leave', 'Leave Management', 'Calendar', 4),
            ('shift', 'Shift Management', 'CalendarClock', 5),
            ('payroll', 'Payroll', 'DollarSign', 6),
            ('recruitment', 'Recruitment', 'UserPlus', 7),
            ('performance', 'Performance Management', 'Target', 8),
            ('training', 'Training & Development', 'GraduationCap', 9),
            ('assets', 'Asset Management', 'Package', 10),
            ('documents', 'Document Management', 'FileText', 11),
            ('reports', 'Reports & Analytics', 'BarChart', 12),
            ('settings', 'System Settings', 'Settings', 13),
        ]
        
        modules = {}
        for code, name, icon, order in modules_data:
            module, created = Module.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'icon': icon,
                    'sort_order': order,
                    'is_active': True
                }
            )
            modules[code] = module
        
        self.stdout.write(self.style.SUCCESS(f'   + Created {len(modules)} modules'))
        return modules

    def create_permissions(self, modules):
        """Create granular permissions for each module"""
        self.stdout.write('> Creating Permissions...')
        
        permissions_data = {
            # Employee Management
            'employee': [
                ('view_employee', 'View Employee', 'view'),
                ('add_employee', 'Add Employee', 'create'),
                ('edit_employee', 'Edit Employee', 'edit'),
                ('delete_employee', 'Delete Employee', 'delete'),
                ('view_employee_salary', 'View Employee Salary', 'view'),
                ('edit_employee_salary', 'Edit Employee Salary', 'edit'),
            ],
            
            # Attendance
            'attendance': [
                ('view_attendance', 'View Attendance', 'view'),
                ('mark_attendance', 'Mark Attendance', 'create'),
                ('edit_attendance', 'Edit Attendance', 'edit'),
                ('approve_attendance', 'Approve Attendance', 'approve'),
                ('view_attendance_reports', 'View Attendance Reports', 'view'),
                ('export_attendance', 'Export Attendance', 'export'),
            ],
            
            # Leave Management
            'leave': [
                ('view_leave', 'View Leave Requests', 'view'),
                ('request_leave', 'Request Leave', 'create'),
                ('edit_leave', 'Edit Leave Request', 'edit'),
                ('cancel_leave', 'Cancel Leave Request', 'delete'),
                ('approve_leave', 'Approve Leave', 'approve'),
                ('reject_leave', 'Reject Leave', 'reject'),
                ('manage_leave_policy', 'Manage Leave Policies', 'manage'),
            ],
            
            # Shift Management
            'shift': [
                ('view_shift', 'View Shifts', 'view'),
                ('create_shift', 'Create Shifts', 'create'),
                ('edit_shift', 'Edit Shifts', 'edit'),
                ('assign_shift', 'Assign Shifts to Employees', 'manage'),
                ('delete_shift', 'Delete Shifts', 'delete'),
            ],
            
            # Payroll
            'payroll': [
                ('view_payroll', 'View Payroll', 'view'),
                ('process_payroll', 'Process Payroll', 'process'),
                ('approve_payroll', 'Approve Payroll', 'approve'),
                ('view_payslip', 'View Payslips', 'view'),
                ('generate_payslip', 'Generate Payslips', 'create'),
                ('export_payroll', 'Export Payroll', 'export'),
            ],
            
            # Recruitment
            'recruitment': [
                ('view_job_posting', 'View Job Postings', 'view'),
                ('create_job_posting', 'Create Job Postings', 'create'),
                ('edit_job_posting', 'Edit Job Postings', 'edit'),
                ('view_candidates', 'View Candidates', 'view'),
                ('manage_candidates', 'Manage Candidates', 'manage'),
                ('schedule_interview', 'Schedule Interviews', 'create'),
            ],
            
            # Performance
            'performance': [
                ('view_performance', 'View Performance Reviews', 'view'),
                ('create_review', 'Create Performance Review', 'create'),
                ('edit_review', 'Edit Performance Review', 'edit'),
                ('submit_review', 'Submit Performance Review', 'approve'),
                ('view_goals', 'View Goals', 'view'),
                ('set_goals', 'Set Goals', 'create'),
            ],
            
            # Training
            'training': [
                ('view_training', 'View Training Programs', 'view'),
                ('create_training', 'Create Training Programs', 'create'),
                ('enroll_training', 'Enroll in Training', 'create'),
                ('manage_training', 'Manage Training Programs', 'manage'),
            ],
            
            # Assets
            'assets': [
                ('view_assets', 'View Assets', 'view'),
                ('create_asset', 'Create Asset', 'create'),
                ('assign_asset', 'Assign Asset', 'manage'),
                ('return_asset', 'Return Asset', 'manage'),
                ('delete_asset', 'Delete Asset', 'delete'),
            ],
            
            # Documents
            'documents': [
                ('view_documents', 'View Documents', 'view'),
                ('upload_document', 'Upload Document', 'create'),
                ('edit_document', 'Edit Document', 'edit'),
                ('delete_document', 'Delete Document', 'delete'),
                ('approve_document', 'Approve Document', 'approve'),
            ],
            
            # Reports
            'reports': [
                ('view_reports', 'View Reports', 'view'),
                ('create_report', 'Create Custom Reports', 'create'),
                ('export_report', 'Export Reports', 'export'),
                ('view_analytics', 'View Analytics Dashboard', 'view'),
            ],
            
            # Core/Settings
            'core': [
                ('manage_departments', 'Manage Departments', 'manage'),
                ('manage_designations', 'Manage Designations', 'manage'),
                ('manage_roles', 'Manage Roles & Permissions', 'manage'),
                ('view_audit_log', 'View Audit Logs', 'view'),
                ('manage_settings', 'Manage System Settings', 'manage'),
            ],
        }
        
        permissions = {}
        count = 0
        
        for module_code, perms in permissions_data.items():
            if module_code not in modules:
                continue
                
            module = modules[module_code]
            
            for code, name, action in perms:
                perm_code = f"{module_code}.{code}"
                permission, created = Permission.objects.get_or_create(
                    code=perm_code,
                    defaults={
                        'module': module,
                        'name': name,
                        'action': action,
                        'is_system': True,
                        'is_active': True
                    }
                )
                permissions[perm_code] = permission
                if created:
                    count += 1
        
        self.stdout.write(self.style.SUCCESS(f'   + Created {count} permissions'))
        return permissions

    def create_default_roles(self, scopes, permissions):
        """Create 3 default system roles: Standard Employee, Manager, HR"""
        self.stdout.write('> Creating Default Roles...')
        
        # ========== ROLE 1: STANDARD EMPLOYEE ==========
        employee_role, _ = Role.objects.get_or_create(
            code='standard_employee',
            defaults={
                'name': 'Standard Employee',
                'description': 'Basic employee with self-service access',
                'role_type': 'system',
                'is_system': True,
                'default_scope': scopes['self']
            }
        )
        
        # Standard Employee Permissions (SELF scope only)
        employee_permissions = [
            'attendance.view_attendance',
            'attendance.mark_attendance',
            'leave.view_leave',
            'leave.request_leave',
            'leave.cancel_leave',
            'payroll.view_payslip',
            'documents.view_documents',
            'documents.upload_document',
            'assets.view_assets',
            'training.view_training',
            'training.enroll_training',
        ]
        
        for perm_code in employee_permissions:
            if perm_code in permissions:
                RolePermission.objects.get_or_create(
                    role=employee_role,
                    permission=permissions[perm_code],
                    defaults={'scope': scopes['self']}
                )
        
        self.stdout.write(self.style.SUCCESS(f'   + Created "Standard Employee" role'))
        
        # ========== ROLE 2: MANAGER ==========
        manager_role, _ = Role.objects.get_or_create(
            code='manager',
            defaults={
                'name': 'Manager',
                'description': 'Team/Department manager with approval rights',
                'role_type': 'system',
                'is_system': True,
                'default_scope': scopes['department']
            }
        )
        
        # Manager Permissions (DEPARTMENT scope)
        manager_permissions = [
            # All employee permissions + management permissions
            ('employee.view_employee', 'department'),
            ('employee.edit_employee', 'team'),
            ('attendance.view_attendance', 'department'),
            ('attendance.edit_attendance', 'team'),
            ('attendance.approve_attendance', 'department'),
            ('attendance.view_attendance_reports', 'department'),
            ('leave.view_leave', 'department'),
            ('leave.approve_leave', 'department'),
            ('leave.reject_leave', 'department'),
            ('shift.view_shift', 'department'),
            ('shift.assign_shift', 'team'),
            ('performance.view_performance', 'department'),
            ('performance.create_review', 'team'),
            ('performance.set_goals', 'team'),
            ('training.view_training', 'department'),
            ('training.manage_training', 'department'),
            ('assets.view_assets', 'department'),
            ('assets.assign_asset', 'team'),
            ('documents.view_documents', 'department'),
            ('documents.approve_document', 'department'),
            ('reports.view_reports', 'department'),
        ]
        
        for perm_code, scope_code in manager_permissions:
            if perm_code in permissions:
                RolePermission.objects.get_or_create(
                    role=manager_role,
                    permission=permissions[perm_code],
                    defaults={'scope': scopes[scope_code]}
                )
        
        self.stdout.write(self.style.SUCCESS(f'   + Created "Manager" role'))
        
        # ========== ROLE 3: HR ==========
        hr_role, _ = Role.objects.get_or_create(
            code='hr',
            defaults={
                'name': 'HR',
                'description': 'Human Resources with company-wide access',
                'role_type': 'system',
                'is_system': True,
                'default_scope': scopes['company']
            }
        )
        
        # HR Permissions (COMPANY scope - almost everything)
        hr_permissions = [
            # Employee Management
            ('employee.view_employee', 'company'),
            ('employee.add_employee', 'company'),
            ('employee.edit_employee', 'company'),
            ('employee.delete_employee', 'company'),
            ('employee.view_employee_salary', 'company'),
            ('employee.edit_employee_salary', 'company'),
            
            # Attendance
            ('attendance.view_attendance', 'company'),
            ('attendance.edit_attendance', 'company'),
            ('attendance.approve_attendance', 'company'),
            ('attendance.view_attendance_reports', 'company'),
            ('attendance.export_attendance', 'company'),
            
            # Leave
            ('leave.view_leave', 'company'),
            ('leave.approve_leave', 'company'),
            ('leave.reject_leave', 'company'),
            ('leave.manage_leave_policy', 'company'),
            
            # Shift
            ('shift.view_shift', 'company'),
            ('shift.create_shift', 'company'),
            ('shift.edit_shift', 'company'),
            ('shift.assign_shift', 'company'),
            ('shift.delete_shift', 'company'),
            
            # Payroll
            ('payroll.view_payroll', 'company'),
            ('payroll.process_payroll', 'company'),
            ('payroll.view_payslip', 'company'),
            ('payroll.generate_payslip', 'company'),
            ('payroll.export_payroll', 'company'),
            
            # Recruitment
            ('recruitment.view_job_posting', 'company'),
            ('recruitment.create_job_posting', 'company'),
            ('recruitment.edit_job_posting', 'company'),
            ('recruitment.view_candidates', 'company'),
            ('recruitment.manage_candidates', 'company'),
            ('recruitment.schedule_interview', 'company'),
            
            # Performance
            ('performance.view_performance', 'company'),
            ('performance.create_review', 'company'),
            ('performance.edit_review', 'company'),
            
            # Training
            ('training.view_training', 'company'),
            ('training.create_training', 'company'),
            ('training.manage_training', 'company'),
            
            # Assets
            ('assets.view_assets', 'company'),
            ('assets.create_asset', 'company'),
            ('assets.assign_asset', 'company'),
            ('assets.return_asset', 'company'),
            
            # Documents
            ('documents.view_documents', 'company'),
            ('documents.upload_document', 'company'),
            ('documents.edit_document', 'company'),
            ('documents.approve_document', 'company'),
            
            # Reports
            ('reports.view_reports', 'company'),
            ('reports.create_report', 'company'),
            ('reports.export_report', 'company'),
            ('reports.view_analytics', 'company'),
            
            # Core/Settings (limited)
            ('core.manage_departments', 'company'),
            ('core.manage_designations', 'company'),
            ('core.view_audit_log', 'company'),
        ]
        
        for perm_code, scope_code in hr_permissions:
            if perm_code in permissions:
                RolePermission.objects.get_or_create(
                    role=hr_role,
                    permission=permissions[perm_code],
                    defaults={'scope': scopes[scope_code]}
                )
        
        self.stdout.write(self.style.SUCCESS(f'   + Created "HR" role'))
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(': Role Summary:'))
        self.stdout.write(f'   - Standard Employee: {employee_role.rolepermission_set.count()} permissions (SELF scope)')
        self.stdout.write(f'   - Manager: {manager_role.rolepermission_set.count()} permissions (DEPARTMENT scope)')
        self.stdout.write(f'   - HR: {hr_role.rolepermission_set.count()} permissions (COMPANY scope)')
        self.stdout.write(f'   - Admins: ALL permissions (ORGANIZATION scope)')
