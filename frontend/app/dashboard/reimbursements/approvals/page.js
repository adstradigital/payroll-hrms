'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Approvals from '@/components/ClientAdmin/HRMS/Reimbursements/Approvals/Approvals';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpenseApprovalsPage() {
    return (
        <Dashboard
            title="Expense Approvals"
            subtitle="Review and approve employee expense claims"
            breadcrumbs={['Dashboard', 'Reimbursements', 'Approvals']}
        >
            <ModuleGuard module="HRMS">
                <Approvals />
            </ModuleGuard>
        </Dashboard>
    );
}