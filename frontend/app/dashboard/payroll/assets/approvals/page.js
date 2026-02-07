'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AssetApprovals from '@/components/ClientAdmin/Payroll/Assets/Approvals/AssetApprovals';

export default function AssetApprovalsPage() {
    return (
        <Dashboard
            title="Asset Approvals"
            subtitle="Review and process employee asset requests"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets', 'Approvals']}
        >
            <ModuleGuard module="Payroll">
                <AssetApprovals />
            </ModuleGuard>
        </Dashboard>
    );
}
