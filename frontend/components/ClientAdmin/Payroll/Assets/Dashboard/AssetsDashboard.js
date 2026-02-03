'use client';

import { useState } from 'react';
import {
    Box, CheckCircle, Clock, AlertCircle,
    TrendingUp, UserCheck, Plus, Search,
    Filter, MoreVertical, ArrowRight
} from 'lucide-react';
import './AssetsDashboard.css';

const summaryCards = [
    { label: 'Total Assets', value: '1,284', icon: Box, color: 'blue', trend: '+12%' },
    { label: 'Active Assets', value: '1,120', icon: CheckCircle, color: 'green', trend: '+5%' },
    { label: 'Allocated', value: '856', icon: UserCheck, color: 'indigo', trend: '+8%' },
    { label: 'Pending Requests', value: '24', icon: Clock, color: 'orange', trend: '-2%' }
];

const recentActivity = [
    { id: 1, type: 'allocation', user: 'Anil Kumar', asset: 'MacBook Pro M2', date: '2 hours ago', status: 'completed' },
    { id: 2, type: 'request', user: 'Sneha Rao', asset: 'Dell Monitor 27"', date: '4 hours ago', status: 'pending' },
    { id: 3, type: 'return', user: 'Rahul Singh', asset: 'iPhone 13', date: 'Yesterday', status: 'completed' },
    { id: 4, type: 'maintenance', user: 'IT Support', asset: 'HP Laser Jet', date: 'Yesterday', status: 'in-progress' },
    { id: 5, type: 'allocation', user: 'Priya Verma', asset: 'Magic Mouse', date: '2 days ago', status: 'completed' }
];

export default function AssetsDashboard() {
    return (
        <div className="assets-dashboard">
            {/* Summary Cards */}
            <div className="ad-stats-grid">
                {summaryCards.map((card, index) => {
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
                                    <span className={`ad-stat-trend ad-stat-trend--${card.trend.startsWith('+') ? 'up' : 'down'}`}>
                                        <TrendingUp size={12} /> {card.trend}
                                    </span>
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
                        <button className="ad-btn-text">View All <ArrowRight size={16} /></button>
                    </div>
                    <div className="ad-activity-list">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="ad-activity-item">
                                <div className={`ad-activity-dot ad-activity-dot--${activity.status}`}></div>
                                <div className="ad-activity-content">
                                    <p className="ad-activity-text">
                                        <strong>{activity.user}</strong>
                                        {activity.type === 'allocation' ? ' was allocated ' :
                                            activity.type === 'request' ? ' requested ' :
                                                activity.type === 'return' ? ' returned ' : ' started maintenance on '}
                                        <strong>{activity.asset}</strong>
                                    </p>
                                    <span className="ad-activity-time">{activity.date}</span>
                                </div>
                                <span className={`ad-status-badge ad-status-badge--${activity.status}`}>
                                    {activity.status}
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
                            <button className="ad-action-btn ad-action-btn--primary">
                                <Plus size={18} /> Add New Asset
                            </button>
                            <button className="ad-action-btn ad-action-btn--outline">
                                <UserCheck size={18} /> Assign Asset
                            </button>
                            <button className="ad-action-btn ad-action-btn--outline">
                                <Box size={18} /> Create Batch
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
                                    <span>92%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--good" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            <div className="ad-health-item">
                                <div className="ad-health-info">
                                    <span>In Maintenance</span>
                                    <span>5%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--warning" style={{ width: '5%' }}></div>
                                </div>
                            </div>
                            <div className="ad-health-item">
                                <div className="ad-health-info">
                                    <span>Damaged</span>
                                    <span>3%</span>
                                </div>
                                <div className="ad-health-bar">
                                    <div className="ad-health-progress ad-health-progress--danger" style={{ width: '3%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
