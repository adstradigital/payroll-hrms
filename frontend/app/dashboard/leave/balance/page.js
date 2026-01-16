'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { FileText } from 'lucide-react';

export default function LeaveBalancePage() {
    return (
        <Dashboard
            title="Leave Balances"
            subtitle="View employee-wise leave availability"
            breadcrumbs={['Dashboard', 'Leave', 'Leave Balance']}
        >
            <ModuleGuard module="HRMS">
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <FileText size={48} style={{ color: 'var(--color-warning)', marginBottom: 'var(--spacing-md)' }} />
                    <h3>Leave Balance View Coming Soon</h3>
                    <p className="text-muted">Summary of all available leave quotas for each employee.</p>
                </div>
            </ModuleGuard>
        </Dashboard>
    );
}
