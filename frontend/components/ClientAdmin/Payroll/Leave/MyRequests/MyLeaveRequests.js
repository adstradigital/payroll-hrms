'use client';

import { useState, useEffect } from 'react';
import {
    Search, Plus, Calendar, Clock, CheckCircle,
    XCircle, Loader2, Filter, AlertCircle, Trash2
} from 'lucide-react';
import {
    getAllLeaves, applyLeave, cancelLeave,
    getMyProfile, getLeaveTypes
} from '@/api/api_clientadmin';
import ApplyLeaveModal from '../LeaveList/ApplyLeaveModal';
import './MyLeaveRequests.css';

export default function MyLeaveRequests({ currentUser }) {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [leavesRes, typesRes] = await Promise.all([
                getAllLeaves({ employee: currentUser.id }),
                getLeaveTypes()
            ]);

            const leavesData = leavesRes.data.results || (Array.isArray(leavesRes.data) ? leavesRes.data : []);
            const typesData = typesRes.data.results || (Array.isArray(typesRes.data) ? typesRes.data : []);

            setLeaveRequests(leavesData);
            setLeaveTypes(typesData);
            setError(null);
        } catch (err) {
            console.error('Error fetching my leaves:', err);
            setError('Failed to load your leave requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            setProcessingId(id);
            await cancelLeave(id);
            await fetchData();
        } catch (err) {
            console.error('Error cancelling leave:', err);
            alert('Failed to cancel leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', icon: <Clock size={14} />, class: 'status-pending' },
            approved: { label: 'Approved', icon: <CheckCircle size={14} />, class: 'status-approved' },
            rejected: { label: 'Rejected', icon: <XCircle size={14} />, class: 'status-rejected' },
            cancelled: { label: 'Cancelled', icon: <Trash2 size={14} />, class: 'status-cancelled' },
        };
        return badges[status] || { label: status, icon: <AlertCircle size={14} />, class: '' };
    };

    const filteredRequests = leaveRequests.filter(req => {
        const matchesSearch =
            req.leave_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: leaveRequests.length,
        pending: leaveRequests.filter(r => r.status === 'pending').length,
        approved: leaveRequests.filter(r => r.status === 'approved').length,
    };

    if (loading && leaveRequests.length === 0) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading your requests...</p>
            </div>
        );
    }

    return (
        <div className="my-leave-requests">
            {/* Stats Overview */}
            <div className="requests-stats">
                <div className="stat-item">
                    <span className="stat-label">Total Requests</span>
                    <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Pending</span>
                    <span className="stat-value text-warning">{stats.pending}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Approved</span>
                    <span className="stat-value text-success">{stats.approved}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="requests-toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by type or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="filter-wrapper">
                        <Filter size={16} className="filter-icon" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button className="btn-apply" onClick={() => setShowApplyModal(true)}>
                        <Plus size={18} /> Apply Leave
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className="requests-grid">
                {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} />
                        <p>{searchTerm ? 'No matching requests found.' : 'You haven\'t submitted any leave requests yet.'}</p>
                    </div>
                ) : (
                    filteredRequests.map(req => {
                        const status = getStatusBadge(req.status);
                        return (
                            <div key={req.id} className="request-card">
                                <div className="card-header">
                                    <div className="type-info">
                                        <span className="leave-type">{req.leave_type_name}</span>
                                        <span className="request-date">Applied on {new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`status-badge ${status.class}`}>
                                        {status.icon} {status.label}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="date-range">
                                        <Calendar size={14} />
                                        <span>{req.start_date} to {req.end_date}</span>
                                        <span className="day-count">({req.days_count} {req.days_count === 1 ? 'day' : 'days'})</span>
                                    </div>

                                    <div className="reason-text">
                                        <strong>Reason:</strong> {req.reason}
                                    </div>

                                    {req.rejection_reason && (
                                        <div className="rejection-box">
                                            <strong>Rejection Reason:</strong> {req.rejection_reason}
                                        </div>
                                    )}
                                </div>

                                {['pending', 'approved'].includes(req.status) && (
                                    <div className="card-actions">
                                        <button
                                            className="btn-cancel"
                                            onClick={() => handleCancel(req.id)}
                                            disabled={processingId === req.id}
                                        >
                                            {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                            {req.status === 'approved' ? 'Withdraw' : 'Cancel Request'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {showApplyModal && (
                <ApplyLeaveModal
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    currentUser={currentUser}
                    leaveTypes={leaveTypes}
                    onSuccess={() => {
                        setShowApplyModal(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
