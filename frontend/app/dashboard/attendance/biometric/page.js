'use client';

import BiometricDevices from '@/components/ClientAdmin/Account/Attendance/BiometricDevices/BiometricDevices';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function BiometricPage() {
    return (
        <Dashboard
            title="Biometric Devices"
            subtitle="Manage and monitor hardware terminals"
            breadcrumbs={['Dashboard', 'Attendance', 'Biometric Devices']}
        >
            <BiometricDevices />
        </Dashboard>
    );
}

