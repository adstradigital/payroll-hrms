'use client';

import HourAccount from '@/components/ClientAdmin/Account/Attendance/HourAccount/HourAccount';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function HourAccountPage() {
    return (
        <Dashboard
            title="Hour Account"
            subtitle="Summary of working hours and overtime balances"
            breadcrumbs={['Dashboard', 'Attendance', 'Hour Account']}
        >
            <HourAccount />
        </Dashboard>
    );
}

