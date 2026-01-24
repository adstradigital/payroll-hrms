'use client';

import WorkHours from '@/components/ClientAdmin/Account/Attendance/WorkHours/WorkHours';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function HourAccountPage() {
    return (
        <Dashboard
            title="Work Hours (Hour Bank) !!! NEW !!!"
            subtitle="Summary of working hours and overtime balances"
            breadcrumbs={['Dashboard', 'Attendance', 'VERIFY ROUTE']}
        >
            <WorkHours />
        </Dashboard>
    );
}

