'use client';

import TaxManagement from '@/components/ClientAdmin/Payroll/Tax/Tax';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { usePermissions } from '@/context/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TaxPage() {
    const { hasTaxManagement, loading } = usePermissions();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasTaxManagement) {
            router.push('/dashboard/payroll');
        }
    }, [hasTaxManagement, loading, router]);

    if (loading) {
        return (
            <Dashboard
                title="Tax Management"
                subtitle="Configure income tax slabs and statutory settings"
                breadcrumbs={['Dashboard', 'Payroll', 'Tax Management']}
            >
                <div className="p-8 text-center">Loading...</div>
            </Dashboard>
        );
    }

    if (!hasTaxManagement) {
        return null; // Will redirect
    }

    return (
        <Dashboard
            title="Tax Management"
            subtitle="Configure income tax slabs and statutory settings"
            breadcrumbs={['Dashboard', 'Payroll', 'Tax Management']}
        >
            <ModuleGuard module="Payroll">
                <TaxManagement />
            </ModuleGuard>
        </Dashboard>
    );
}
