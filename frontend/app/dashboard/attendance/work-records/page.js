'use client';

import WorkRecords from '@/components/ClientAdmin/Account/Attendance/WorkRecords/WorkRecords';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function WorkRecordsPage() {
    return (
        <Dashboard
            title="Work Records"
            subtitle="Detailed logs of employee work shifts and punches"
            breadcrumbs={['Dashboard', 'Attendance', 'Work Records']}
        >
            <WorkRecords />
        </Dashboard>
    );
}

