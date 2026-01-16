'use client';

import SalaryStructure from '@/components/ClientAdmin/Payroll/SalaryStructure/SalaryStructure';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function SalaryStructurePage() {
    return (
        <Dashboard
            title="Salary Structure"
            subtitle="Configure earnings and deductions for different grades"
            breadcrumbs={['Dashboard', 'Payroll', 'Salary Structure']}
        >
            <ModuleGuard module="Payroll">
                <SalaryStructure />
            </ModuleGuard>
        </Dashboard>
    );
}
