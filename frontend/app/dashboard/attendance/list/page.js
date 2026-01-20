'use client';

import AttendanceList from '@/components/ClientAdmin/Account/Attendance/AttendanceList/AttendanceList';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendanceListPage() {
    return (
        <Dashboard
            title="Attendance List"
            subtitle="View and manage employee daily presence"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendances']}
        >
            <AttendanceList />
        </Dashboard>
    );
}

