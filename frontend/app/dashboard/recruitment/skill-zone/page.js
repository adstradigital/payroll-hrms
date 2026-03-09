'use client';

import SkillZone from '@/components/ClientAdmin/HRMS/Recruitment/SkillZone/SkillZone';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function SkillZonePage() {
    return (
        <Dashboard
            title="Skill Zone"
            subtitle="Manage skills and assessments"
            breadcrumbs={['Dashboard', 'Recruitment', 'Skill Zone']}
        >
            <ModuleGuard module="HRMS" permission="recruitment.view">
                <SkillZone />
            </ModuleGuard>
        </Dashboard>
    );
}
