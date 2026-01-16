'use client';

import RunPayroll from '@/components/ClientAdmin/Payroll/RunPayroll/RunPayroll';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RunPayrollPage() {
    return (
        <Dashboard
            title="Run Payroll"
            subtitle="Process monthly salaries and generate slips"
            breadcrumbs={['Dashboard', 'Payroll', 'Run Payroll']}
        >
            <ModuleGuard module="Payroll">
                <RunPayroll />
            </ModuleGuard>
        </Dashboard>
    );
}
