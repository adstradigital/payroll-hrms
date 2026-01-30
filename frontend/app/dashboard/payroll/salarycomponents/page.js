'use client';

import SalaryComponents from '@/components/ClientAdmin/Payroll/SalaryComponents/SalaryComponents';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function SalaryComponentsPage() {
    return (
        <Dashboard
            title="Salary Components"
            subtitle="Manage earnings, deductions, and statutory components"
            breadcrumbs={['Dashboard', 'Payroll', 'Components']}
        >
            <ModuleGuard module="Payroll">
                <SalaryComponents />
            </ModuleGuard>
        </Dashboard>
    );
}
