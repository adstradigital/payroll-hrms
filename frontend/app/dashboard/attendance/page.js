'use client';

import AttendanceDashboard from '@/components/ClientAdmin/Account/Attendance/AttendanceDashboard';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendancePage() {
    return (
        <Dashboard
            title="Attendance Performance"
            subtitle="Central overview of organizational presence and trends"
            breadcrumbs={['Dashboard', 'Attendance']}
        >
            <AttendanceDashboard />
        </Dashboard>
    );
}

