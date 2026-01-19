'use client';

import AttendanceActivities from '@/components/ClientAdmin/HRMS/Attendance/AttendanceActivities/AttendanceActivities';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AttendanceActivitiesPage() {
    return (
        <Dashboard
            title="Attendance Activities"
            subtitle="Real-time log of attendance events and alerts"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendance Activities']}
        >
            <ModuleGuard module="HRMS">
                <AttendanceActivities />
            </ModuleGuard>
        </Dashboard>
    );
}
