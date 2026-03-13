'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Categories from '@/components/ClientAdmin/HRMS/Reimbursements/Categories/Categories';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpenseCategoriesPage() {
    return (
        <Dashboard
            title="Expense Categories"
            subtitle="Manage reimbursement categories"
            breadcrumbs={['Dashboard', 'Reimbursements', 'Categories']}
        >
            <ModuleGuard module="HRMS">
                <Categories />
            </ModuleGuard>
        </Dashboard>
    );
}