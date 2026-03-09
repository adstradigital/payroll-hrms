'use client';

import JobOpenings from '@/components/ClientAdmin/HRMS/Recruitment/JobOpenings/JobOpenings';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function JobOpeningsPage() {
    return (
        <Dashboard
            title="Job Openings"
            subtitle="Manage your job postings"
            breadcrumbs={['Dashboard', 'Recruitment', 'Job Openings']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view_job_openings">
                <JobOpenings />
            </ModuleGuard>
        </Dashboard>
    );
}
