'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock,
    User, Box, MessageSquare, Filter,
    Search, ArrowUpRight, Calendar, AlertCircle
} from 'lucide-react';
import { getAssetRequests, processAssetRequest } from '@/api/api_clientadmin';
import './AssetApprovals.css';

export default function AssetApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAssetRequests();
            const data = response.data.results || response.data;
            setRequests(data);

            // Calculate stats
            setStats({
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                approved: data.filter(r => r.status === 'approved').length,
                rejected: data.filter(r => r.status === 'rejected').length
            });
        } catch (error) {
            console.error('Error fetching requests:', error);
            setError('Failed to load asset requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id, action, reason = '') => {
        try {
            setProcessingId(id);
            await processAssetRequest(id, { action, reason });
            fetchRequests();
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedRequestId(null);
        } catch (error) {
            console.error('Error processing request:', error);
            alert('Failed to process request.');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id) => {
        setSelectedRequestId(id);
        setShowRejectModal(true);
    };

    const filteredRequests = requests.filter(req => {
        const matchesTab = activeTab === 'all' ? true : req.status === activeTab;
        const matchesSearch = req.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.employee_details?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="asset-approvals">
            <div className="aa-header">
                <div className="aa-stats">
                    <div className="aa-stat-card">
                        <span className="aa-stat-label">Pending</span>
                        <span className="aa-stat-value orange">{stats.pending}</span>
                    </div>
                    <div className="aa-stat-card">
                        <span className="aa-stat-label">Total Requests</span>
                        <span className="aa-stat-value blue">{stats.total}</span>
                    </div>
                    <div className="aa-stat-card">
                        <span className="aa-stat-label">Approved</span>
                        <span className="aa-stat-value green">{stats.approved}</span>
                    </div>
                </div>
            </div>

            <div className="aa-toolbar">
                <div className="aa-tabs">
                    <button className={`aa-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        <Clock size={16} /> Pending
                    </button>
                    <button className={`aa-tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
                        <CheckCircle2 size={16} /> Approved
                    </button>
                    <button className={`aa-tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
                        <XCircle size={16} /> Rejected
                    </button>
                    <button className={`aa-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                        All
                    </button>
                </div>
                <div className="aa-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by asset or employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="aa-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchRequests}>Retry</button>
                </div>
            )}

            <div className="aa-list">
                {loading ? (
                    <div className="aa-loading">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="aa-empty">No requests found.</div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className="aa-request-card">
                            <div className="aa-card-main">
                                <div className="aa-req-header">
                                    <div className="aa-req-type">
                                        <Box size={20} />
                                        <span>{req.asset_type} Request</span>
                                        <span className={`aa-priority aa-priority--${req.priority}`}>{req.priority}</span>
                                    </div>
                                    <span className="aa-req-date"><Calendar size={14} /> {req.date}</span>
                                </div>

                                <div className="aa-req-body">
                                    <div className="aa-employee">
                                        <div className="aa-avatar">
                                            {req.employee_details?.full_name ? req.employee_details.full_name[0] : 'U'}
                                        </div>
                                        <div className="aa-emp-info">
                                            <span className="aa-emp-name">{req.employee_details?.full_name || 'Unknown Employee'}</span>
                                            <span className="aa-emp-id">{req.employee_details?.employee_id || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="aa-reason">
                                        <MessageSquare size={16} />
                                        <p>{req.reason}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="aa-card-actions">
                                <div className="aa-status-area">
                                    <span className={`aa-status-badge aa-status--${req.status}`}>{req.status}</span>
                                </div>
                                {req.status === 'pending' && (
                                    <div className="aa-action-btns">
                                        <button
                                            className="aa-btn aa-btn--reject"
                                            onClick={() => openRejectModal(req.id)}
                                            disabled={processingId === req.id}
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                        <button
                                            className="aa-btn aa-btn--approve"
                                            onClick={() => handleProcess(req.id, 'approve')}
                                            disabled={processingId === req.id}
                                        >
                                            <CheckCircle2 size={18} /> Approve
                                        </button>
                                    </div>
                                )}
                                {req.status === 'rejected' && req.rejection_reason && (
                                    <div className="aa-reject-note">
                                        <strong>Reason:</strong> {req.rejection_reason}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showRejectModal && (
                <div className="aa-modal-overlay">
                    <div className="aa-modal">
                        <h3>Reject Asset Request</h3>
                        <p>Please provide a reason for rejecting this request.</p>
                        <textarea
                            rows={4}
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>
                        <div className="aa-modal-actions">
                            <button className="aa-btn aa-btn--outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button
                                className="aa-btn aa-btn--danger"
                                onClick={() => handleProcess(selectedRequestId, 'reject', rejectionReason)}
                                disabled={!rejectionReason.trim()}
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
