'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import MyDocuments from '@/components/ClientAdmin/EmployeeSelfService/Documents/MyDocuments';

export default function DocumentsPage() {
    return (
        <Dashboard breadcrumbs={['Home', 'Dashboard', 'Documents']}>
            <MyDocuments />
        </Dashboard>
    );
}
