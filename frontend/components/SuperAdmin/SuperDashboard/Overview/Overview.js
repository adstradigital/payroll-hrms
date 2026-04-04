import React, { useState, useEffect } from 'react';
import {
    Users,
    Building2,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    Activity,
    ChevronRight,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { getSuperAdminStats } from '@/api/api_superadmin';
import './Overview.css';

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await getSuperAdminStats();
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching super admin stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="overview-loading">
                <Loader2 size={48} className="animate-spin text-indigo-500" />
                <p>Syncing global metrics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overview-error">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h3>{error}</h3>
                <button onClick={fetchStats} className="banner-btn mt-4">Retry</button>
            </div>
        );
    }

    const { overview, payroll, subscriptions, system_health } = stats;

    return (
        <div className="overview-wrapper animate-slide-up">
            {/* Welcome Banner */}
            <section className="welcome-banner">
                <div className="banner-content">
                    <h1 className="banner-title">Welcome back, Super Admin</h1>
                    <p className="banner-subtitle">
                        System performance is {system_health?.status || 'nominal'}. 
                        There are {overview?.pending_verifications || 0} pending organization approvals waiting for your review.
                    </p>
                    <div className="flex gap-4">
                        <button className="banner-btn" onClick={() => window.location.href = '?tab=onboarding'}>Review Pending</button>
                        <button className="banner-btn-secondary" onClick={fetchStats}>
                            <RefreshCw size={14} className="mr-2" /> Refresh
                        </button>
                    </div>
                </div>
                <div className="banner-visual">
                    <TrendingUp size={120} className="visual-icon opacity-10" />
                </div>
            </section>

            {/* Stats Overview Bar */}
            <div className="stats-header-grid mb-8">
                <div className="stat-mini-card">
                    <div className="mini-icon org"><Building2 size={20} /></div>
                    <div className="mini-content">
                        <span className="mini-label">Organizations</span>
                        <span className="mini-value">{overview?.total_organizations || 0}</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="mini-icon user"><Users size={20} /></div>
                    <div className="mini-content">
                        <span className="mini-label">Active Employees</span>
                        <span className="mini-value">{overview?.active_employees || 0}</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="mini-icon payroll"><TrendingUp size={20} /></div>
                    <div className="mini-content">
                        <span className="mini-label">Global Payroll (MTD)</span>
                        <span className="mini-value">₹{(payroll?.current_month_total || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="mini-icon sub"><ShieldCheck size={20} /></div>
                    <div className="mini-content">
                        <span className="mini-label">Active Subscriptions</span>
                        <span className="mini-value">{subscriptions?.active || 0}</span>
                    </div>
                </div>
            </div>

            <div className="overview-main-grid">
                {/* System Analytics */}
                <div className="analytics-card">
                    <div className="card-header-flex">
                        <div>
                            <h3 className="card-heading text-zinc-200">System Analytics</h3>
                            <p className="card-subheading">Real-time server load & API requests</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className={`status-indicator ${system_health?.status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                             <span className="text-xs text-zinc-400 capitalize">{system_health?.status}</span>
                        </div>
                    </div>

                    <div className="chart-area-visual">
                        {[45, 60, 75, 50, 80, 95, 85, 70, 65, 90, 100, 85, 75, 60, 55, 70, 80, 90, 85, 95, 70, 60, 50, 65].map((h, i) => (
                            <div key={i} className="chart-bar-group">
                                <div className="bar-hover-info">{h}% Load</div>
                                <div className="chart-bar" style={{ height: `${h}%` }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="chart-labels">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                    </div>
                </div>

                {/* Quick Actions & Status */}
                <div className="side-cards-stack">
                    <div className="quick-actions-card">
                        <h3 className="card-heading">Quick Actions</h3>
                        <div className="actions-list">
                            {[
                                { label: 'Create Organization', link: '?tab=organizations&action=new' },
                                { label: 'Manage Subscriptions', link: '?tab=subscriptions' },
                                { label: 'System Health Logs', link: '?tab=system-logs' },
                                { label: 'Audit Trail', link: '?tab=audit-logs' }
                            ].map((action, i) => (
                                <button key={i} className="action-row group" onClick={() => window.location.href = action.link}>
                                    <span className="action-name">{action.label}</span>
                                    <ChevronRight size={14} className="action-chevron" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="system-status-card">
                        <h4 className="status-heading">System Status</h4>
                        <div className="status-rows">
                            <div className="status-row">
                                <span className="status-label">Database</span>
                                <span className="status-value text-emerald-400">Connected</span>
                            </div>
                            <div className="status-row">
                                <span className="status-label">API Gateway</span>
                                <span className="status-value text-emerald-400">{system_health?.uptime || '99.9%'} Uptime</span>
                            </div>
                            <div className="status-row">
                                <span className="status-label">Last Backup</span>
                                <span className="status-value text-amber-400 text-[10px]">{system_health?.last_backup ? new Date(system_health.last_backup).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;

