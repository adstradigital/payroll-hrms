'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import BonusPoints from '@/components/ClientAdmin/HRMS/Performance/BonusPoints/BonusPoints';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { usePermissions } from '@/context/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BonusPointsPage() {
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
            title="Bonus Point Mappings"
            subtitle="Configure performance-based bonus calculations"
            breadcrumbs={['Dashboard', 'Performance', 'Bonus Points']}
        >
            <ModuleGuard module="HRMS">
                <BonusPoints />
            </ModuleGuard>
        </Dashboard>
    );
}
