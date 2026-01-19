'use client';

import HourAccount from '@/components/ClientAdmin/HRMS/Attendance/HourAccount/HourAccount';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function HourAccountPage() {
    return (
        <Dashboard
            title="Hour Account"
            subtitle="Summary of working hours and overtime balances"
            breadcrumbs={['Dashboard', 'Attendance', 'Hour Account']}
        >
            <ModuleGuard module="HRMS">
                <HourAccount />
            </ModuleGuard>
        </Dashboard>
    );
}
