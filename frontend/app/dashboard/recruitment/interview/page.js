'use client';

import Interview from '@/components/ClientAdmin/HRMS/Recruitment/Interview/Interview';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function InterviewPage() {
    return (
        <Dashboard
            title="Interview"
            subtitle="Manage interviews"
            breadcrumbs={['Dashboard', 'Recruitment', 'Interview']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <Interview />
            </ModuleGuard>
        </Dashboard>
    );
}
