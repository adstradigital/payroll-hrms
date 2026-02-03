'use client';

import EncashAndReimb from '@/components/ClientAdmin/Payroll/EncashmentsAndReimbursements/EncashAndReimb';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ReimbursementsPage() {
    return (
        <Dashboard
            title="Encashments & Reimbursements"
            subtitle="Manage financial requests and leave encashments"
            breadcrumbs={['Dashboard', 'Payroll', 'Encashments & Reimbursements']}
        >
            <ModuleGuard module="Payroll">
                <EncashAndReimb />
            </ModuleGuard>
        </Dashboard>
    );
}
