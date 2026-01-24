'use client';

import LeaveList from '@/components/ClientAdmin/Payroll/Leave/LeaveList/LeaveList';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LeaveRequestsPage() {
    return (
        <Dashboard
            title="Leave Requests"
            subtitle="Review and process employee leave applications"
            breadcrumbs={['Dashboard', 'Leave', 'Requests']}
        >
            <ModuleGuard module="HRMS">
                <LeaveList />
            </ModuleGuard>
        </Dashboard>
    );
}
