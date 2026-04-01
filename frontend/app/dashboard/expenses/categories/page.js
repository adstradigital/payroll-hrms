'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Categories from '@/components/ClientAdmin/HRMS/Expenses/Categories/Categories';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function ExpenseCategoriesPage() {
    return (
        <Dashboard
            title="Expense Categories"
            subtitle="Manage expense categories"
            breadcrumbs={['Dashboard', 'Expense Management', 'Categories']}
        >
            <ModuleGuard module="HRMS">
                <Categories />
            </ModuleGuard>
        </Dashboard>
    );
}