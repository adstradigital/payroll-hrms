'use client';

import AttendanceRegister from '@/components/ClientAdmin/Account/Attendance/AttendanceRegister/AttendanceRegister';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function AttendanceListPage() {
    return (
        <Dashboard
            title="Attendance Register"
            subtitle="View and manage employee daily presence"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendances']}
        >
            <AttendanceRegister />
        </Dashboard>
    );
}

