'use client';

import EmployeeSalary from '@/components/ClientAdmin/Payroll/EmployeeSalary/EmployeeSalary';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function EmployeeSalaryPage() {
    return (
        <Dashboard
            title="Employee Salary"
            subtitle="Assign salary structures and compensation to employees"
            breadcrumbs={['Dashboard', 'Payroll', 'Employee Salary']}
        >
            <ModuleGuard module="Payroll">
                <EmployeeSalary />
            </ModuleGuard>
        </Dashboard>
    );
}
