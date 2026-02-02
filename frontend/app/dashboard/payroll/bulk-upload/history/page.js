'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import UploadHistory from '@/components/ClientAdmin/BulkUpload/UploadHistory';

export default function UploadHistoryPage() {
    return (
        <Dashboard>
            <UploadHistory />
        </Dashboard>
    );
}
