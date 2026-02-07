'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Templates from '@/components/ClientAdmin/HRMS/Performance/Templates/Templates';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { usePermissions } from '@/context/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TemplatesPage() {
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
            title="Performance Templates"
            subtitle="Manage criteria templates for performance reviews"
            breadcrumbs={['Dashboard', 'Performance', 'Templates']}
        >
            <ModuleGuard module="HRMS">
                <Templates />
            </ModuleGuard>
        </Dashboard>
    );
}
