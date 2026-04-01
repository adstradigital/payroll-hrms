'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ExpenseDashboard from '@/components/ClientAdmin/HRMS/Expenses/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpensesPage() {
    return (
        <Dashboard
            title="Expense Dashboard"
            subtitle="Overview of employee expense claims"
            breadcrumbs={['Dashboard', 'Expense Management', 'Expense Dashboard']}
        >
            <ModuleGuard module="HRMS">
                <ExpenseDashboard />
            </ModuleGuard>
        </Dashboard>
    );
}