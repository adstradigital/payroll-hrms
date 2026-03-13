'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import MyClaims from '@/components/ClientAdmin/HRMS/Reimbursements/MyClaims/MyClaims';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function MyClaimsPage() {
    return (
        <Dashboard
            title="My Expense Claims"
            subtitle="View and manage your submitted expense claims"
            breadcrumbs={['Dashboard', 'Reimbursements', 'My Expense Claims']}
        >
            <ModuleGuard module="HRMS">
                <MyClaims />
            </ModuleGuard>
        </Dashboard>
    );
}