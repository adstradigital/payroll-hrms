'use client';

import AttendanceRequests from '@/components/ClientAdmin/Account/Attendance/AttendanceRequests/AttendanceRequests';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendanceRequestsPage() {
    return (
        <Dashboard
            title="Attendance Requests"
            subtitle="Review and approve employee attendance adjustments"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendance Requests']}
        >
            <AttendanceRequests />
        </Dashboard>
    );
}

