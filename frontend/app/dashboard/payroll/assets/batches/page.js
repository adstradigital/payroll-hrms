'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AssetBatches from '@/components/ClientAdmin/Payroll/Assets/Batches/AssetBatches';

export default function AssetBatchesPage() {
    return (
        <Dashboard
            title="Asset Batches"
            subtitle="Manage bulk asset operations"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets', 'Batches']}
        >
            <ModuleGuard module="Payroll">
                <AssetBatches />
            </ModuleGuard>
        </Dashboard>
    );
}
