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
    Loader2,
    ShieldCheck,
    Target
} from 'lucide-react';
import './Approvals.css';
import axiosInstance from '@/api/axiosInstance';
import { SUPERADMIN_ENDPOINTS } from '@/api/config';
import { useAuth } from '@/context/AuthContext';

const MeshBackground = () => (
    <div className="mesh-container">
        <div className="mesh-ball mesh-ball-1"></div>
        <div className="mesh-ball mesh-ball-2"></div>
        <div className="mesh-ball mesh-ball-3"></div>
    </div>
);

const Approvals = () => {
    const { user } = useAuth();
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
                const loginUsername = response?.data?.login_username || request.admin_email;
                alert(`Organization "${request.organization_name}" has been approved.\n\nLogin credentials have been sent to:\n${request.admin_email}\n\nLogin Username: ${loginUsername}\n\nThe client admin can now access their dashboard.`);
                setRequests(prev => prev.filter(req => req.id !== request.id));
            }
        } catch (err) {
            console.error('Approval error:', err);
            const backendMessage = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to approve registration.';
            alert(backendMessage);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request) => {
        const reason = window.prompt(`Enter reason for rejecting "${request.organization_name}" (optional):`);
        if (reason === null) return;
        setProcessingId(request.id);
        try {
            const response = await axiosInstance.post(SUPERADMIN_ENDPOINTS.REJECT_REGISTRATION(request.id), { rejection_reason: reason });
            if (response.data.success) {
                alert(`Organization "${request.organization_name}" has been rejected.`);
                setRequests(prev => prev.filter(req => req.id !== request.id));
            }
        } catch (err) {
            console.error('Rejection error:', err);
            alert('Failed to reject registration.');
        } finally {
            setProcessingId(null);
        }
    };

    const toggleExpand = (id) => setExpandedCard(expandedCard === id ? null : id);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const diffMs = new Date() - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="approvals-loading">
                <Loader2 size={48} className="animate-spin text-indigo-500" />
                <p className="text-zinc-400 mt-4 font-medium">Fetching global registrations...</p>
            </div>
        );
    }

    return (
        <div className="approvals-wrapper animate-slide-up">
            <MeshBackground />
            
            <div className="approvals-header-premium">
                <div className="header-badge">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>Security Verified</span>
                </div>
                <div className="header-info-flex">
                    <div>
                        <h1 className="approvals-title-premium">Organization <span className="text-gradient">Approvals</span></h1>
                        <p className="approvals-subtitle-premium">Review and authorize global registration requests. Secure credentials will be auto-dispatched.</p>
                    </div>
                    <div className="header-actions-nexus">
                        <button className="premium-btn-secondary" onClick={fetchPendingRegistrations}>
                            <RefreshCw size={16} />
                            <span>Refresh Sync</span>
                        </button>
                        <div className="nexus-stat-chip">
                            <Clock size={14} className="text-amber-400" />
                            <span>{requests.length} Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner-nexus">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={fetchPendingRegistrations}>Retry Connection</button>
                </div>
            )}

            {requests.length > 0 ? (
                <div className="approvals-list-nexus">
                    {requests.map((request) => (
                        <div key={request.id} className={`approval-card-nexus ${expandedCard === request.id ? 'expanded' : ''}`}>
                            <div className="approval-card-header-nexus" onClick={() => toggleExpand(request.id)}>
                                <div className="card-primary-nexus">
                                    <div className="org-icon-nexus">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="org-text-nexus">
                                        <h3 className="org-name-nexus">{request.organization_name}</h3>
                                        <div className="org-meta-nexus">
                                            <span className="meta-item-nexus"><Globe size={12} />{request.domain || 'Direct Domain'}</span>
                                            <span className="meta-item-nexus"><Users size={12} />{request.employee_scale}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-trail-nexus">
                                    <span className="plan-badge-nexus">{request.plan}</span>
                                    <span className="time-badge-nexus">{formatDate(request.submitted_at)}</span>
                                    <div className="expand-indicator">
                                        {expandedCard === request.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </div>

                            {expandedCard === request.id && (
                                <div className="approval-card-body-nexus">
                                    <div className="details-grid-nexus">
                                        <div className="detail-section">
                                            <h4 className="detail-title">Administrator Contact</h4>
                                            <div className="detail-items">
                                                <div className="detail-item"><span className="label">Full Name</span><span className="value">{request.admin_name}</span></div>
                                                <div className="detail-item"><span className="label">Email Contact</span><span className="value email"><Mail size={12} />{request.admin_email}</span></div>
                                                {request.admin_phone && <div className="detail-item"><span className="label">Phone Number</span><span className="value">{request.admin_phone}</span></div>}
                                            </div>
                                        </div>
                                        <div className="detail-section">
                                            <h4 className="detail-title">Operational Scope</h4>
                                            <div className="detail-items">
                                                <div className="detail-item"><span className="label">Industry Vertical</span><span className="value">{request.industry || 'Multi-Sector'}</span></div>
                                                <div className="detail-item"><span className="label">Structure</span><span className="value">{request.is_multi_company ? 'Group / Multi-Subsidiary' : 'Single Entity'}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="security-notice-nexus">
                                        <Send size={14} className="text-amber-500" />
                                        <span>Automated credential dispatch active. Approving will authorize <strong>{request.admin_email}</strong> for production access.</span>
                                    </div>

                                    <div className="approval-nexus-actions">
                                        <button className="btn-nexus-reject" onClick={() => handleReject(request)} disabled={processingId === request.id}>
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button className="btn-nexus-approve" onClick={() => handleApprove(request)} disabled={processingId === request.id}>
                                            {processingId === request.id ? <><Loader2 size={16} className="animate-spin" /> Authorizing...</> : <><CheckCircle2 size={16} /> Authorize Access</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state-nexus animate-slide-up">
                    <div className="empty-visual">
                        <CheckCircle2 size={64} className="text-emerald-500" />
                    </div>
                    <h3>Queue Clear</h3>
                    <p>No pending organization verifications found in the global registry.</p>
                    <button className="premium-btn-secondary mt-6" onClick={fetchPendingRegistrations}>Verify Registry Sync</button>
                </div>
            )}
        </div>
    );
};

export default Approvals;
