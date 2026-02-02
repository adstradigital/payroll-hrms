'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ActivityLog from '@/components/ClientAdmin/ActivityLog/Activitylog';

export default function LogsPage() {
    return (
        <Dashboard breadcrumbs={['Home', 'System Logs']}>
            <ActivityLog />
        </Dashboard>
    );
}
