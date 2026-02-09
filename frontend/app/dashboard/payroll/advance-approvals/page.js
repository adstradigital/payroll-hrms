'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AdvanceSalaryApprovals from '@/components/ClientAdmin/Payroll/AdvanceSalary/AdvanceSalaryApprovals';

export default function AdvanceApprovalsPage() {
    return (
        <ModuleGuard module="Payroll">
            <Dashboard
                title="Salary Advance Approvals"
                subtitle="Review and approve short-term financial advances"
                breadcrumbs={['Dashboard', 'Payroll', 'Advance Approvals']}
            >
                <AdvanceSalaryApprovals />
            </Dashboard>
        </ModuleGuard>
    );
}
