'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { UserCheck } from 'lucide-react';

export default function DesignationsPage() {
    return (
        <Dashboard
            title="Designations"
            subtitle="Manage job titles and internal hierarchy"
            breadcrumbs={['Dashboard', 'Employees', 'Designations']}
        >
            <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                <UserCheck size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }} />
                <h3>Designation Settings Coming Soon</h3>
                <p className="text-muted">Define roles like Manager, Developer, Executive, etc.</p>
            </div>
        </Dashboard>
    );
}
