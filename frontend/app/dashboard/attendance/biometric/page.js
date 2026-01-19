'use client';

import BiometricDevices from '@/components/ClientAdmin/HRMS/Attendance/BiometricDevices/BiometricDevices';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function BiometricPage() {
    return (
        <Dashboard
            title="Biometric Devices"
            subtitle="Manage and monitor hardware terminals"
            breadcrumbs={['Dashboard', 'Attendance', 'Biometric Devices']}
        >
            <ModuleGuard module="HRMS">
                <BiometricDevices />
            </ModuleGuard>
        </Dashboard>
    );
}
