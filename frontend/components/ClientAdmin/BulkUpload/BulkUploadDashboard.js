'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    UploadCloud, FileSpreadsheet, CheckCircle2,
    XCircle, Clock, ArrowRight, BarChart
} from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';
import './BulkUploadDashboard.css';

export default function BulkUploadDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await bulkUploadApi.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { id: 'employee', label: 'Employee Data', icon: UploadCloud, color: 'var(--brand-primary)' },
        { id: 'salary', label: 'Salary Data', icon: FileSpreadsheet, color: '#10b981' }, // emerald-500
        { id: 'attendance', label: 'Attendance', icon: Clock, color: '#f59e0b' }, // amber-500
        // { id: 'tax', label: 'Tax Data', icon: FileSpreadsheet, color: '#6366f1' }, // indigo-500
    ];

    if (loading) {
        return <div className="bu-dashboard__loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="bu-dashboard">
            <header className="bu-dashboard__header">
                <div>
                    <h1>Bulk Upload</h1>
                    <p>Manage efficient data imports for your organization</p>
                </div>
                <button
                    className="bu-dashboard__history-btn"
                    onClick={() => router.push('/dashboard/payroll/bulk-upload/history')}
                >
                    View Full History
                </button>
            </header>

            {/* Stats Grid */}
            <div className="bu-dashboard__stats">
                <div className="bu-stat-card">
                    <div className="bu-stat-card__icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)' }}>
                        <UploadCloud size={24} />
                    </div>
                    <div>
                        <h3>Total Uploads</h3>
                        <p className="bu-stat-card__value">{stats?.totalUploads}</p>
                    </div>
                </div>
                <div className="bu-stat-card">
                    <div className="bu-stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h3>Success Rate</h3>
                        <p className="bu-stat-card__value">{stats?.successRate}%</p>
                    </div>
                </div>
                <div className="bu-stat-card">
                    <div className="bu-stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <XCircle size={24} />
                    </div>
                    <div>
                        <h3>Failed</h3>
                        <p className="bu-stat-card__value">{stats?.failedUploads}</p>
                    </div>
                </div>
                <div className="bu-stat-card">
                    <div className="bu-stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3>Pending</h3>
                        <p className="bu-stat-card__value">{stats?.pendingUploads}</p>
                    </div>
                </div>
            </div>

            <div className="bu-dashboard__content-grid">
                {/* Quick Actions */}
                <section className="bu-card">
                    <h2>Quick Upload</h2>
                    <div className="bu-quick-actions">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                className="bu-action-btn"
                                onClick={() => router.push(`/dashboard/payroll/bulk-upload/${action.id}`)}
                            >
                                <div className="bu-action-btn__icon" style={{ color: action.color }}>
                                    <action.icon size={28} />
                                </div>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bu-card__footer">
                        <button
                            className="bu-link-btn"
                            onClick={() => router.push('/dashboard/payroll/bulk-upload/templates')}
                        >
                            Download Templates <ArrowRight size={16} />
                        </button>
                    </div>
                </section>

                {/* Upload Trends Chart (Placeholder) */}
                <section className="bu-card">
                    <h2>Upload Trends</h2>
                    <div className="bu-chart-placeholder">
                        <BarChart size={48} className="bu-chart-icon" />
                        <p>Upload activity over the last 30 days</p>
                        {/* Simple CSS Bar Chart could go here */}
                        <div className="bu-mini-chart">
                            {[40, 65, 30, 85, 50, 70, 90, 60, 45, 80].map((h, i) => (
                                <div key={i} className="bu-mini-bar" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Recent Uploads */}
            <section className="bu-card bu-dashboard__recent">
                <div className="bu-card__header">
                    <h2>Recent Uploads</h2>
                </div>
                <div className="bu-table-wrapper">
                    <table className="bu-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>File Name</th>
                                <th>Status</th>
                                <th>Rows</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentUploads.map((upload) => (
                                <tr key={upload.id} onClick={() => router.push(`/dashboard/payroll/bulk-upload/detail/${upload.id}`)}>
                                    <td className="bu-type-cell">
                                        <span className="bu-type-badge">{upload.type}</span>
                                    </td>
                                    <td>{upload.fileName}</td>
                                    <td>
                                        <span className={`bu-status-badge bu-status-${upload.status}`}>
                                            {upload.status}
                                        </span>
                                    </td>
                                    <td>{upload.rows}</td>
                                    <td>{new Date(upload.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
