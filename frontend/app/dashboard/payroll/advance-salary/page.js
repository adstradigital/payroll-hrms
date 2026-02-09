'use client';

import AdvanceSalary from '@/components/ClientAdmin/Payroll/AdvanceSalary/AdvanceSalary';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function AdvanceSalaryPage() {
    return (
        <ModuleGuard module="Payroll">
            <Dashboard
                title="Advance Salary"
                subtitle="Manage and track your short-term employee advances"
                breadcrumbs={['Dashboard', 'Payroll', 'Advance Salary']}
            >
                <AdvanceSalary />
            </Dashboard>
        </ModuleGuard>
    );
}
