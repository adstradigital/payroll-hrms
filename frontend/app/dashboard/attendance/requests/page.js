'use client';

import AttendanceRequests from '@/components/ClientAdmin/HRMS/Attendance/AttendanceRequests/AttendanceRequests';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AttendanceRequestsPage() {
    return (
        <Dashboard
            title="Attendance Requests"
            subtitle="Review and approve employee attendance adjustments"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendance Requests']}
        >
            <ModuleGuard module="HRMS">
                <AttendanceRequests />
            </ModuleGuard>
        </Dashboard>
    );
}
