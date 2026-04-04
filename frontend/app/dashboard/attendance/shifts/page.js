'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ShiftManagement from '@/components/ClientAdmin/Account/Attendance/ShiftManagement/ShiftManagement';

export default function ShiftsPage() {
    return (
        <Dashboard
            title="Shift Management"
            subtitle="Define and manage company work shifts"
            breadcrumbs={['Dashboard', 'Attendance', 'Shifts']}
        >
            <ShiftManagement />
        </Dashboard>
    );
}

