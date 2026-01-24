'use client';

import LeaveReports from '@/components/ClientAdmin/Payroll/Leave/Reports/LeaveReports';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LeaveReportsPage() {
    return (
        <Dashboard
            title="Leave Reports"
            subtitle="Analyze and export employee leave data"
            breadcrumbs={['Dashboard', 'Leave', 'Reports']}
        >
            <ModuleGuard module="HRMS">
                <LeaveReports />
            </ModuleGuard>
        </Dashboard>
    );
}
