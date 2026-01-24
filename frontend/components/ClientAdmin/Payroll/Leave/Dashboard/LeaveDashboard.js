'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Clock, CheckCircle, XCircle,
    TrendingUp, Users, ArrowRight, Plus,
    Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { getLeaveStats, getLeaveTypes } from '@/api/api_clientadmin';
import ApplyLeaveModal from '../LeaveList/ApplyLeaveModal';
import './LeaveDashboard.css';

export default function LeaveDashboard({ currentUser }) {
    const [stats, setStats] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, typesRes] = await Promise.all([
                getLeaveStats(),
                getLeaveTypes()
            ]);
            setStats(statsRes.data);
            setLeaveTypes(typesRes.data.results || (Array.isArray(typesRes.data) ? typesRes.data : []));
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'approved': return 'badge-success';
            case 'rejected': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    if (loading) {
        return (
            <div className="leave-dashboard-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading your leave overview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leave-dashboard-error">
                <AlertCircle size={40} />
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchDashboardData}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="leave-dashboard">
            {/* Stats Overview */}
            <div className="leave-stats-grid">
                <div className="leave-stat-card">
                    <div className="leave-stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="leave-stat-info">
                        <span className="leave-stat-value">{stats?.pending || 0}</span>
                        <span className="leave-stat-label">Pending Requests</span>
                    </div>
                </div>

                <div className="leave-stat-card">
                    <div className="leave-stat-icon on-leave">
                        <Calendar size={24} />
                    </div>
                    <div className="leave-stat-info">
                        <span className="leave-stat-value">{stats?.on_leave_today || 0}</span>
                        <span className="leave-stat-label">On Leave Today</span>
                    </div>
                </div>

                <div className="leave-stat-card">
                    <div className="leave-stat-icon approved">
                        <CheckCircle size={24} />
                    </div>
                    <div className="leave-stat-info">
                        <span className="leave-stat-value">{stats?.approved || 0}</span>
                        <span className="leave-stat-label">Approved (Total)</span>
                    </div>
                </div>

                <div className="leave-stat-card">
                    <div className="leave-stat-icon total">
                        <TrendingUp size={24} />
                    </div>
                    <div className="leave-stat-info">
                        <span className="leave-stat-value">{Object.keys(stats?.type_distribution || {}).length}</span>
                        <span className="leave-stat-label">Leave Types Active</span>
                    </div>
                </div>
            </div>

            <div className="leave-dashboard-content">
                {/* Recent Activities */}
                <div className="leave-section-card">
                    <div className="leave-section-header">
                        <h3>Recent Leave Requests</h3>
                        <Link href="/dashboard/leave/requests" className="view-all-link">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="recent-requests">
                        {!stats?.recent_requests || stats.recent_requests.length === 0 ? (
                            <p className="no-data">No recent requests found.</p>
                        ) : (
                            <table className="recent-requests-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Leave Type</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_requests.map((req) => (
                                        <tr key={req.id}>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="employee-avatar">
                                                        {(req.employee_name || 'E').split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="employee-info">
                                                        <span className="employee-name">{req.employee_name}</span>
                                                        <span className="employee-id">{req.employee_id_display}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{req.leave_type_name}</td>
                                            <td>
                                                <span className="date-text">{req.start_date}</span>
                                                <span className="text-secondary" style={{ margin: '0 4px' }}>-</span>
                                                <span className="date-text">{req.end_date}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="leave-section-card">
                    <div className="leave-section-header">
                        <h3>Quick Actions</h3>
                    </div>

                    <div className="quick-actions-list">
                        <button className="action-btn" onClick={() => setShowApplyModal(true)}>
                            <div className="action-icon">
                                <Plus size={20} />
                            </div>
                            <div className="action-label">
                                <span className="action-title">Apply Leave</span>
                                <span className="action-desc">Submit a new leave application</span>
                            </div>
                        </button>

                        <Link href="/dashboard/leave/requests" className="action-btn">
                            <div className="action-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div className="action-label">
                                <span className="action-title">Approval Queue</span>
                                <span className="action-desc">Process pending leave requests</span>
                            </div>
                        </Link>

                        <Link href="/dashboard/leave/balance" className="action-btn">
                            <div className="action-icon">
                                <TrendingUp size={20} />
                            </div>
                            <div className="action-label">
                                <span className="action-title">Leave History</span>
                                <span className="action-desc">Check balances and history</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showApplyModal && (
                <ApplyLeaveModal
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    currentUser={currentUser}
                    leaveTypes={leaveTypes}
                    onSuccess={() => {
                        setShowApplyModal(false);
                        fetchDashboardData();
                    }}
                />
            )}
        </div>
    );
}
