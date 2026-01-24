'use client';

import AttendanceLogs from '@/components/ClientAdmin/Account/Attendance/AttendanceLogs/AttendanceLogs';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendanceActivitiesPage() {
    return (
        <Dashboard
            title="Attendance Logs"
            subtitle="Real-time log of attendance events and alerts"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendance Activities']}
        >
            <AttendanceLogs />
        </Dashboard>
    );
}

