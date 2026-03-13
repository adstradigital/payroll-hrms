'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ReimbursementDashboard from '@/components/ClientAdmin/HRMS/Reimbursements/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ReimbursementsPage() {
    return (
        <Dashboard
            title="Expense Dashboard"
            subtitle="Overview of employee expense claims and reimbursements"
            breadcrumbs={['Dashboard', 'Reimbursements', 'Expense Dashboard']}
        >
            <ModuleGuard module="HRMS">
                <ReimbursementDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}