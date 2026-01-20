'use client';

import MyAttendance from '@/components/ClientAdmin/Account/Attendance/MyAttendance/MyAttendance';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function MyAttendancePage() {
    return (
        <Dashboard
            title="My Attendance"
            subtitle="Personal attendance history and punch logs"
            breadcrumbs={['Dashboard', 'Attendance', 'My Attendance']}
        >
            <MyAttendance />
        </Dashboard>
    );
}

