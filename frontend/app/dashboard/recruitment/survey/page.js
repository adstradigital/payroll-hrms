'use client';

import RecruitmentSurvey from '@/components/ClientAdmin/HRMS/Recruitment/RecruitmentSurvey/RecruitmentSurvey';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RecruitmentSurveyPage() {
    return (
        <Dashboard
            title="Recruitment Survey"
            subtitle="Manage recruitment surveys"
            breadcrumbs={['Dashboard', 'Recruitment', 'Survey']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <RecruitmentSurvey />
            </ModuleGuard>
        </Dashboard>
    );
}
