'use client';

import TaxManagement from '@/components/ClientAdmin/Payroll/Tax/Tax';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function TaxPage() {
    return (
        <Dashboard
            title="Tax Management"
            subtitle="Configure income tax slabs and statutory settings"
            breadcrumbs={['Dashboard', 'Payroll', 'Tax Management']}
        >
            <ModuleGuard module="Payroll">
                <TaxManagement />
            </ModuleGuard>
        </Dashboard>
    );
}
