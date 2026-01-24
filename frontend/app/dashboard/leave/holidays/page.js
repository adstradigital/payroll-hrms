'use client';

import HolidayCalendar from '@/components/ClientAdmin/Payroll/Leave/HolidayCalendar/HolidayCalendar';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LeaveHolidaysPage() {
    return (
        <Dashboard
            title="Holiday Calendar"
            subtitle="View and manage company holidays"
            breadcrumbs={['Dashboard', 'Leave', 'Holidays']}
        >
            <ModuleGuard module="HRMS">
                <HolidayCalendar />
            </ModuleGuard>
        </Dashboard>
    );
}
