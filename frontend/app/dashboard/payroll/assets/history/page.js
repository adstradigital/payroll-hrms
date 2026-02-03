'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AssetHistory from '@/components/ClientAdmin/Payroll/Assets/History/AssetHistory';

export default function AssetHistoryPage() {
    return (
        <Dashboard
            title="Asset History"
            subtitle="Complete audit trail of asset activities"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets', 'History']}
        >
            <ModuleGuard module="Payroll">
                <AssetHistory />
            </ModuleGuard>
        </Dashboard>
    );
}
