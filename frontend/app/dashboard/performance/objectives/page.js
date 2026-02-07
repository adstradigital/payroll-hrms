'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Objectives from '@/components/ClientAdmin/HRMS/Performance/Objectives/Objectives';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ObjectivesPage() {
    return (
        <Dashboard
            title="Objectives"
            subtitle="Set and manage employee goals and objectives"
            breadcrumbs={['Dashboard', 'Performance', 'Objectives']}
        >
            <ModuleGuard module="HRMS">
                <Objectives />
            </ModuleGuard>
        </Dashboard>
    );
}
