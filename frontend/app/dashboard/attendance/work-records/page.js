'use client';

import WorkRecords from '@/components/ClientAdmin/HRMS/Attendance/WorkRecords/WorkRecords';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function WorkRecordsPage() {
    return (
        <Dashboard
            title="Work Records"
            subtitle="Detailed logs of employee work shifts and punches"
            breadcrumbs={['Dashboard', 'Attendance', 'Work Records']}
        >
            <ModuleGuard module="HRMS">
                <WorkRecords />
            </ModuleGuard>
        </Dashboard>
    );
}
