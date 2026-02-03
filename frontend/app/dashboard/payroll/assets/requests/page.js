'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AssetRequests from '@/components/ClientAdmin/Payroll/Assets/Requests/AssetRequests';

export default function AssetRequestsPage() {
    return (
        <Dashboard
            title="Requests & Approvals"
            subtitle="Manage asset requests and workflow"
            breadcrumbs={['Dashboard', 'Payroll', 'Assets', 'Requests']}
        >
            <ModuleGuard module="Payroll">
                <AssetRequests />
            </ModuleGuard>
        </Dashboard>
    );
}
