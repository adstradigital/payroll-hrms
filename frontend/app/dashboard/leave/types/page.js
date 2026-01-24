'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import LeaveTypes from '@/components/ClientAdmin/Payroll/Leave/LeaveTypes/LeaveTypes';

export default function LeaveTypesPage() {
    return (
        <Dashboard
            title="Leave Type Configuration"
            subtitle="Manage Casual, Sick, Earned and other leave types"
            breadcrumbs={['Dashboard', 'Leave', 'Leave Types']}
        >
            <ModuleGuard module="HRMS">
                <LeaveTypes />
            </ModuleGuard>
        </Dashboard>
    );
}
