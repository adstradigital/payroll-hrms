'use client';

import LeaveApprovals from '@/components/ClientAdmin/Payroll/Leave/Approvals/LeaveApprovals';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LeaveApprovalsPage() {
    return (
        <Dashboard
            title="Leave Approvals"
            subtitle="Manage and process pending employee leave requests"
            breadcrumbs={['Dashboard', 'Leave', 'Approvals']}
        >
            <ModuleGuard module="HRMS">
                <LeaveApprovals />
            </ModuleGuard>
        </Dashboard>
    );
}
