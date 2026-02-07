'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import KeyResults from '@/components/ClientAdmin/HRMS/Performance/KeyResults/KeyResults';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function KeyResultsPage() {
    return (
        <Dashboard
            title="Key Results"
            subtitle="Track progress on goals and key results"
            breadcrumbs={['Dashboard', 'Performance', 'Key Results']}
        >
            <ModuleGuard module="HRMS">
                <KeyResults />
            </ModuleGuard>
        </Dashboard>
    );
}
