'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Period from '@/components/ClientAdmin/HRMS/Performance/Period/Period';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function PeriodsPage() {
    return (
        <Dashboard
            title="Review Periods"
            subtitle="Manage performance review cycles and timelines"
            breadcrumbs={['Dashboard', 'Performance', 'Review Periods']}
        >
            <ModuleGuard module="HRMS">
                <Period />
            </ModuleGuard>
        </Dashboard>
    );
}
