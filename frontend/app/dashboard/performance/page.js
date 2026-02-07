'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import PerformanceDashboard from '@/components/ClientAdmin/HRMS/Performance/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function PerformancePage() {
    return (
        <Dashboard
            title="Performance Management"
            subtitle="Track and manage employee performance reviews and goals"
            breadcrumbs={['Dashboard', 'Performance']}
        >
            <ModuleGuard module="HRMS">
                <PerformanceDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
