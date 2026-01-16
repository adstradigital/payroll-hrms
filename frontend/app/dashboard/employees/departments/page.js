'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { Layers } from 'lucide-react';

export default function DepartmentsPage() {
    return (
        <Dashboard
            title="Departments"
            subtitle="Organize your workforce by department"
            breadcrumbs={['Dashboard', 'Employees', 'Departments']}
        >
            <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                <Layers size={48} style={{ color: 'var(--brand-primary)', marginBottom: 'var(--spacing-md)' }} />
                <h3>Department Management Coming Soon</h3>
                <p className="text-muted">You will be able to create and manage IT, HR, Marketing, and other departments.</p>
            </div>
        </Dashboard>
    );
}
