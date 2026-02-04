'use client';

import { useState, useEffect } from 'react';
import {
    Box, CheckCircle, Clock, AlertCircle,
    TrendingUp, UserCheck, Plus, Search,
    Filter, MoreVertical, ArrowRight
} from 'lucide-react';
import { getAssetDashboardStats } from '@/api/api_clientadmin';
import { useRouter } from 'next/navigation';
import './AssetsDashboard.css';

export default function AssetsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        summary: { total: 0, active: 0, available: 0, allocated: 0, pending_requests: 0 },
        health: { functional_pct: 0, maintenance_pct: 0, damaged_pct: 0 },
        recent_activity: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await getAssetDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { label: 'Total Assets', value: stats.summary.total, icon: Box, color: 'blue' },
        { label: 'Active Assets', value: stats.summary.active, icon: CheckCircle, color: 'green' },
        { label: 'Allocated', value: stats.summary.allocated, icon: UserCheck, color: 'indigo' },
        { label: 'Pending Requests', value: stats.summary.pending_requests, icon: Clock, color: 'orange' }
    ];

    if (loading) {
        return <div className="ad-loading">Loading Dashboard Stats...</div>;
    }

    return (
        <div className="assets-dashboard">
            {/* Summary Cards */}
            <div className="ad-stats-grid">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className={`ad-stat-card ad-stat-card--${card.color}`}>
                            <div className="ad-stat-icon">
                                <Icon size={24} />
                            </div>
                            <div className="ad-stat-info">
                                <span className="ad-stat-label">{card.label}</span>
                                <div className="ad-stat-value-row">
                                    <span className="ad-stat-value">{card.value}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="ad-main-grid">
                {/* Left: Recent Activity Feed */}
                <div className="ad-card ad-activity-feed">
                    <div className="ad-card-header">
                        <h3>Recent Activity</h3>
                        <button className="ad-btn-text" onClick={() => router.push('/dashboard/payroll/assets/history')}>View All <ArrowRight size={16} /></button>
                    </div>
                    <div className="ad-activity-list">
                        {stats.recent_activity.length === 0 ? (
                            <div className="ad-no-data">No recent activity</div>
                        ) : stats.recent_activity.map((activity) => (
                            <div key={activity.id} className="ad-activity-item">
                                <div className={`ad-activity-dot ad-activity-dot--${activity.history_type}`}></div>
                                <div className="ad-activity-content">
                                    <p className="ad-activity-text">
                                        <strong>{activity.asset_name}</strong> - {activity.action}
                                    </p>
                                    <span className="ad-activity-time">{new Date(activity.date).toLocaleString()}</span>
                                </div>
                                <span className={`ad-status-badge ad-status-badge--${activity.history_type}`}>
                                    {activity.history_type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Quick Actions & Overview */}
                <div className="ad-right-col">
                    <div className="ad-card ad-quick-actions">
                        <div className="ad-card-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="ad-actions-list">
                            <button className="ad-action-btn ad-action-btn--primary" onClick={() => router.push('/dashboard/payroll/assets/manage')}>
                                <Plus size={18} /> Manage Assets
                            </button>
                            <button className="ad-action-btn ad-action-btn--outline" onClick={() => router.push('/dashboard/payroll/assets/requests')}>
                                <UserCheck size={18} /> Asset Requests
                            </button>
                            <button className="ad-action-btn ad-action-btn--outline" onClick={() => router.push('/dashboard/payroll/assets/batches')}>
                                <Box size={18} /> Manage Batches
                            </button>
                        </div>
                    </div>

                    <div className="ad-card ad-asset-health">
                        <div className="ad-card-header">
                            <h3>Asset Health</h3>
                        </div>
                        <div className="ad-health-stats">
                            <div className="ad-health-item">
                                <div className="ad-health-info">
                                    <span>Functional</span>
                                    <span>{stats.health.functional_pct}%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--good" style={{ width: `${stats.health.functional_pct}%` }}></div>
                                </div>
                            </div>
                            <div className="ad-health-item">
                                <div className="ad-health-info">
                                    <span>In Maintenance</span>
                                    <span>{stats.health.maintenance_pct}%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--warning" style={{ width: `${stats.health.maintenance_pct}%` }}></div>
                                </div>
                            </div>
                            <div className="ad-health-item">
                                <div className="ad-health-info">
                                    <span>Damaged/Lost</span>
                                    <span>{stats.health.damaged_pct}%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--danger" style={{ width: `${stats.health.damaged_pct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
