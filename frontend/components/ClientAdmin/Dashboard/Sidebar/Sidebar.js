'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, Calendar, Clock,
    Wallet, FileText, Settings, ChevronDown,
    ChevronRight, LogOut, Bell, User, CheckCircle2
} from 'lucide-react';
import { usePermissions } from '@/context/PermissionContext';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ClientAdmin/Dashboard/ThemeToggle/ThemeToggle';
import './Sidebar.css';

const menuItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        permission: 'dashboard.view', // Everyone can see dashboard
    },
    {
        id: 'profile',
        label: 'My Profile',
        icon: User,
        path: '/dashboard/profile',
        // No permission needed - everyone can see their own profile
    },
    {
        id: 'employees',
        label: 'Employees',
        icon: Users,
        path: '/dashboard/employees',
        permission: 'employees.view', // Need employee view permission
        adminOnly: false, // Not admin-only, but needs permission
        children: [
            { id: 'all-employees', label: 'All Employees', path: '/dashboard/employees', permission: 'employees.view' },
            { id: 'departments', label: 'Departments', path: '/dashboard/employees/departments', permission: 'employees.view' },
            { id: 'designations', label: 'Designations', path: '/dashboard/employees/designations', permission: 'employees.view' },
            { id: 'roles-permissions', label: 'Roles & Permissions', path: '/dashboard/employees/roles', adminOnly: true },
            { id: 'document-requests', label: 'Document Requests', path: '/dashboard/employees/document-requests' },
            { id: 'shift-requests', label: 'Shift Requests', path: '/dashboard/employees/shift-requests' },
            { id: 'work-type-requests', label: 'Work Type Requests', path: '/dashboard/employees/work-type-requests' },
        ]
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: CheckCircle2,
        path: '/dashboard/attendance',
        permission: 'attendance.view',
        children: [
            { id: 'att-dashboard', label: 'Dashboard', path: '/dashboard/attendance' },
            { id: 'att-biometric', label: 'Biometric Devices', path: '/dashboard/attendance/biometric', adminOnly: true },
            { id: 'att-attendances', label: 'Attendances', path: '/dashboard/attendance/list', permission: 'attendance.manage' },
            { id: 'att-requests', label: 'Attendance Requests', path: '/dashboard/attendance/requests', permission: 'attendance.approve' },
            { id: 'att-hour-account', label: 'Hour Account', path: '/dashboard/attendance/hour-account' },
            { id: 'att-work-records', label: 'Work Records', path: '/dashboard/attendance/work-records' },
            { id: 'att-activities', label: 'Attendance Activities', path: '/dashboard/attendance/activities' },
            { id: 'att-late-early', label: 'Late Come Early Out', path: '/dashboard/attendance/late-early' },
            { id: 'att-my-attendance', label: 'My Attendances', path: '/dashboard/attendance/my-attendance' },
        ]
    },
    {
        id: 'leave',
        label: 'Leave Management',
        icon: Calendar,
        path: '/dashboard/leave',
        permission: 'leave.view',
        children: [
            { id: 'leave-requests', label: 'Leave Requests', path: '/dashboard/leave', permission: 'leave.view' },
            { id: 'leave-types', label: 'Leave Types', path: '/dashboard/leave/types', adminOnly: true },
            { id: 'leave-balance', label: 'Leave Balance', path: '/dashboard/leave/balance' },
        ]
    },
    {
        id: 'payroll',
        label: 'Payroll',
        icon: Wallet,
        path: '/dashboard/payroll',
        permission: 'payroll.view',
        children: [
            { id: 'salary-structure', label: 'Salary Structure', path: '/dashboard/payroll/structure', permission: 'payroll.manage' },
            { id: 'payslips', label: 'Payslips', path: '/dashboard/payroll/payslips' },
            { id: 'run-payroll', label: 'Run Payroll', path: '/dashboard/payroll/run', permission: 'payroll.manage' },
        ]
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        path: '/dashboard/reports',
        permission: 'reports.view',
    },

    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/dashboard/settings',
        adminOnly: true, // Only admins can access settings
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { hasHRMS, hasPayroll, hasPermission, isAdmin } = usePermissions();
    const [expandedItems, setExpandedItems] = useState(() => {
        // Initial state: opened items by default + items that are parents of the current path
        const defaultExpanded = ['attendance'];

        menuItems.forEach(item => {
            if (item.children && !defaultExpanded.includes(item.id)) {
                if (item.children.some(child => pathname.startsWith(child.path))) {
                    defaultExpanded.push(item.id);
                }
            }
        });
        return defaultExpanded;
    });

    // Auto-expand parent if a child is active (useful for direct navigation or URL changes)
    useEffect(() => {
        const itemsToExpand = [...expandedItems];
        let changed = false;

        menuItems.forEach(item => {
            if (item.children && !itemsToExpand.includes(item.id)) {
                if (item.children.some(child => pathname.startsWith(child.path))) {
                    itemsToExpand.push(item.id);
                    changed = true;
                }
            }
        });

        if (changed) {
            setExpandedItems(itemsToExpand);
        }
    }, [pathname]);

    const toggleExpand = (itemId) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const isActive = (path) => pathname === path;
    const isParentActive = (item) => {
        if (isActive(item.path)) return true;
        if (item.children) {
            return item.children.some(child => pathname.startsWith(child.path));
        }
        return false;
    };

    const filteredMenuItems = menuItems.filter(item => {
        // 1. Check Subscription Plan
        if (item.module === 'HRMS' && !hasHRMS) return false;
        if (item.module === 'Payroll' && !hasPayroll) return false;

        // 2. Check Admin-Only items
        if (item.adminOnly && !isAdmin) return false;

        // 3. Check Granular Permission
        if (item.permission && !hasPermission(item.permission)) {
            return false;
        }

        return true;
    });

    // Also filter children based on permissions
    const filterChildren = (children) => {
        if (!children) return [];
        return children.filter(child => {
            if (child.adminOnly && !isAdmin) return false;
            if (child.permission && !hasPermission(child.permission)) return false;
            return true;
        });
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">H</div>
                <span className="sidebar__logo-text">HRMS Payroll</span>
            </div>

            {/* Main Menu */}
            <div className="sidebar__menu-label">MAIN MENU</div>

            <nav className="sidebar__nav">
                {filteredMenuItems.map(item => {
                    const Icon = item.icon;
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.includes(item.id);
                    const isItemActive = isParentActive(item);

                    return (
                        <div key={item.id} className="sidebar__item-wrapper">
                            {hasChildren ? (
                                <>
                                    <button
                                        className={`sidebar__item ${isItemActive ? 'sidebar__item--active' : ''}`}
                                        onClick={() => toggleExpand(item.id)}
                                    >
                                        <Icon className="sidebar__item-icon" size={20} />
                                        <span className="sidebar__item-label">{item.label}</span>
                                        {isExpanded ? (
                                            <ChevronDown className="sidebar__item-arrow" size={16} />
                                        ) : (
                                            <ChevronRight className="sidebar__item-arrow" size={16} />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="sidebar__submenu">
                                            {filterChildren(item.children).map(child => (
                                                <Link
                                                    key={child.id}
                                                    href={child.path}
                                                    className={`sidebar__subitem ${isActive(child.path) ? 'sidebar__subitem--active' : ''}`}
                                                >
                                                    <span className="sidebar__subitem-dot"></span>
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.path}
                                    className={`sidebar__item ${isActive(item.path) ? 'sidebar__item--active' : ''}`}
                                >
                                    <Icon className="sidebar__item-icon" size={20} />
                                    <span className="sidebar__item-label">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="sidebar__footer">
                <div className="sidebar__user">
                    <div className="sidebar__user-avatar">
                        <span>{user?.name?.split(' ').map(n => n[0]).join('') || 'U'}</span>
                    </div>
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">{user?.name || 'User'}</span>
                        <span className="sidebar__user-role">
                            {user?.subscription_plan === 'both' ? 'Enterprise Plan' :
                                user?.subscription_plan === 'hrms' ? 'HRMS Plan' :
                                    user?.subscription_plan === 'payroll' ? 'Payroll Plan' :
                                        'Free Plan'}
                        </span>
                    </div>
                    <button className="sidebar__logout-btn" onClick={logout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
