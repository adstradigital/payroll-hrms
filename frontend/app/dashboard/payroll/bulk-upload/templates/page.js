'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import TemplateLibrary from '@/components/ClientAdmin/BulkUpload/TemplateLibrary';

export default function TemplatesPage() {
    return (
        <Dashboard>
            <TemplateLibrary />
        </Dashboard>
    );
}
