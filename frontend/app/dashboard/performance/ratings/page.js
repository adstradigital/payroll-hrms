'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Ratings from '@/components/ClientAdmin/HRMS/Performance/Ratings/Ratings';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { usePermissions } from '@/context/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RatingsPage() {
    const { isAdmin } = usePermissions();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard/performance');
        }
    }, [isAdmin, router]);

    if (!isAdmin) return null;

    return (
        <Dashboard
            title="Rating Scales & Categories"
            subtitle="Configure rating scales and performance categories"
            breadcrumbs={['Dashboard', 'Performance', 'Ratings']}
        >
            <ModuleGuard module="HRMS">
                <Ratings />
            </ModuleGuard>
        </Dashboard>
    );
}
