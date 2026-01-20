'use client';

import LateEarlyAnalysis from '@/components/ClientAdmin/Account/Attendance/LateEarlyAnalysis/LateEarlyAnalysis';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function LateEarlyAnalysisPage() {
    return (
        <Dashboard
            title="Late Come Early Out"
            subtitle="Analysis of attendance deviations and punctuality"
            breadcrumbs={['Dashboard', 'Attendance', 'Late Early Analysis']}
        >
            <LateEarlyAnalysis />
        </Dashboard>
    );
}

