'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import ManageAssets from '@/components/ClientAdmin/Payroll/Assets/Manage/ManageAssets';

export default function ManageAssetsPage() {
    return (
        <Dashboard
            title="Manage Assets"
            subtitle="View and manage all company assets"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets', 'Manage']}
        >
            <ModuleGuard module="Payroll">
                <ManageAssets />
            </ModuleGuard>
        </Dashboard>
    );
}
