'use client';

import LateEarlyAnalysis from '@/components/ClientAdmin/HRMS/Attendance/LateEarlyAnalysis/LateEarlyAnalysis';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LateEarlyAnalysisPage() {
    return (
        <Dashboard
            title="Late Come Early Out"
            subtitle="Analysis of attendance deviations and punctuality"
            breadcrumbs={['Dashboard', 'Attendance', 'Late Early Analysis']}
        >
            <ModuleGuard module="HRMS">
                <LateEarlyAnalysis />
            </ModuleGuard>
        </Dashboard>
    );
}
