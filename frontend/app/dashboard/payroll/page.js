'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { Wallet, TrendingUp, Users } from 'lucide-react';

export default function PayrollDashboardPage() {
    const stats = [
        { label: 'Total Payroll (Current Mo)', value: '₹24,50,000', icon: Wallet, color: 'primary' },
        { label: 'Net Change', value: '+3.2%', icon: TrendingUp, color: 'success' },
        { label: 'Processed Employees', value: '142/156', icon: Users, color: 'info' }
    ];

    return (
        <Dashboard
            title="Payroll Dashboard"
            subtitle="Overview of your company salary processing"
            breadcrumbs={['Dashboard', 'Payroll']}
        >
            <ModuleGuard module="Payroll">
                <div className="stats-grid">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className={`stat-card stat-card--${stat.color}`}>
                                <div className="stat-card__icon">
                                    <Icon size={24} />
                                </div>
                                <div className="stat-card__info">
                                    <span className="stat-card__label">{stat.label}</span>
                                    <span className="stat-card__value">{stat.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h3>Recent Processing History</h3>
                    <p className="text-muted" style={{ marginTop: 'var(--spacing-sm)' }}>
                        Detailed logs and chart visualization will be integrated here.
                    </p>
                </div>
            </ModuleGuard>
        </Dashboard>
    );
}
