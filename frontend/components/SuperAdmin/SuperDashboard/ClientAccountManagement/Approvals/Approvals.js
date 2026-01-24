import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Building2,
    Users,
    Clock,
    Search,
    Mail,
    Send,
    AlertCircle,
    Globe,
    Briefcase,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Loader2
} from 'lucide-react';
import './Approvals.css';
import axiosInstance from '@/api/axiosInstance';
import { SUPERADMIN_ENDPOINTS } from '@/api/config';

const Approvals = () => {
    const [requests, setRequests] = useState([]);
    const [expandedCard, setExpandedCard] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingRegistrations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(SUPERADMIN_ENDPOINTS.PENDING_REGISTRATIONS);
            if (response.data.success) {
                setRequests(response.data.results || []);
            }
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to load pending registrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRegistrations();
    }, []);

    const handleApprove = async (request) => {
        setProcessingId(request.id);

        try {
            const response = await axiosInstance.post(SUPERADMIN_ENDPOINTS.APPROVE_REGISTRATION(request.id));
            if (response.data.success) {
                alert(`✅ Organization "${request.organization_name}" has been approved!\n\n📧 Login credentials have been sent to:\n${request.admin_email}\n\nThe client admin can now access their dashboard.`);
                setRequests(prev => prev.filter(req => req.id !== request.id));
            }
        } catch (err) {
            console.error('Approval error:', err);
            alert('Failed to approve registration. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request) => {
        const reason = window.prompt(`Enter reason for rejecting "${request.organization_name}" (optional):`);
        if (reason === null) return; // User cancelled

        setProcessingId(request.id);
        try {
            const response = await axiosInstance.post(SUPERADMIN_ENDPOINTS.REJECT_REGISTRATION(request.id), {
                rejection_reason: reason
            });
            if (response.data.success) {
                alert(`Organization "${request.organization_name}" has been rejected.`);
                setRequests(prev => prev.filter(req => req.id !== request.id));
            }
        } catch (err) {
            console.error('Rejection error:', err);
            alert('Failed to reject registration. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const toggleExpand = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="approvals-wrapper animate-slide-up">
                <div className="loading-container">
                    <Loader2 size={32} className="spinner-icon" />
                    <p>Loading pending registrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="approvals-wrapper animate-slide-up">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-heading">Pending Approvals</h1>
                    <p className="page-subheading">Review organization registrations. Approved organizations will automatically receive login credentials via email.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchPendingRegistrations}>
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                    <div className="stat-badge pending">
                        <Clock size={14} />
                        <span>{requests.length} Pending</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={fetchPendingRegistrations}>Retry</button>
                </div>
            )}

            {requests.length > 0 ? (
                <div className="approvals-list">
                    {requests.map((request) => (
                        <div key={request.id} className={`approval-card-premium ${expandedCard === request.id ? 'expanded' : ''}`}>
                            <div className="approval-card-header" onClick={() => toggleExpand(request.id)}>
                                <div className="org-info-row">
                                    <div className="org-avatar">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="org-primary-info">
                                        <h3 className="org-name">{request.organization_name}</h3>
                                        <div className="org-meta">
                                            {request.domain && (
                                                <span className="meta-item">
                                                    <Globe size={12} />
                                                    {request.domain}
                                                </span>
                                            )}
                                            {request.industry && (
                                                <span className="meta-item">
                                                    <Briefcase size={12} />
                                                    {request.industry}
                                                </span>
                                            )}
                                            <span className="meta-item">
                                                <Users size={12} />
                                                {request.employee_scale}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-header-right">
                                    <span className="plan-badge">{request.plan}</span>
                                    <span className="submitted-time">{formatDate(request.submitted_at)}</span>
                                    {expandedCard === request.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>

                            {expandedCard === request.id && (
                                <div className="approval-card-body">
                                    <div className="admin-info-section">
                                        <h4>Client Admin Details</h4>
                                        <div className="admin-details-grid">
                                            <div className="admin-detail">
                                                <span className="detail-label">Admin Name</span>
                                                <span className="detail-value">{request.admin_name}</span>
                                            </div>
                                            <div className="admin-detail">
                                                <span className="detail-label">Admin Email</span>
                                                <span className="detail-value email">
                                                    <Mail size={14} />
                                                    {request.admin_email}
                                                </span>
                                            </div>
                                            {request.admin_phone && (
                                                <div className="admin-detail">
                                                    <span className="detail-label">Phone</span>
                                                    <span className="detail-value">{request.admin_phone}</span>
                                                </div>
                                            )}
                                            {request.is_multi_company && (
                                                <div className="admin-detail">
                                                    <span className="detail-label">Multi-Company</span>
                                                    <span className="detail-value">Yes ({request.subsidiaries?.length || 0} subsidiaries)</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="credentials-notice">
                                            <Send size={16} />
                                            <p>Upon approval, login credentials will be auto-generated and sent to <strong>{request.admin_email}</strong></p>
                                        </div>
                                    </div>

                                    <div className="approval-card-actions">
                                        <button
                                            className="btn-reject"
                                            onClick={() => handleReject(request)}
                                            disabled={processingId === request.id}
                                        >
                                            <XCircle size={16} />
                                            <span>Reject</span>
                                        </button>
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleApprove(request)}
                                            disabled={processingId === request.id}
                                        >
                                            {processingId === request.id ? (
                                                <>
                                                    <div className="spinner"></div>
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    <span>Approve & Send Credentials</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-requests-placeholder">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                    <h3>All caught up!</h3>
                    <p>There are no pending organization approvals at this time.</p>
                </div>
            )}
        </div>
    );
};

export default Approvals;
