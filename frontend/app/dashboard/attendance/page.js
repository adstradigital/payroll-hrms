'use client';

import AttendanceDashboard from '@/components/ClientAdmin/HRMS/Attendance/AttendanceDashboard';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AttendancePage() {
    return (
        <Dashboard
            title="Attendance Performance"
            subtitle="Central overview of organizational presence and trends"
            breadcrumbs={['Dashboard', 'Attendance']}
        >
            <ModuleGuard module="HRMS">
                <AttendanceDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
