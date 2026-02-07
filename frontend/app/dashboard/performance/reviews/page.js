'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Reviews from '@/components/ClientAdmin/HRMS/Performance/Reviews/Reviews';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ReviewsPage() {
    return (
        <Dashboard
            title="Performance Reviews"
            subtitle="View and manage employee performance evaluations"
            breadcrumbs={['Dashboard', 'Performance', 'Reviews']}
        >
            <ModuleGuard module="HRMS">
                <Reviews />
            </ModuleGuard>
        </Dashboard>
    );
}
