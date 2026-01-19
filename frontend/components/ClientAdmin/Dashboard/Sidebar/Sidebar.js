'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, Calendar, Clock,
    Wallet, FileText, Settings, ChevronDown,
    ChevronRight, LogOut, Bell, User
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
    },
    {
        id: 'profile',
        label: 'My Profile',
        icon: User,
        path: '/dashboard/profile',
    },
    {
        id: 'employees',
        label: 'Employees',
        icon: Users,
        path: '/dashboard/employees',
        children: [
            { id: 'all-employees', label: 'All Employees', path: '/dashboard/employees' },
            { id: 'departments', label: 'Departments', path: '/dashboard/employees/departments' },
            { id: 'designations', label: 'Designations', path: '/dashboard/employees/designations' },
        ]
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: Clock,
        path: '/dashboard/attendance',
        module: 'HRMS',
        children: [
            { id: 'daily-attendance', label: 'Daily Attendance', path: '/dashboard/attendance' },
            { id: 'shifts', label: 'Shifts', path: '/dashboard/attendance/shifts' },
            { id: 'holidays', label: 'Holidays', path: '/dashboard/attendance/holidays' },
        ]
    },
    {
        id: 'leave',
        label: 'Leave Management',
        icon: Calendar,
        path: '/dashboard/leave',
        module: 'HRMS',
        children: [
            { id: 'leave-requests', label: 'Leave Requests', path: '/dashboard/leave' },
            { id: 'leave-types', label: 'Leave Types', path: '/dashboard/leave/types' },
            { id: 'leave-balance', label: 'Leave Balance', path: '/dashboard/leave/balance' },
        ]
    },
    {
        id: 'payroll',
        label: 'Payroll',
        icon: Wallet,
        path: '/dashboard/payroll',
        module: 'Payroll',
        children: [
            { id: 'salary-structure', label: 'Salary Structure', path: '/dashboard/payroll/structure' },
            { id: 'payslips', label: 'Payslips', path: '/dashboard/payroll/payslips' },
            { id: 'run-payroll', label: 'Run Payroll', path: '/dashboard/payroll/run' },
        ]
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        path: '/dashboard/reports',
    },

    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/dashboard/settings',
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { hasHRMS, hasPayroll } = usePermissions();
    const [expandedItems, setExpandedItems] = useState(['employees', 'payroll']);

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
        if (!item.module) return true;
        if (item.module === 'HRMS') return hasHRMS;
        if (item.module === 'Payroll') return hasPayroll;
        return true;
    });

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
                                            {item.children.map(child => (
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
