'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Reports from '@/components/ClientAdmin/HRMS/Reimbursements/Reports/Reports';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpenseReportsPage() {
    return (
        <Dashboard
            title="Expense Reports"
            subtitle="Analyze reimbursement spending"
            breadcrumbs={['Dashboard', 'Reimbursements', 'Reports']}
        >
            <ModuleGuard module="HRMS">
                <Reports />
            </ModuleGuard>
        </Dashboard>
    );
}