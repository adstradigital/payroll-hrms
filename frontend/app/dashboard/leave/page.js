'use client';

import { useState, useEffect } from 'react';
import LeaveDashboard from '@/components/ClientAdmin/Payroll/Leave/Dashboard/LeaveDashboard';
import LeaveList from '@/components/ClientAdmin/Payroll/Leave/LeaveList/LeaveList';
import MyLeaveRequests from '@/components/ClientAdmin/Payroll/Leave/MyRequests/MyLeaveRequests';
import LeaveApprovals from '@/components/ClientAdmin/Payroll/Leave/Approvals/LeaveApprovals';
import LeaveBalance from '@/components/ClientAdmin/Payroll/Leave/LeaveBalance/LeaveBalance';
import LeaveTypes from '@/components/ClientAdmin/Payroll/Leave/LeaveTypes/LeaveTypes';
import HolidayCalendar from '@/components/ClientAdmin/Payroll/Leave/HolidayCalendar/HolidayCalendar';
import LeaveReports from '@/components/ClientAdmin/Payroll/Leave/Reports/LeaveReports';
import LeaveSettings from '@/components/ClientAdmin/Payroll/Leave/Settings/LeaveSettings';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { usePermissions } from '@/context/PermissionContext';
import { getMyProfile } from '@/api/api_clientadmin';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LeavePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'dashboard';
    const [currentUser, setCurrentUser] = useState(null);
    const { isAdmin } = usePermissions();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getMyProfile();
            setCurrentUser(res.data.employee || res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const handleTabChange = (tabId) => {
        router.push(`/dashboard/leave?tab=${tabId}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <LeaveDashboard currentUser={currentUser} />;
            case 'requests': return <MyLeaveRequests currentUser={currentUser} />;
            case 'all-requests': return <LeaveList currentUser={currentUser} />;
            case 'approvals': return <LeaveApprovals />;
            case 'balance': return <LeaveBalance />;
            case 'types': return <LeaveTypes />;
            case 'holidays': return <HolidayCalendar />;
            case 'reports': return <LeaveReports />;
            case 'settings': return <LeaveSettings />;
            default: return <LeaveDashboard currentUser={currentUser} />;
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Overview' },
        { id: 'requests', label: 'My Requests' },
        { id: 'all-requests', label: 'All Requests', adminOnly: true },
        { id: 'approvals', label: 'Approvals' },
        { id: 'balance', label: 'Balances' },
        { id: 'types', label: 'Leave Types', adminOnly: true },
        { id: 'holidays', label: 'Holidays' },
        { id: 'reports', label: 'Reports' },
        { id: 'settings', label: 'Settings', adminOnly: true },
    ].filter(tab => !tab.adminOnly || isAdmin);

    return (
        <Dashboard
            title="Leave Management"
            subtitle="Request, track, and manage employee time off"
            breadcrumbs={['Dashboard', 'Leave', activeTab.charAt(0).toUpperCase() + activeTab.slice(1)]}
        >
            <div className="leave-tabs-container">
                <div className="tabs-header">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="tabs-content">
                    <ModuleGuard module="HRMS">
                        {renderContent()}
                    </ModuleGuard>
                </div>
            </div>

            <style jsx>{`
                .leave-tabs-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .tabs-header {
                    display: flex;
                    gap: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 0.5rem;
                    overflow-x: auto;
                }
                .tab-btn {
                    padding: 0.625rem 1.25rem;
                    border: none;
                    background: none;
                    font-weight: 500;
                    color: var(--text-secondary);
                    cursor: pointer;
                    white-space: nowrap;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    color: var(--primary-color);
                    background: rgba(var(--primary-rgb), 0.05);
                }
                .tab-btn.active {
                    color: white;
                    background: var(--primary-color);
                }
            `}</style>
        </Dashboard>
    );
}
