'use client';

import RecruitDashboard from '@/components/ClientAdmin/HRMS/Recruitment/RecruitDashboard/RecruitDashboard';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RecruitmentPage() {
    return (
        <Dashboard
            title="Recruitment Dashboard"
            subtitle="Overview of recruitment activities"
            breadcrumbs={['Dashboard', 'Recruitment']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <RecruitDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
