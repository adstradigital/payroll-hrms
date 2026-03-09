'use client';

import Candidates from '@/components/ClientAdmin/HRMS/Recruitment/Candidates/Candidates';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function CandidatesPage() {
    return (
        <Dashboard
            title="Candidates"
            subtitle="Manage candidate applications"
            breadcrumbs={['Dashboard', 'Recruitment', 'Candidates']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <Candidates />
            </ModuleGuard>
        </Dashboard>
    );
}
