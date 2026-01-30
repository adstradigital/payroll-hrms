'use client';

import { usePermissions } from '@/context/PermissionContext';
import { ShieldAlert } from 'lucide-react';

export default function ModuleGuard({ children, module }) {
    const { hasHRMS, hasPayroll, loading } = usePermissions();

    if (loading) return null;

    let hasAccess = true;
    if (module === 'HRMS') hasAccess = hasHRMS;
    if (module === 'Payroll') hasAccess = hasPayroll;

    if (!hasAccess) {
        return (
            <div style={{
                padding: 'var(--spacing-2xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 'var(--spacing-md)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-color)',
                minHeight: '400px'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldAlert size={32} />
                </div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Access Denied
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                    Your current subscription does not include the <strong>{module}</strong> module.
                    Please upgrade your plan to access these features.
                </p>
                <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                    Upgrade Now
                </button>
            </div>
        );
    }

    return children;
}
