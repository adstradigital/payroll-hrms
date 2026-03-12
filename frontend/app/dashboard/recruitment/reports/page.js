'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import RecruitmentReports from '@/components/ClientAdmin/HRMS/Recruitment/Reports/Reports';

export default function RecruitmentReportsPage() {
    return (
        <Dashboard title="Recruitment Reports" subtitle="Analytics and insights" breadcrumbs={['Dashboard', 'Recruitment', 'Reports']}>
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <RecruitmentReports />
            </ModuleGuard>
        </Dashboard>
    );
}

