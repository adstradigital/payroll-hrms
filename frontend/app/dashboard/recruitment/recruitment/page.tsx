'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import RecruitDashboard from '@/components/ClientAdmin/HRMS/Recruitment/RecruitDashboard/RecruitDashboard';

export default function RecruitmentApplicationsPage() {
    return (
        <Dashboard
            title="Recruitment Overview"
            subtitle="Manage and track all job applications"
            breadcrumbs={['Dashboard', 'Recruitment', 'Overview']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <RecruitDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
