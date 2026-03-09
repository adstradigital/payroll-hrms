'use client';

import Pipeline from '@/components/ClientAdmin/HRMS/Recruitment/Pipeline/Pipeline';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function PipelinePage() {
    return (
        <Dashboard
            title="Hiring Pipeline"
            subtitle="Visualize candidate progress"
            breadcrumbs={['Dashboard', 'Recruitment', 'Pipeline']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <Pipeline />
            </ModuleGuard>
        </Dashboard>
    );
}
