'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Reports from '@/components/ClientAdmin/HRMS/Expenses/Reports/Reports';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpenseReportsPage() {
    return (
        <Dashboard
            title="Expense Reports"
            subtitle="Analyze expense spending"
            breadcrumbs={['Dashboard', 'Expense Management', 'Reports']}
        >
            <ModuleGuard module="HRMS">
                <Reports />
            </ModuleGuard>
        </Dashboard>
    );
}