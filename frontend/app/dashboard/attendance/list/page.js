'use client';

import AttendanceList from '@/components/ClientAdmin/HRMS/Attendance/AttendanceList/AttendanceList';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AttendanceListPage() {
    return (
        <Dashboard
            title="Attendance List"
            subtitle="View and manage employee daily presence"
            breadcrumbs={['Dashboard', 'Attendance', 'Attendances']}
        >
            <ModuleGuard module="HRMS">
                <AttendanceList />
            </ModuleGuard>
        </Dashboard>
    );
}
