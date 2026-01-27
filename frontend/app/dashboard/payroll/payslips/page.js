'use client';

import PaySlips from '@/components/ClientAdmin/Payroll/PaySlips/PaySlips';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function PaySlipsPage() {
    return (
        <Dashboard
            title="PaySlips"
            subtitle="View and download employee monthly payslips"
            breadcrumbs={['Dashboard', 'Payroll', 'Payslips']}
        >
            <ModuleGuard module="Payroll">
                <PaySlips />
            </ModuleGuard>
        </Dashboard>
    );
}
