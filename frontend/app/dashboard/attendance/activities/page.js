'use client';

import AttendanceActivities from '@/components/ClientAdmin/Account/Attendance/AttendanceActivities/AttendanceActivities';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendanceActivitiesPage() {
    return (
        <Dashboard
            title="Attendance Activities"
            subtitle="Real-time log of attendance events and alerts"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendance Activities']}
        >
            <AttendanceActivities />
        </Dashboard>
    );
}

