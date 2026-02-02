'use client';

import { useParams } from 'next/navigation';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import UploadDetail from '@/components/ClientAdmin/BulkUpload/UploadDetail';

export default function UploadDetailPage() {
    const params = useParams();

    return (
        <Dashboard>
            <UploadDetail id={params.id} />
        </Dashboard>
    );
}
