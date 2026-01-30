'use client';

import PayDashboard from '@/components/ClientAdmin/Payroll/PayDashboard/PayDashboard';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function PayrollDashboardPage() {
    return (
        <Dashboard
            title="Payroll Dashboard"
            subtitle="Overview of your company salary processing"
            breadcrumbs={['Dashboard', 'Payroll']}
        >
            <ModuleGuard module="Payroll">
                <PayDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}
