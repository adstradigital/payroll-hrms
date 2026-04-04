'use client';

import OvertimeRequests from '@/components/ClientAdmin/Account/Attendance/OvertimeRequests/OvertimeRequests';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function OvertimePage() {
    return (
        <Dashboard
            title="Overtime Management"
            subtitle="Review and approved extra-duty hours for employees"
            breadcrumbs={['Dashboard', 'Attendance', 'Overtime Management']}
        >
            <OvertimeRequests />
        </Dashboard>
    );
}
