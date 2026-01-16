'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { Settings } from 'lucide-react';

export default function LeaveTypesPage() {
    return (
        <Dashboard
            title="Leave Type Configuration"
            subtitle="Manage Casual, Sick, Earned and other leave types"
            breadcrumbs={['Dashboard', 'Leave', 'Leave Types']}
        >
            <ModuleGuard module="HRMS">
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <Settings size={48} style={{ color: 'var(--color-info)', marginBottom: 'var(--spacing-md)' }} />
                    <h3>Leave Type Settings Coming Soon</h3>
                    <p className="text-muted">Configure leave policies, carry-forward rules, and limits.</p>
                </div>
            </ModuleGuard>
        </Dashboard>
    );
}
