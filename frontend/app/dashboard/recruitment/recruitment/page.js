'use client';

import RecruitmentGeneral from '@/components/ClientAdmin/HRMS/Recruitment/RecruitmentGeneral/RecruitmentGeneral';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RecruitmentGeneralPage() {
    return (
        <Dashboard
            title="Recruitment"
            subtitle="Manage recruitment processes"
            breadcrumbs={['Dashboard', 'Recruitment', 'General']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <RecruitmentGeneral />
            </ModuleGuard>
        </Dashboard>
    );
}
