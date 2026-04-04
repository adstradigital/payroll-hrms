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
                    gap: 2rem;
                }
                
                .tabs-header {
                    display: flex;
                    gap: 1rem;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 0;
                    margin-bottom: 0.5rem;
                    overflow-x: auto;
                    scrollbar-width: none; /* Firefox */
                }
                .tabs-header::-webkit-scrollbar { 
                    display: none; /* Safari/Chrome */
                }
                
                .tab-btn {
                    padding: 0.875rem 0.5rem;
                    margin: 0 0.5rem;
                    border: none;
                    background: transparent;
                    font-weight: 500;
                    font-size: 0.95rem;
                    color: var(--text-muted);
                    cursor: pointer;
                    white-space: nowrap;
                    position: relative;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px; /* Overlap container border */
                }
                
                .tab-btn:hover {
                    color: var(--text-primary);
                }
                
                .tab-btn.active {
                    color: var(--brand-primary);
                    font-weight: 600;
                    border-bottom-color: var(--brand-primary);
                }
                
                /* Dark Theme specific adjustments */
                :global([data-theme="dark"]) .tab-btn.active,
                :global(.dark) .tab-btn.active {
                    color: #fbbf24;
                    border-bottom-color: #f59e0b;
                }
            `}</style>
        </Dashboard>
    );
}
