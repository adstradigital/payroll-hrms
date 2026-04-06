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
    RefreshCw,
    Globe,
    Zap,
    LayoutDashboard,
    Clock
} from 'lucide-react';
import { getSuperAdminStats } from '@/api/api_superadmin';
import { useAuth } from '@/context/AuthContext';
import './Overview.css';

const Overview = () => {
    const { user } = useAuth();
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
            setError('System update required');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="overview-loading-nexus">
                <Loader2 size={48} className="animate-spin text-indigo-500" />
                <p className="nexus-pulse-text">Loading Global Registry...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overview-error-nexus">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h3>{error}</h3>
                <button onClick={fetchStats} className="nexus-retry-btn">Force Sync</button>
            </div>
        );
    }

    const { overview, system_health } = stats;

    return (
        <div className="overview-wrapper-nexus animate-slide-up">
            <header className="nexus-welcome">
                <div className="nexus-title-box">
                    <span className="system-label">SUPER ADMINISTRATOR HUB</span>
                    <h1>Welcome back, <span className="text-neon">{user?.full_name?.split(' ')[0] || 'Admin'}</span></h1>
                    <p>Global infrastructure status: <span className="text-emerald-400 font-semibold">{system_health?.status || 'Active'}</span></p>
                </div>
            </header>

            <div className="nexus-cards-grid">
                <div className="nexus-card">
                    <div className="card-top">
                        <div className="icon-box-cyan">
                            <Building2 size={24} />
                        </div>
                        <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div className="card-info">
                        <span className="card-label">Total Organizations</span>
                        <h3 className="card-value">{overview?.total_organizations || 0}</h3>
                    </div>
                </div>

                <div className="nexus-card">
                    <div className="card-top">
                        <div className="icon-box-indigo">
                            <Users size={24} />
                        </div>
                        <span className="card-percent">+8%</span>
                    </div>
                    <div className="card-info">
                        <span className="card-label">Active Users</span>
                        <h3 className="card-value">{overview?.total_employees || 0}</h3>
                    </div>
                </div>

                <div className="nexus-card">
                    <div className="card-top">
                        <div className="icon-box-emerald">
                            <Zap size={24} />
                        </div>
                    </div>
                    <div className="card-info">
                        <span className="card-label">Global Revenue</span>
                        <h3 className="card-value">${(overview?.monthly_revenue || 0).toLocaleString()}</h3>
                    </div>
                </div>

                <div className="nexus-card">
                    <div className="card-top">
                        <div className="icon-box-amber">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <div className="card-info">
                        <span className="card-label">Pending Approvals</span>
                        <h3 className="card-value">{overview?.pending_verifications || 0} Requests</h3>
                    </div>
                </div>
            </div>

            <div className="nexus-secondary-grid">
                <div className="nexus-activity-card">
                    <div className="card-header-flex">
                        <Activity size={18} />
                        <h3>System Status</h3>
                        <div className="status-badge-live">LIVE</div>
                    </div>
                    <div className="health-stats-list">
                        <div className="health-item">
                            <span>Core Engine</span>
                            <span className="status-text-online">Optimal</span>
                        </div>
                        <div className="health-item">
                            <span>Database Cluster</span>
                            <span className="status-text-online">Connected</span>
                        </div>
                        <div className="health-item">
                            <span>Security Layer</span>
                            <span className="status-text-online">Encrypted</span>
                        </div>
                    </div>
                </div>

                <div className="nexus-quick-link-card">
                    <div className="card-header-flex">
                        <Clock size={18} />
                        <h3>Recent Actions</h3>
                    </div>
                    <div className="action-list-simple">
                        <p className="no-actions">No recent high-priority actions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
