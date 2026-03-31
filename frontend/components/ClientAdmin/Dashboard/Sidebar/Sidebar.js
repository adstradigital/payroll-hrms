'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, Calendar, Clock,
    Wallet, FileText, Settings, ChevronDown,
    ChevronRight, LogOut, Bell, User, CheckCircle2,
    X, Loader, AlertCircle, HelpCircle, Upload, Activity,
    Box, Package, TrendingUp, UserCheck,
    Container,
    Receipt
} from 'lucide-react';
import { usePermissions } from '@/context/PermissionContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ClientAdmin/Dashboard/ThemeToggle/ThemeToggle';
import './Sidebar.css';

const menuItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        translationKey: 'common.dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        permission: 'dashboard.view',
    },
    {
        id: 'profile',
        label: 'My Profile',
        translationKey: 'common.profile',
        icon: User,
        path: '/dashboard/profile',
    },
    {
        id: 'recruitment',
        label: 'Recruitment',
        translationKey: 'common.recruitment',
        module: 'HRMS',
        icon: UserCheck,
        path: '/dashboard/recruitment',
        permission: ['recruitment.view', 'recruitment.view_job_openings'],
        children: [
            { id: 'recruit-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/recruitment' },
            { id: 'recruitment-pipeline', label: 'Recruitment Pipeline', translationKey: 'common.recruitmentPipeline', path: '/dashboard/recruitment/pipeline' },
            { id: 'recruitment-survey', label: 'Recruitment Survey', translationKey: 'common.recruitmentSurvey', path: '/dashboard/recruitment/survey' },
            { id: 'candidates', label: 'Candidates', translationKey: 'common.candidates', path: '/dashboard/recruitment/candidates' },
            { id: 'interview', label: 'Interview', translationKey: 'common.interview', path: '/dashboard/recruitment/interview' },
            { id: 'recruitment-general', label: 'Recruitment', translationKey: 'common.recruitment', path: '/dashboard/recruitment/recruitment' },
            { id: 'open-jobs', label: 'Open Jobs', translationKey: 'common.openJobs', path: '/dashboard/recruitment/job-openings' },
            { id: 'stages', label: 'Stages', translationKey: 'common.stages', path: '/dashboard/recruitment/stages' },
            { id: 'skill-zone', label: 'Skill Zone', translationKey: 'common.skillZone', path: '/dashboard/recruitment/skill-zone' },
        ]
    },
    {
        id: 'employees',
        label: 'Employees',
        translationKey: 'common.employees',
        module: 'HRMS',
        icon: Users,
        path: '/dashboard/employees',
        permission: ['employees.view', 'employee.view_employee', 'employee.view_employees'],
        children: [
            { id: 'all-employees', label: 'All Employees', translationKey: 'common.allEmployees', path: '/dashboard/employees', permission: ['employees.view', 'employee.view_employee', 'employee.view_employees'] },
            { id: 'departments', label: 'Departments', translationKey: 'common.departments', path: '/dashboard/employees/departments', permission: 'employees.view' },
            { id: 'designations', label: 'Designations', translationKey: 'common.designations', path: '/dashboard/employees/designations', permission: 'employees.view' },
            { id: 'roles-permissions', label: 'Roles & Permissions', translationKey: 'common.rolesPermissions', path: '/dashboard/employees/roles', adminOnly: true },
            { id: 'document-requests', label: 'Document Requests', translationKey: 'common.documentRequests', path: '/dashboard/employees/document-requests', permission: 'documents.view_document_requests' },
            { id: 'shift-requests', label: 'Shift Requests', translationKey: 'common.shiftRequests', path: '/dashboard/employees/shift-requests', permission: 'shift.view_shift_requests' },
            { id: 'shift-approvals', label: 'Shift Approvals', path: '/dashboard/employees/shift-requests/approve', adminOnly: true },
            { id: 'work-type-requests', label: 'Work Type Requests', translationKey: 'common.workTypeRequests', path: '/dashboard/employees/work-type-requests', permission: 'employee.view_work_type_requests' },
            { id: 'work-type-approvals', label: 'Work Type Approvals', path: '/dashboard/employees/work-type-requests/approve', adminOnly: true },
        ]
    },
    {
        id: 'attendance',
        label: 'Attendance',
        translationKey: 'common.attendance',
        module: 'HRMS',
        icon: CheckCircle2,
        path: '/dashboard/attendance',
        permission: ['attendance.view', 'attendance.view_attendance'],
        children: [
            { id: 'att-dashboard', label: 'Team Dashboard', path: '/dashboard/attendance' },
            { id: 'att-my-attendance', label: 'My Attendance', path: '/dashboard/attendance/my-attendance' },
            { id: 'att-register', label: 'Attendance Register', path: '/dashboard/attendance/register', permission: 'attendance.manage' },
            { id: 'att-requests', label: 'Attendance Requests', path: '/dashboard/attendance/requests', permission: 'attendance.approve' },
            { id: 'att-work-hours', label: 'Working Hours', path: '/dashboard/attendance/work-hours' },
            { id: 'att-work-records', label: 'Attendance Records', path: '/dashboard/attendance/work-records' },
            { id: 'att-late-early', label: 'Late & Early Policies', path: '/dashboard/attendance/late-early-rules' },
            { id: 'att-holidays', label: 'Public Holidays', path: '/dashboard/attendance/holidays' },
            { id: 'att-logs', label: 'Attendance Logs', path: '/dashboard/attendance/logs' },
            { id: 'att-biometric', label: 'Biometric Devices', path: '/dashboard/attendance/biometric', adminOnly: true },
        ]
    },
    {
        id: 'leave',
        label: 'Leave Management',
        translationKey: 'common.leaveManagement',
        module: 'HRMS',
        icon: Calendar,
        path: '/dashboard/leave',
        permission: ['leave.view', 'leave.view_leave'],
        children: [
            { id: 'leave-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/leave?tab=dashboard' },
            { id: 'leave-my-requests', label: 'My Leave Requests', translationKey: 'common.myRequests', path: '/dashboard/leave?tab=requests' },
            { id: 'leave-requests-queue', label: 'Requests Queue', translationKey: 'common.requestsQueue', path: '/dashboard/leave?tab=all-requests', adminOnly: true },
            { id: 'leave-approvals', label: 'Approvals', translationKey: 'common.approvals', path: '/dashboard/leave?tab=approvals', permission: 'leave.view' },
            { id: 'leave-types', label: 'Leave Types', translationKey: 'common.leaveManagement', path: '/dashboard/leave?tab=types', adminOnly: true },
            { id: 'leave-holidays', label: 'Holiday Calendar', translationKey: 'common.holidayCalendar', path: '/dashboard/leave?tab=holidays' },
            { id: 'leave-balance', label: 'Leave Balance', translationKey: 'common.leaveBalance', path: '/dashboard/leave?tab=balance' },
            { id: 'leave-reports-sub', label: 'Reports', translationKey: 'common.reports', path: '/dashboard/leave?tab=reports', permission: 'reports.view_reports' },
            { id: 'leave-settings', label: 'Settings', translationKey: 'common.settings', path: '/dashboard/leave?tab=settings', adminOnly: true },
        ]
    },

    {
        id: 'performance',
        label: 'Performance',
        module: 'HRMS',
        icon: TrendingUp,
        path: '/dashboard/performance',
        permission: ['performance.view', 'performance.view_performance'],
        children: [
            { id: 'perf-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/performance' },
            { id: 'perf-periods', label: 'Review Periods', path: '/dashboard/performance/periods' },
            { id: 'perf-objectives', label: 'Objectives', path: '/dashboard/performance/objectives' },
            { id: 'perf-key-results', label: 'Key Results', path: '/dashboard/performance/key-results' },
            { id: 'perf-templates', label: 'Templates', path: '/dashboard/performance/templates', adminOnly: true },
            { id: 'perf-ratings', label: 'Ratings', path: '/dashboard/performance/ratings', adminOnly: true },
            { id: 'perf-reviews', label: 'Reviews', path: '/dashboard/performance/reviews' },
            { id: 'perf-bonus', label: 'Bonus Points', path: '/dashboard/performance/bonus-points', adminOnly: true },
        ]
    },
    {
        id: 'expenses',
        label: 'Expense Management',
        translationKey: 'common.reimbursements',
        module: 'HRMS',
        icon: Receipt,
        path: '/dashboard/expenses',
        children: [
            {
                id: 'expense-dashboard',
                label: 'Dashboard',
                path: '/dashboard/expenses'
            },

            {
                id: 'my-expense-claims',
                label: 'My Expense Claims',
                path: '/dashboard/expenses/my-claims'
            },

            {
                id: 'submit-expense-claim',
                label: 'Submit Expense Claim',
                path: '/dashboard/expenses/submit'
            },

            {
                id: 'expense-approvals',
                label: 'Approvals',
                path: '/dashboard/expenses/approvals',
                adminOnly: true
            },

            {
                id: 'expense-categories',
                label: 'Categories',
                path: '/dashboard/expenses/categories',
                adminOnly: true
            },

            {
                id: 'expense-reports',
                label: 'Reports',
                path: '/dashboard/expenses/reports'
            }
        ]
    },
    {
        id: 'payroll',
        label: 'Payroll',
        translationKey: 'common.payroll',
        module: 'Payroll',
        icon: Wallet,
        path: '/dashboard/payroll',
        permission: ['payroll.view', 'payroll.view_payslip', 'payroll.view_payslips'],
        children: [
            { id: 'payroll-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/payroll' },
            { id: 'salary-components', label: 'Salary Components', translationKey: 'common.salaryComponents', path: '/dashboard/payroll/salarycomponents', permission: 'payroll.manage' },
            { id: 'salary-structure', label: 'Salary Structure', translationKey: 'common.salaryStructure', path: '/dashboard/payroll/structure', permission: 'payroll.manage' },
            { id: 'employee-salary', label: 'Employee Salary', translationKey: 'common.employeeSalary', path: '/dashboard/payroll/employee-salary', permission: 'payroll.manage' },
            { id: 'payslips', label: 'Payslips', translationKey: 'common.payslips', path: '/dashboard/payroll/payslips' },
            { id: 'encashments', label: 'Encashments & Reimbursements', translationKey: 'common.encashments', path: '/dashboard/payroll/encashments-reimbursements', permission: 'payroll.manage' },
            { id: 'bonus-incentives', label: 'Bonus & Incentives', path: '/dashboard/payroll/bonus-incentives', permission: 'payroll.manage' },
            { id: 'sales-commission', label: 'Sales Commission', path: '/dashboard/payroll/sales-commission', permission: 'payroll.manage' },
            { id: 'tax', label: 'Tax Management', translationKey: 'common.tax', path: '/dashboard/payroll/tax', permission: 'payroll.manage' },
            { id: 'advance-salary', label: 'Advance Salary', path: '/dashboard/payroll/advance-salary' },
            { id: 'advance-approvals', label: 'Advance Approvals', path: '/dashboard/payroll/advance-approvals', adminOnly: true },
            { id: 'loans', label: 'Loans & EMI', translationKey: 'common.loans', path: '/dashboard/payroll/loans', permission: 'payroll.manage' },
            { id: 'loan-approvals', label: 'Loan Approvals', path: '/dashboard/payroll/loan-approvals', adminOnly: true },
            { id: 'loan-repayment', label: 'Loan Repayment Tracking', path: '/dashboard/payroll/loan-repayment-tracking', permission: 'payroll.manage' },
            { id: 'run-payroll', label: 'Run Payroll', translationKey: 'common.runPayroll', path: '/dashboard/payroll/run', permission: 'payroll.manage' },
            { id: 'ctc-calculator', label: 'CTC Calculator', path: '/dashboard/payroll/ctc-calculator', permission: 'payroll.view' },
        ]
    },
    {
        id: 'assets-module',
        label: 'Assets',
        translationKey: 'common.assets',
        module: 'Payroll',
        icon: Package,
        path: '/dashboard/payroll/assets',
        children: [
            { id: 'assets-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/payroll/assets' },
            { id: 'assets-manage', label: 'Manage Assets', translationKey: 'common.manageAssets', path: '/dashboard/payroll/assets/manage' },
            { id: 'assets-batches', label: 'Asset Batches', translationKey: 'common.assetBatches', path: '/dashboard/payroll/assets/batches' },
            { id: 'assets-requests-sub', label: 'Asset Requests', translationKey: 'common.assetRequests', path: '/dashboard/payroll/assets/requests' },
            { id: 'assets-approvals', label: 'Asset Approvals', translationKey: 'common.approvals', path: '/dashboard/payroll/assets/approvals', adminOnly: true },
            { id: 'assets-history-sub', label: 'Asset History', translationKey: 'common.assetHistory', path: '/dashboard/payroll/assets/history' },
        ]
    },
    {
        id: 'bulk-upload',
        label: 'Bulk Upload',
        translationKey: 'common.bulkUpload',
        icon: Upload,
        path: '/dashboard/payroll/bulk-upload',
        adminOnly: true,
        children: [
            { id: 'bu-dashboard', label: 'Dashboard', translationKey: 'common.dashboard', path: '/dashboard/payroll/bulk-upload/dashboard' },
            { id: 'bu-employee', label: 'Employee Data', translationKey: 'common.employeeData', path: '/dashboard/payroll/bulk-upload/employee' },
            { id: 'bu-salary', label: 'Salary Data', translationKey: 'common.salaryData', path: '/dashboard/payroll/bulk-upload/salary' },
            { id: 'bu-attendance', label: 'Attendance Data', translationKey: 'common.attendanceData', path: '/dashboard/payroll/bulk-upload/attendance' },
            { id: 'bu-history', label: 'Upload History', translationKey: 'common.uploadHistory', path: '/dashboard/payroll/bulk-upload/history' },
            { id: 'bu-templates', label: 'Download Templates', translationKey: 'common.downloadTemplates', path: '/dashboard/payroll/bulk-upload/templates' },
        ]
    },
    {
        id: 'system-logs',
        label: 'System Logs',
        translationKey: 'common.systemLogs',
        icon: Activity,
        path: '/dashboard/logs',
        adminOnly: true,
    },
    {
        id: 'reports',
        label: 'Reports',
        translationKey: 'common.reports',
        icon: FileText,
        path: '/dashboard/reports',
        permission: ['reports.view', 'reports.view_reports'],
    },
    {
        id: 'support',
        label: 'Support',
        translationKey: 'common.support',
        icon: HelpCircle,
        path: '/dashboard/support/help-center',
        children: [
            { id: 'help-center', label: 'Help Center', translationKey: 'common.helpCenter', path: '/dashboard/support/help-center' },
            { id: 'support-tickets', label: 'My Tickets', translationKey: 'common.myTickets', path: '/dashboard/support/tickets' },
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        translationKey: 'common.settings',
        icon: Settings,
        path: '/dashboard/settings',
        adminOnly: true,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { hasHRMS, hasPayroll, hasPermission, hasAnyPermission, isAdmin, hasTaxManagement, designation } = usePermissions();

    // Logout Flow States
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showWorkReportModal, setShowWorkReportModal] = useState(false);
    const [workReport, setWorkReport] = useState({ tasks: '', notes: '' });
    const [submittingReport, setSubmittingReport] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState(null); // { checkedIn: bool, checkedOut: bool }
    const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
    const [checkingAttendance, setCheckingAttendance] = useState(false);
    const [ticketStats, setTicketStats] = useState(null);

    const pathMatchesCurrent = (targetPath, { exact = false } = {}) => {
        const [basePath, queryString = ''] = targetPath.split('?');
        const targetParams = new URLSearchParams(queryString);
        const targetEntries = Array.from(targetParams.entries());

        if (targetEntries.length > 0) {
            if (pathname !== basePath) return false;
            return targetEntries.every(([key, value]) => {
                const currentValue = searchParams.get(key);
                if (currentValue === value) return true;
                return key === 'tab' && value === 'dashboard' && currentValue === null;
            });
        }

        if (exact) {
            return pathname === basePath;
        }

        return pathname === basePath || pathname.startsWith(basePath + '/');
    };

    const [expandedItems, setExpandedItems] = useState(() => {
        const defaultExpanded = [];

        // Find the "best match" top-level item for the current path
        const findBestMatch = (items) => {
            let bestMatch = null;
            let maxLen = -1;

            items.forEach(item => {
                if (pathMatchesCurrent(item.path, { exact: false }) && item.path.length > maxLen) {
                    maxLen = item.path.length;
                    bestMatch = item;
                }
            });
            return bestMatch;
        };

        const activeTopLevel = findBestMatch(menuItems);
        if (activeTopLevel && activeTopLevel.children) {
            defaultExpanded.push(activeTopLevel.id);

            // Check for second level matches
            const activeChild = findBestMatch(activeTopLevel.children);
            if (activeChild && activeChild.children) {
                defaultExpanded.push(activeChild.id);
            }
        }

        return defaultExpanded;
    });

    useEffect(() => {
        const sidebarNav = document.querySelector('.sidebar__nav');
        if (sidebarNav) {
            const savedScroll = sessionStorage.getItem('sidebar-scroll');
            if (savedScroll) {
                requestAnimationFrame(() => {
                    sidebarNav.scrollTop = parseInt(savedScroll, 10);
                });
            }
            const handleScroll = () => {
                sessionStorage.setItem('sidebar-scroll', sidebarNav.scrollTop.toString());
            };
            sidebarNav.addEventListener('scroll', handleScroll);
            return () => sidebarNav.removeEventListener('scroll', handleScroll);
        }
    }, [pathname, expandedItems]);

    useEffect(() => {
        const itemsToExpand = [...expandedItems];
        let changed = false;

        const findBestMatch = (items) => {
            let bestMatch = null;
            let maxLen = -1;

            items.forEach(item => {
                if (pathMatchesCurrent(item.path, { exact: false }) && item.path.length > maxLen) {
                    maxLen = item.path.length;
                    bestMatch = item;
                }
            });
            return bestMatch;
        };

        const activeTopLevel = findBestMatch(menuItems);
        if (activeTopLevel && activeTopLevel.children && !itemsToExpand.includes(activeTopLevel.id)) {
            itemsToExpand.push(activeTopLevel.id);
            changed = true;
        }

        // If a top level is expanded, check its children
        if (activeTopLevel && activeTopLevel.children) {
            const activeChild = findBestMatch(activeTopLevel.children);
            if (activeChild && activeChild.children && !itemsToExpand.includes(activeChild.id)) {
                itemsToExpand.push(activeChild.id);
                changed = true;
            }
        }

        if (changed) {
            setExpandedItems(itemsToExpand);
        }
    }, [pathname, searchParams]);

    useEffect(() => {
        // Fetch ticket stats on component mount
        fetchTicketStats();
    }, []);

    const toggleExpand = (itemId) => {
        setExpandedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const isActive = (path) => pathMatchesCurrent(path, { exact: true });
    const isParentActive = (item) => {
        if (isActive(item.path)) return true;

        // Stricter check: is this item the best matching top-level item?
        const itemsToMatch = menuItems;
        let bestMatch = null;
        let maxLen = -1;

        itemsToMatch.forEach(mi => {
            if (pathMatchesCurrent(mi.path, { exact: false }) && mi.path.length > maxLen) {
                maxLen = mi.path.length;
                bestMatch = mi;
            }
        });

        // If this is a top-level item, check if it's the best match
        if (menuItems.some(mi => mi.id === item.id)) {
            return bestMatch?.id === item.id;
        }

        // If this is a sub-item, check if it's a prefix of the current path
        if (item.children) {
            return item.children.some(child => pathMatchesCurrent(child.path, { exact: false }));
        }

        return pathMatchesCurrent(item.path, { exact: false });
    };

    const fetchTicketStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/support/tickets/stats/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTicketStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch ticket stats:', err);
        }
    };

    const checkPermission = (item) => {
        // 1. Check Subscription Plan
        if (item.module === 'HRMS' && !hasHRMS) return false;
        if (item.module === 'Payroll' && !hasPayroll) return false;

        // 2. Check Admin-Only
        if (item.adminOnly && !isAdmin) return false;

        // 3. Check Conditional Features
        if (item.id === 'tax' && !hasTaxManagement) return false;

        // 4. Check Granular Permission
        if (item.permission) {
            if (Array.isArray(item.permission)) {
                if (!hasAnyPermission(item.permission)) return false;
            } else {
                if (!hasPermission(item.permission)) return false;
            }
        }
        return true;
    };

    const filteredMenuItems = menuItems.filter(checkPermission);

    // Also filter children based on permissions
    const filterChildren = (children) => {
        if (!children) return [];
        return children.filter(checkPermission);
    };

    // Logout Flow Handlers
    const handleLogoutClick = async () => {
        setCheckingAttendance(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/my_dashboard/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const today = data.today;
                const employeeId = data.employee?.id;

                if (employeeId) {
                    console.log('[Sidebar] 🕒 Captured Employee ID for checkout:', employeeId);
                    setCurrentEmployeeId(employeeId);
                    localStorage.setItem('employeeId', employeeId);
                }

                // Check if clocked in but not clocked out
                if (today?.check_in && !today?.check_out) {
                    setAttendanceStatus({ checkedIn: true, checkedOut: false });
                    setShowLogoutConfirm(true);
                } else {
                    // Already clocked out or not clocked in today - just logout
                    logout();
                }
            } else {
                // API error - just logout
                logout();
            }
        } catch (err) {
            console.error('Error checking attendance:', err);
            logout();
        } finally {
            setCheckingAttendance(false);
        }
    };

    const handleConfirmLogoutWithReport = () => {
        setShowLogoutConfirm(false);
        setShowWorkReportModal(true);
    };

    const handleSubmitReportAndLogout = async () => {
        if (!workReport.tasks.trim()) return;

        setSubmittingReport(true);
        try {
            const token = localStorage.getItem('accessToken');
            let employeeId = currentEmployeeId || localStorage.getItem('employeeId');

            // --- Robust ID Fetching Fallback ---
            if (!employeeId) {
                console.log('[Sidebar] ⚠️ Employee ID missing during checkout. Attempting final fetch...');
                try {
                    const dashboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/my_dashboard/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (dashboardRes.ok) {
                        const data = await dashboardRes.json();
                        employeeId = data.employee?.id;
                        if (employeeId) {
                            localStorage.setItem('employeeId', employeeId);
                            console.log('[Sidebar] ✅ Fallback fetch successful. ID:', employeeId);
                        }
                    }
                } catch (e) { console.error('[Sidebar] Fallback fetch failed', e); }
            }
            // ------------------------------------

            if (!employeeId) {
                console.error('[Sidebar] ❌ Cannot clock out. No Employee ID found.');
                alert('Attendance check-out failed: Employee Profile not found. Please contact support.');
                setSubmittingReport(false);
                return;
            }

            // Clock out with work report
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-out/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee: employeeId,
                    work_report: {
                        tasks_completed: workReport.tasks,
                        notes: workReport.notes
                    }
                })
            });

            if (response.ok) {
                setShowWorkReportModal(false);
                setWorkReport({ tasks: '', notes: '' });
                logout();
            } else {
                const errorData = await response.json();
                console.error('Checkout failed:', errorData);
                alert('Checkout failed: ' + (errorData.error || errorData.detail || 'Unknown error. Please try again or contact support.'));
            }
        } catch (err) {
            console.error('Error submitting report:', err);
        } finally {
            setSubmittingReport(false);
        }
    }; return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">H</div>
                <span className="sidebar__logo-text">HRMS Payroll</span>
            </div>

            {/* Main Menu */}
            <div className="sidebar__menu-label">{t('common.mainMenu')}</div>

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
                                        <span className="sidebar__item-label">{t(item.translationKey) || item.label}</span>
                                        {isExpanded ? (
                                            <ChevronDown className="sidebar__item-arrow" size={16} />
                                        ) : (
                                            <ChevronRight className="sidebar__item-arrow" size={16} />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="sidebar__submenu">
                                            {filterChildren(item.children).map(child => {
                                                const hasGrandChildren = child.children && child.children.length > 0;
                                                const isChildExpanded = expandedItems.includes(child.id);
                                                const isChildActive = isParentActive(child);
                                                const ChildIcon = child.icon;

                                                return (
                                                    <div key={child.id} className="sidebar__subitem-wrapper">
                                                        {hasGrandChildren ? (
                                                            <>
                                                                <button
                                                                    className={`sidebar__subitem ${isChildActive ? 'sidebar__subitem--active' : ''}`}
                                                                    onClick={() => toggleExpand(child.id)}
                                                                >
                                                                    <span className="sidebar__subitem-dot"></span>
                                                                    {ChildIcon && <ChildIcon className="sidebar__subitem-icon" size={16} />}
                                                                    <span className="sidebar__subitem-label">{t(child.translationKey) || child.label}</span>
                                                                    {isChildExpanded ? (
                                                                        <ChevronDown className="sidebar__item-arrow" size={14} />
                                                                    ) : (
                                                                        <ChevronRight className="sidebar__item-arrow" size={14} />
                                                                    )}
                                                                </button>
                                                                {isChildExpanded && (
                                                                    <div className="sidebar__grand-submenu">
                                                                        {filterChildren(child.children).map(grandChild => (
                                                                            <Link
                                                                                key={grandChild.id}
                                                                                href={grandChild.path}
                                                                                className={`sidebar__grand-subitem ${isActive(grandChild.path) ? 'sidebar__grand-subitem--active' : ''}`}
                                                                            >
                                                                                <span className="sidebar__grand-subitem-dot"></span>
                                                                                {t(grandChild.translationKey) || grandChild.label}
                                                                            </Link>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Link
                                                                href={child.path}
                                                                className={`sidebar__subitem ${isActive(child.path) ? 'sidebar__subitem--active' : ''}`}
                                                            >
                                                                <span className="sidebar__subitem-dot"></span>
                                                                {ChildIcon && <ChildIcon className="sidebar__subitem-icon" size={16} />}
                                                                {t(child.translationKey) || child.label}
                                                                {item.id === 'support' && child.id === 'support-tickets' && ticketStats && (
                                                                    <span className="sidebar__badge">
                                                                        {ticketStats.open + ticketStats.in_progress}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.path}
                                    className={`sidebar__item ${isActive(item.path) ? 'sidebar__item--active' : ''}`}
                                >
                                    <Icon className="sidebar__item-icon" size={20} />
                                    <span className="sidebar__item-label">{t(item.translationKey) || item.label}</span>
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
                            {user?.subscription_plan === 'both' || user?.subscription_plan === 'enterprise' ? 'Enterprise Plan' :
                                user?.subscription_plan === 'hrms' ? 'HRMS Plan' :
                                    user?.subscription_plan === 'payroll' ? 'Payroll Plan' :
                                        'Free Plan'}
                        </span>
                    </div>
                    <button
                        className="sidebar__logout-btn"
                        onClick={handleLogoutClick}
                        disabled={checkingAttendance}
                        title={t('common.logout')}
                    >
                        {checkingAttendance ? <Loader size={18} className="animate-spin" /> : <LogOut size={18} />}
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="sidebar-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="sidebar-modal" onClick={e => e.stopPropagation()}>
                        <div className="sidebar-modal__header">
                            <h3><AlertCircle size={20} /> Work Report Required</h3>
                            <button className="sidebar-modal__close" onClick={() => setShowLogoutConfirm(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="sidebar-modal__body">
                            <div className="sidebar-modal__icon">
                                <Clock size={48} />
                            </div>
                            <p><strong>You haven't clocked out yet!</strong></p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Please submit your work report and clock out before logging out.
                            </p>
                        </div>
                        <div className="sidebar-modal__footer">
                            <button className="sidebar-modal__btn sidebar-modal__btn--secondary" onClick={() => setShowLogoutConfirm(false)}>
                                Cancel
                            </button>
                            <button className="sidebar-modal__btn sidebar-modal__btn--primary" onClick={handleConfirmLogoutWithReport}>
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Work Report Modal */}
            {showWorkReportModal && (
                <div className="sidebar-modal-overlay">
                    <div className="sidebar-modal sidebar-modal--lg" onClick={e => e.stopPropagation()}>
                        <div className="sidebar-modal__header">
                            <h3><FileText size={20} /> Daily Work Report</h3>
                        </div>
                        <div className="sidebar-modal__body">
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                Please submit your work report before logging out. This is required.
                            </p>

                            <div className="sidebar-modal__form-group">
                                <label>Tasks Completed Today <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                <textarea
                                    rows={4}
                                    placeholder="List the tasks you completed today..."
                                    value={workReport.tasks}
                                    onChange={(e) => setWorkReport(prev => ({ ...prev, tasks: e.target.value }))}
                                />
                            </div>

                            <div className="sidebar-modal__form-group">
                                <label>Additional Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Any blockers, issues, or notes for tomorrow..."
                                    value={workReport.notes}
                                    onChange={(e) => setWorkReport(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="sidebar-modal__footer">
                            <button
                                className="sidebar-modal__btn sidebar-modal__btn--secondary"
                                onClick={() => {
                                    setShowWorkReportModal(false);
                                    setWorkReport({ tasks: '', notes: '' });
                                }}
                                disabled={submittingReport}
                            >
                                Cancel
                            </button>
                            <button
                                className="sidebar-modal__btn sidebar-modal__btn--primary"
                                onClick={handleSubmitReportAndLogout}
                                disabled={!workReport.tasks.trim() || submittingReport}
                            >
                                {submittingReport ? (
                                    <><Loader size={16} className="animate-spin" /> Submitting...</>
                                ) : (
                                    <><CheckCircle2 size={16} /> Submit & Logout</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
