'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Reports from '@/components/ClientAdmin/Reports/Reports';

export default function ReportsPage() {
    return (
        <Dashboard breadcrumbs={['Home', 'Reports']} showGreeting={false}>
            <Reports />
        </Dashboard>
    );
}
