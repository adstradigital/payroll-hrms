'use client';

import Employee from '@/components/ClientAdmin/Account/Employees/Employee';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function EmployeesPage() {
    return (
        <Dashboard
            title="Employee Directory"
            subtitle="View and manage company personnel"
            breadcrumbs={['Dashboard', 'Employees']}
        >
            <Employee />
        </Dashboard>
    );
}
