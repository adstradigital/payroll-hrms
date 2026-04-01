'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import EmployeeProfile from '@/components/ClientAdmin/Account/Employees/EmployeeProfile/EmployeeProfile';

export default function MyProfilePage() {
    return (
        <Dashboard
            breadcrumbs={['Dashboard', 'My Profile']}
        >
            <EmployeeProfile
            // No employeeId means "fetch my own profile"
            />
        </Dashboard>
    );
}
