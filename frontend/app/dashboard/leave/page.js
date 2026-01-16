'use client';

import LeaveList from '@/components/ClientAdmin/HRMS/Leave/LeaveList/LeaveList';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LeavePage() {
    return (
        <Dashboard
            title="Leave Management"
            subtitle="Review and process employee leave applications"
            breadcrumbs={['Dashboard', 'Leave']}
        >
            <ModuleGuard module="HRMS">
                <LeaveList />
            </ModuleGuard>
        </Dashboard>
    );
}
