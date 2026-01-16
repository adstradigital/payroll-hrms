'use client';

import AttendanceList from '@/components/ClientAdmin/HRMS/Attendance/AttendanceList/AttendanceList';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AttendancePage() {
    return (
        <Dashboard
            title="Attendance Management"
            subtitle="Track and manage employee daily attendance"
            breadcrumbs={['Dashboard', 'Attendance']}
        >
            <ModuleGuard module="HRMS">
                <AttendanceList />
            </ModuleGuard>
        </Dashboard>
    );
}
