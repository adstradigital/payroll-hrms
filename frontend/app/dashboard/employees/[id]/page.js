'use client';

import { useParams, useRouter } from 'next/navigation';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import EmployeeProfile from '@/components/ClientAdmin/Account/Employees/Employee Profile/EmployeeProfile';

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    return (
        <Dashboard
            breadcrumbs={['Dashboard', 'Employees', 'Profile']}
        >
            <EmployeeProfile
                employeeId={id}
                onBack={() => router.push('/dashboard/employees')}
            />
        </Dashboard>
    );
}
