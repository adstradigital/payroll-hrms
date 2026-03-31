'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import SubmitExpense from '@/components/ClientAdmin/HRMS/Expenses/SubmitExpense/SubmitExpense';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function SubmitExpensePage() {
    return (
        <Dashboard
            title="Submit Expense Claim"
            subtitle="Submit a new expense claim"
            breadcrumbs={['Dashboard', 'Expense Management', 'Submit Expense']}
        >
            <ModuleGuard module="HRMS">
                <SubmitExpense />
            </ModuleGuard>
        </Dashboard>
    );
}