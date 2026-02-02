'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import BulkUploadDashboard from '@/components/ClientAdmin/BulkUpload/BulkUploadDashboard';

export default function BulkUploadDashboardPage() {
    return (
        <Dashboard>
            <BulkUploadDashboard />
        </Dashboard>
    );
}
