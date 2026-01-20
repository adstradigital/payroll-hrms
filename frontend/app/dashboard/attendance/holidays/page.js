'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { Calendar } from 'lucide-react';

export default function HolidaysPage() {
    return (
        <Dashboard
            title="Holiday Calendar"
            subtitle="Manage public and company holidays"
            breadcrumbs={['Dashboard', 'Attendance', 'Holidays']}
        >
            <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <Calendar size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }} />
                    <h3>Holiday Calendar Coming Soon</h3>
                    <p className="text-muted">Define the annual holiday list for your employees.</p>
                </div>
        </Dashboard>
    );
}

