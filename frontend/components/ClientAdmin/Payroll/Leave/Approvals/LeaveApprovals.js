'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, Clock, Calendar,
    User, Search, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { getAllLeaves, approveLeave, rejectLeave, getMyProfile } from '@/api/api_clientadmin';
import './LeaveApprovals.css';

export default function LeaveApprovals() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [rejectModal, setRejectModal] = useState({ show: false, requestId: null, reason: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [leavesRes, profileRes] = await Promise.all([
                getAllLeaves({ status: 'pending' }),
                getMyProfile()
            ]);

            const data = leavesRes.data.results || (Array.isArray(leavesRes.data) ? leavesRes.data : []);
            setPendingRequests(data);
            setCurrentUser(profileRes.data.employee || profileRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching approvals:', err);
            setError('Failed to load pending requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setProcessingId(id);
            await approveLeave(id, currentUser?.id);
            setPendingRequests(prev => prev.filter(req => req.id !== id));
        } catch (err) {
            alert('Failed to approve leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id) => {
        setRejectModal({ show: true, requestId: id, reason: '' });
    };

    const closeRejectModal = () => {
        setRejectModal({ show: false, requestId: null, reason: '' });
    };

    const submitReject = async () => {
        const { requestId, reason } = rejectModal;
        if (!reason.trim()) return;

        try {
            setProcessingId(requestId);
            closeRejectModal();
            await rejectLeave(requestId, reason);
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err) {
            alert('Failed to reject leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = pendingRequests.filter(req =>
        req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee_id_display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="leave-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading pending approvals...</p>
            </div>
        );
    }

    return (
        <div className="leave-approvals">
            <div className="approvals-header">
                <div className="approvals-stats">
                    <div className="approval-stat approval-stat--pending">
                        <div className="approval-stat__icon-wrapper">
                            <Clock className="text-warning" size={24} />
                        </div>
                        <div className="approval-stat__info">
                            <span className="approval-stat__count">{pendingRequests.length}</span>
                            <span className="approval-stat__label">Pending Approvals</span>
                        </div>
                    </div>
                </div>

                <div className="approvals-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="holiday-search">
                        <Search size={18} className="holiday-search__icon" />
                        <input
                            type="text"
                            placeholder="Filter by employee..."
                            className="holiday-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={fetchData} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            {filteredRequests.length === 0 ? (
                <div className="approval-empty">
                    <CheckCircle size={48} className="text-success" />
                    <p>{searchTerm ? 'No matching requests found.' : 'All caught up! No pending approvals.'}</p>
                </div>
            ) : (
                <div className="approvals-list">
                    {filteredRequests.map(request => (
                        <div key={request.id} className="approval-item">
                            <div className="approval-item__employee">
                                <div className="approval-item__avatar">
                                    {(request.employee_name || 'E').split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="approval-item__info">
                                    <span className="approval-item__name">{request.employee_name}</span>
                                    <span className="approval-item__id">{request.employee_id_display}</span>
                                </div>
                            </div>

                            <div className="approval-item__details">
                                <div className="approval-item__type-date">
                                    <span className="approval-item__type">{request.leave_type_name}</span>
                                    <div className="approval-item__date">
                                        <Calendar size={14} />
                                        <span>{request.start_date} to {request.end_date}</span>
                                        <span style={{ fontWeight: 600 }}>({request.days_count} days)</span>
                                    </div>
                                </div>
                                <div className="approval-item__reason">
                                    <strong>Reason:</strong> {request.reason}
                                </div>
                            </div>

                            <div className="approval-item__actions">
                                <button
                                    className="reject-btn"
                                    onClick={() => openRejectModal(request.id)}
                                    disabled={processingId === request.id}
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                                <button
                                    className="approve-btn"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processingId === request.id}
                                >
                                    {processingId === request.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="reject-modal-overlay">
                    <div className="reject-modal">
                        <div className="reject-modal__header">
                            <h3>Reject Leave Request</h3>
                            <button className="reject-modal__close" onClick={closeRejectModal}>
                                <XCircle size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                        <div className="reject-modal__body">
                            <label>Reason for Rejection <span className="text-danger">*</span></label>
                            <textarea
                                placeholder="Please provide a valid reason..."
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                autoFocus
                                rows={4}
                            />
                        </div>
                        <div className="reject-modal__footer">
                            <button className="btn-cancel" onClick={closeRejectModal}>Cancel</button>
                            <button 
                                className="btn-confirm-reject" 
                                onClick={submitReject}
                                disabled={!rejectModal.reason.trim()}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
