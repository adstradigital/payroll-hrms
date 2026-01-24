'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import LeaveBalance from '@/components/ClientAdmin/Payroll/Leave/LeaveBalance/LeaveBalance';

export default function LeaveBalancePage() {
    return (
        <Dashboard
            title="Leave Balances"
            subtitle="View and manage employee leave quotas"
            breadcrumbs={['Dashboard', 'Leave', 'Leave Balance']}
        >
            <ModuleGuard module="HRMS">
                <LeaveBalance />
            </ModuleGuard>
        </Dashboard>
    );
}
