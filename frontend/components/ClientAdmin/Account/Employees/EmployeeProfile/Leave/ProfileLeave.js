import { useState, useEffect } from 'react';
import {
    Calendar, Clock, CheckCircle,
    XCircle, Loader2, AlertCircle,
    FileText, TrendingUp, Inbox
} from 'lucide-react';
import { getLeaveBalance, getAllLeaves } from '@/api/api_clientadmin';
import './ProfileLeave.css';

export default function ProfileLeave({ employeeId }) {
    const [balances, setBalances] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (employeeId) {
            fetchLeaveData();
        }
    }, [employeeId]);

    const fetchLeaveData = async () => {
        try {
            setLoading(true);
            const [balanceRes, historyRes] = await Promise.all([
                getLeaveBalance(employeeId),
                getAllLeaves({ employee: employeeId })
            ]);

            setBalances(balanceRes.data.results || (Array.isArray(balanceRes.data) ? balanceRes.data : []));
            setHistory(historyRes.data.results || (Array.isArray(historyRes.data) ? historyRes.data : []));
            setError(null);
        } catch (err) {
            console.error('Error fetching leave details:', err);
            setError('Failed to load leave information');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-leave-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading leave data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-leave-error">
                <AlertCircle size={40} />
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchLeaveData}>Retry</button>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', icon: <Clock size={14} />, class: 'status-pending' },
            approved: { label: 'Approved', icon: <CheckCircle size={14} />, class: 'status-approved' },
            rejected: { label: 'Rejected', icon: <XCircle size={14} />, class: 'status-rejected' },
            cancelled: { label: 'Cancelled', icon: <FileText size={14} />, class: 'status-cancelled' },
        };
        return badges[status] || { label: status, icon: null, class: '' };
    };

    return (
        <div className="profile-leave-container animate-fade-in">
            {/* Leave Balance Section */}
            <section className="leave-section">
                <div className="section-header">
                    <TrendingUp size={20} />
                    <h3>Leave Balances</h3>
                </div>

                <div className="balance-grid">
                    {balances.length === 0 ? (
                        <div className="empty-message">No leave balances allocated.</div>
                    ) : (
                        balances.map(b => (
                            <div key={b.id} className="balance-card">
                                <div className="balance-type">{b.leave_type_name}</div>
                                <div className="balance-stats-row">
                                    <div className="stat-box">
                                        <span className="stat-label">Allocated</span>
                                        <span className="stat-value">{(parseFloat(b.allocated) + parseFloat(b.carry_forward || 0)).toFixed(1)}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Used</span>
                                        <span className="stat-value text-success">{parseFloat(b.used || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Remaining</span>
                                        <span className="stat-value highlight">{parseFloat(b.available || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="balance-progress">
                                    <div
                                        className="progress-bar"
                                        style={{
                                            width: `${Math.min((parseFloat(b.used || 0) / (parseFloat(b.allocated) + parseFloat(b.carry_forward || 0)) * 100), 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Leave History Section */}
            <section className="leave-section">
                <div className="section-header">
                    <Inbox size={20} />
                    <h3>Leave History</h3>
                </div>

                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="empty-state-lite">
                            <Calendar size={32} />
                            <p>No leave requests found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Type</th>
                                        <th>Days</th>
                                        <th>Status</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(req => {
                                        const statusObj = getStatusBadge(req.status);
                                        return (
                                            <tr key={req.id}>
                                                <td className="date-cell">
                                                    <div>{req.start_date}</div>
                                                    <div className="date-sub">to {req.end_date}</div>
                                                </td>
                                                <td><span className="type-pill">{req.leave_type_name}</span></td>
                                                <td>{req.days_count}</td>
                                                <td>
                                                    <span className={`status-pill ${statusObj.class}`}>
                                                        {statusObj.icon} {statusObj.label}
                                                    </span>
                                                </td>
                                                <td className="reason-cell" title={req.reason}>{req.reason}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
