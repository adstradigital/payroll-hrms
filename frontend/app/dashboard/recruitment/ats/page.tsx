'use client';

import React from 'react';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import AtsBoard from '@/components/recruitment/ats/AtsBoard';

const AtsPage = () => {
    return (
        <Dashboard
            title="Automatic Tracking System"
            subtitle="Manage your candidate pipeline and resume tracking"
            breadcrumbs={['Dashboard', 'Recruitment', 'ATS']}
        >
            <ModuleGuard module="HRMS">
                <div style={{ marginTop: '1.5rem' }}>
                    <AtsBoard />
                </div>
            </ModuleGuard>
        </Dashboard>
    );
};

export default AtsPage;
