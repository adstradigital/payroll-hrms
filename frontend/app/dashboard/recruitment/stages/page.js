'use client';

import Stages from '@/components/ClientAdmin/HRMS/Recruitment/Stages/Stages';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function StagesPage() {
    return (
        <Dashboard
            title="Stages"
            subtitle="Manage recruitment stages"
            breadcrumbs={['Dashboard', 'Recruitment', 'Stages']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <Stages />
            </ModuleGuard>
        </Dashboard>
    );
}
