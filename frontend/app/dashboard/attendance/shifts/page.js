'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { Clock } from 'lucide-react';

export default function ShiftsPage() {
    return (
        <Dashboard
            title="Shift Management"
            subtitle="Define and manage company work shifts"
            breadcrumbs={['Dashboard', 'Attendance', 'Shifts']}
        >
            <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <Clock size={48} style={{ color: 'var(--brand-primary)', marginBottom: 'var(--spacing-md)' }} />
                    <h3>Shift Configuration Coming Soon</h3>
                    <p className="text-muted">You will be able to create General, Night, and rotational shifts here.</p>
                </div>
        </Dashboard>
    );
}

