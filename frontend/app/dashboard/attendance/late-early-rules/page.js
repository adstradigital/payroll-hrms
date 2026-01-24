'use client';

import LateEarlyRules from '@/components/ClientAdmin/Account/Attendance/LateEarlyRules/LateEarlyRules';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function LateEarlyAnalysisPage() {
    return (
        <Dashboard
            title="Late & Early Rules"
            subtitle="Analysis of attendance deviations and punctuality"
            breadcrumbs={['Dashboard', 'Attendance', 'Late Early Analysis']}
        >
            <LateEarlyRules />
        </Dashboard>
    );
}

