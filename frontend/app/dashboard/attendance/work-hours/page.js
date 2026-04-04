'use client';

import WorkHours from '@/components/ClientAdmin/Account/Attendance/WorkHours/WorkHours';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function HourAccountPage() {
    return (
        <Dashboard
            breadcrumbs={['Dashboard', 'Attendance', 'Working Hours']}
        >
            <WorkHours />
        </Dashboard>
    );
}

