import React from 'react';
import {
    Users,
    Building2,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    Activity,
    ChevronRight
} from 'lucide-react';
import './Overview.css';

const Overview = () => {
    return (
        <div className="overview-wrapper animate-slide-up">
            {/* Welcome Banner */}
            <section className="welcome-banner">
                <div className="banner-content">
                    <h1 className="banner-title">Welcome back, Super Admin</h1>
                    <p className="banner-subtitle">System performance is nominal. There are 3 pending organization approvals waiting for your review.</p>
                    <button className="banner-btn">Review Pending</button>
                </div>
                <div className="banner-visual"></div>
            </section>

            <div className="overview-main-grid">
                {/* System Analytics */}
                <div className="analytics-card">
                    <div className="card-header-flex">
                        <div>
                            <h3 className="card-heading text-zinc-200">System Analytics</h3>
                            <p className="card-subheading">Real-time server load & API requests</p>
                        </div>
                        <select className="select-premium">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
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
                            {['Create Organization', 'Reset User Password', 'Deploy System Update', 'View Audit Logs'].map((action, i) => (
                                <button key={i} className="action-row group">
                                    <span className="action-name">{action}</span>
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
                                <span className="status-value text-emerald-400">Healthy</span>
                            </div>
                            <div className="status-row">
                                <span className="status-label">API Gateway</span>
                                <span className="status-value text-emerald-400">99.9% Uptime</span>
                            </div>
                            <div className="status-row">
                                <span className="status-label">Storage</span>
                                <span className="status-value text-amber-400">85% Used</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
