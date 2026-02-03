'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AssetsDashboard from '@/components/ClientAdmin/Payroll/Assets/Dashboard/AssetsDashboard';

export default function AssetsDashboardPage() {
    return (
        <Dashboard
            title="Assets Dashboard"
            subtitle="Overview of company assets and assignments"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets']}
        >
            <ModuleGuard module="Payroll">
                <AssetsDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
