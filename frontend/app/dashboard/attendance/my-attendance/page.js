'use client';

import MyAttendance from '@/components/ClientAdmin/HRMS/Attendance/MyAttendance/MyAttendance';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function MyAttendancePage() {
    return (
        <Dashboard
            title="My Attendance"
            subtitle="Personal attendance history and punch logs"
            breadcrumbs={['Dashboard', 'Attendance', 'My Attendance']}
        >
            <ModuleGuard module="HRMS">
                <MyAttendance />
            </ModuleGuard>
        </Dashboard>
    );
}
