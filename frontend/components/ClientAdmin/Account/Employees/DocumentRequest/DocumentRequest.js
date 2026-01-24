'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search, Filter, CheckCircle, XCircle, Clock, Plus,
    MoreVertical, Eye, Download, ChevronRight, Loader2, Upload,
    Send, Users, ArrowDownToLine, ArrowUpFromLine, X, User, Paperclip,
    AlertTriangle, Calendar, ShieldCheck, Briefcase, CheckSquare, Square,
    History, MessageSquare, Bell
} from 'lucide-react';
import {
    getDocumentRequests,
    createDocumentRequest,
    approveDocumentRequest,
    rejectDocumentRequest,
    submitDocumentForRequest,
    getAllEmployees
} from '@/api/api_clientadmin';
import './DocumentRequest.css';

// Constants
const ADMIN_REQUEST_TYPES = [
    'ID Proof', 'Address Proof', 'Education Certificate', 'Experience Letter',
    'PAN Card', 'Aadhar Card', 'Passport', 'Bank Details', 'Photo', 'Other'
];

const EMPLOYEE_REQUEST_TYPES = [
    'Payslip', 'Experience Letter', 'Offer Letter', 'Salary Certificate',
    'Employment Verification', 'Relieving Letter', 'Bonafide Certificate', 'Other'
];

export default function AdvancedDocumentRequest() {
    // State
    const [activeTab, setActiveTab] = useState('admin_to_employee');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    // UI State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modal Tab State
    const [modalTab, setModalTab] = useState('checklist'); // 'checklist' | 'history' | 'comments'

    // Initial Fetch
    useEffect(() => {
        fetchRequests();
        fetchEmployees();
    }, [activeTab]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = { direction: activeTab };
            const res = await getDocumentRequests(params);
            // Transform or ensure data has necessary fields if backend is missing them
            const data = (res.data.results || res.data || []).map(req => ({
                ...req,
                // Ensure array fields exist for UI safety if backend doesn't send them yet
                audit_log: req.audit_log || [],
                comments: req.comments || [],
                // Default priority if not set
                priority: req.priority || 'medium'
            }));
            setRequests(data);
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getAllEmployees({ status: 'active' });
            setEmployees(res.data.results || res.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    // --- Derived Data & Metrics ---
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const reviewCount = requests.filter(r => r.status === 'submitted').length;
    const criticalCount = requests.filter(r => r.priority === 'critical' && r.status !== 'approved').length;

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const empName = req.employee_name || 'Unknown';
            const docType = req.document_type || '';
            const term = searchTerm.toLowerCase();
            return empName.toLowerCase().includes(term) || docType.toLowerCase().includes(term);
        });
    }, [requests, searchTerm]);

    // --- Handlers ---
    const handleOpenReview = (request) => {
        // If it's a "submitted" request (has file), open review
        if (request.document_file) {
            setSelectedRequest(request);
            setModalTab('checklist');
            setShowReviewModal(true);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveDocumentRequest(id);
            setShowReviewModal(false);
            fetchRequests(); // Refresh
        } catch (err) {
            alert('Failed to approve request');
            console.error(err);
        }
    };

    const handleReject = async (id, reason) => {
        try {
            await rejectDocumentRequest(id, reason || '');
            setShowReviewModal(false);
            fetchRequests(); // Refresh
        } catch (err) {
            alert('Failed to reject request');
            console.error(err);
        }
    };

    // Bulk Selection Logic
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredRequests.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRequests.map(r => r.id)));
        }
    };

    const toggleSelectRow = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkAction = (action) => {
        alert(`${action} functionality for ${selectedIds.size} items is coming soon!`);
        setSelectedIds(new Set());
    };

    return (
        <div className="doc-req-container">
            {/* Header Section */}
            <header className="doc-req-header">
                <div className="doc-req-title-group">
                    <h1>
                        <FileText className="text-brand" size={28} style={{ color: 'var(--brand-primary)' }} />
                        Document Control Center
                    </h1>
                    <p>Manage compliance, requests, and approvals.</p>
                </div>
                <div className="doc-req-header-actions">
                    <button className="doc-btn doc-btn-secondary">
                        <Briefcase size={18} /> Bulk Import
                    </button>
                    <button className="doc-btn doc-btn-primary" onClick={() => setShowNewRequestModal(true)}>
                        <Plus size={18} /> New Request
                    </button>
                </div>
            </header>

            {/* Metrics Dashboard */}
            <div className="doc-metrics-grid">
                <MetricCard
                    title="Action Required"
                    value={reviewCount}
                    subtitle="Documents awaiting review"
                    icon={<AlertTriangle size={20} style={{ color: '#d97706' }} />}
                    colorClass="metric-amber"
                />
                <MetricCard
                    title="Pending Uploads"
                    value={pendingCount}
                    subtitle="Employees yet to respond"
                    icon={<Clock size={20} style={{ color: '#2563eb' }} />}
                    colorClass="metric-blue"
                />
                <MetricCard
                    title="Critical Items"
                    value={criticalCount}
                    subtitle="High priority requests"
                    icon={<ShieldCheck size={20} style={{ color: '#e11d48' }} />}
                    colorClass="metric-rose"
                />
                <MetricCard
                    title="Compliance Rate"
                    value="94%"
                    subtitle="Last 30 days"
                    icon={<CheckCircle size={20} style={{ color: '#059669' }} />}
                    colorClass="metric-emerald"
                />
            </div>

            {/* Main Content Area */}
            <div className="doc-content-area">
                {/* Toolbar */}
                <div className="doc-toolbar">
                    <div className="doc-tabs">
                        <button className={`doc-tab ${activeTab === 'admin_to_employee' ? 'active' : ''}`} onClick={() => setActiveTab('admin_to_employee')}>
                            From Employees
                        </button>
                        <button className={`doc-tab ${activeTab === 'employee_to_admin' ? 'active' : ''}`} onClick={() => setActiveTab('employee_to_admin')}>
                            For Employees
                        </button>
                    </div>

                    <div className="doc-search-box">
                        <Search className="doc-search-icon" size={18} />
                        <input
                            type="text"
                            className="doc-search-input"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="doc-table-wrapper">
                    <table className="doc-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {selectedIds.size > 0 && selectedIds.size === filteredRequests.length ? (
                                            <CheckSquare size={18} style={{ color: 'var(--brand-primary)' }} />
                                        ) : (
                                            <Square size={18} style={{ color: 'var(--text-secondary)' }} />
                                        )}
                                    </button>
                                </th>
                                <th>Employee</th>
                                <th>Document</th>
                                <th>Timeline</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                                    </td>
                                </tr>
                            ) : filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr
                                        key={req.id}
                                        className={selectedIds.has(req.id) ? 'selected' : ''}
                                        onClick={() => handleOpenReview(req)}
                                        style={{ cursor: req.document_file ? 'pointer' : 'default' }}
                                    >
                                        <td onClick={(e) => { e.stopPropagation(); toggleSelectRow(req.id); }}>
                                            {selectedIds.has(req.id) ? (
                                                <CheckSquare size={18} style={{ color: 'var(--brand-primary)' }} />
                                            ) : (
                                                <Square size={18} style={{ color: '#cbd5e1' }} />
                                            )}
                                        </td>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar">
                                                    {(req.employee_name || 'U').charAt(0)}
                                                </div>
                                                <div className="user-info">
                                                    <div className="name">{req.employee_name || 'Unknown'}</div>
                                                    <div className="role">{req.employee_code || 'ID: --'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                                                <span style={{ fontWeight: 500 }}>{req.document_type}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{req.reason}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                    <Calendar size={12} /> {new Date(req.created_at).toLocaleDateString()}
                                                </div>
                                                {req.due_date && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: new Date(req.due_date) < new Date() && req.status !== 'approved' ? '#dc2626' : 'var(--text-muted)' }}>
                                                        <Clock size={12} /> Due: {new Date(req.due_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <PriorityBadge priority={req.priority} />
                                        </td>
                                        <td>
                                            <StatusBadge status={req.status} direction={activeTab} hasFile={!!req.document_file} />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {req.document_file ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenReview(req); }}
                                                    className="doc-btn doc-btn-secondary"
                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                >
                                                    {req.status === 'approved' ? 'View' : 'Review'}
                                                </button>
                                            ) : activeTab === 'employee_to_admin' && req.status === 'pending' ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setShowUploadModal(true); }}
                                                    className="doc-btn doc-btn-primary"
                                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                >
                                                    Upload
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Waiting</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="doc-empty-state">No requests found matching your search.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Floating Bulk Action Bar --- */}
                {selectedIds.size > 0 && (
                    <div className="floating-bulk-bar">
                        <span style={{ fontWeight: 600 }}>{selectedIds.size} Selected</span>
                        <div style={{ height: '1rem', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => handleBulkAction('Approve')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <CheckCircle size={18} /> Approve
                            </button>
                            <button onClick={() => handleBulkAction('Remind')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <Bell size={18} /> Remind
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}

            {/* New Request Modal */}
            {showNewRequestModal && (
                <NewRequestModal
                    direction={activeTab}
                    employees={employees}
                    documentTypes={activeTab === 'admin_to_employee' ? ADMIN_REQUEST_TYPES : EMPLOYEE_REQUEST_TYPES}
                    onClose={() => setShowNewRequestModal(false)}
                    onSuccess={() => { setShowNewRequestModal(false); fetchRequests(); }}
                />
            )}

            {/* Upload Modal (for Admin responding to EMP requests) */}
            {showUploadModal && selectedRequest && (
                <UploadDocumentModal
                    request={selectedRequest}
                    onClose={() => { setShowUploadModal(false); setSelectedRequest(null); }}
                    onSuccess={() => { setShowUploadModal(false); fetchRequests(); }}
                />
            )}

            {/* Review Modal (The Main Feature) */}
            {showReviewModal && selectedRequest && (
                <div className="modal-overlay">
                    <div className="review-modal">
                        {/* Header */}
                        <div className="modal-header">
                            <div className="doc-req-title-group" style={{ marginBottom: 0 }}>
                                <h1>
                                    Review: {selectedRequest.document_type}
                                    <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '2px 8px', marginLeft: '12px' }}>
                                        {selectedRequest.employee_name}
                                    </span>
                                </h1>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck size={14} /> Secure View Active
                                </span>
                                <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="modal-split-body">
                            {/* Left: Document Viewer */}
                            <div className="doc-viewer-pane">
                                <div className="watermark">
                                    <div className="watermark-text">CONFIDENTIAL</div>
                                </div>
                                <div className="doc-render" style={{ display: 'flex', flexDirection: 'column' }}>
                                    {selectedRequest.document_file && selectedRequest.document_file.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={selectedRequest.document_file}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none', flex: 1 }}
                                            title="Document Preview"
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <img
                                                src={selectedRequest.document_file}
                                                alt="Document"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = 'Preview not supported or image failed to load'; }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ marginTop: '1rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                        <a href={selectedRequest.document_file} target="_blank" rel="noreferrer" className="doc-btn doc-btn-secondary" style={{ display: 'inline-flex' }}>
                                            <Download size={14} /> Download / Open
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Interaction Pane */}
                            <div className="interaction-pane">
                                <div className="interaction-tabs">
                                    <button onClick={() => setModalTab('checklist')} className={`interaction-tab ${modalTab === 'checklist' ? 'active' : ''}`}>Checklist</button>
                                    <button onClick={() => setModalTab('history')} className={`interaction-tab ${modalTab === 'history' ? 'active' : ''}`}>History</button>
                                    <button onClick={() => setModalTab('comments')} className={`interaction-tab ${modalTab === 'comments' ? 'active' : ''}`}>Chat</button>
                                </div>
                                <div className="tab-content">
                                    {modalTab === 'checklist' && (
                                        <div className="fade-in">
                                            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>Verification</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                                                <CheckboxItem label="Document is clearly visible" />
                                                <CheckboxItem label="Name matches employee record" />
                                                <CheckboxItem label="Document has not expired" />
                                                <CheckboxItem label="Issuing authority is valid" />
                                            </div>
                                            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Review Notes (Used for Rejection)</h3>
                                            <textarea id="reject-reason" style={{ width: '100%', height: '100px', padding: '0.8rem', fontSize: '0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-tertiary)', resize: 'none' }} placeholder="Add internal notes for rejection..." />
                                        </div>
                                    )}
                                    {modalTab === 'history' && (
                                        <div className="fade-in">
                                            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>Audit Trail</h3>
                                            {selectedRequest.audit_log.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {selectedRequest.audit_log.map((log, idx) => (
                                                        <div key={idx} className="timeline-item">
                                                            <div className="timeline-dot"></div>
                                                            <div className="timeline-content">
                                                                <div className="timeline-action">{log.action}</div>
                                                                <div className="timeline-date">{new Date(log.date).toLocaleString()}</div>
                                                                <div className="timeline-details"><span style={{ fontWeight: 600 }}>{log.user}:</span> {log.details}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <div style={{ color: 'var(--text-muted)' }}>No history events available.</div>}
                                        </div>
                                    )}
                                    {modalTab === 'comments' && (
                                        <div className="fade-in">
                                            {selectedRequest.comments.length > 0 ? selectedRequest.comments.map((c, i) => (
                                                <div key={i} className="comment-box">
                                                    <div className="comment-header"><span style={{ fontWeight: 'bold' }}>{c.user}</span><span>{new Date(c.date).toLocaleDateString()}</span></div>
                                                    <p className="comment-text">{c.text}</p>
                                                </div>
                                            )) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No comments yet.</div>}
                                            {/* Chat feature implementation is placeholder unless API supports it */}
                                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2rem' }}>Chat/Comment functionality requires backend integration.</div>
                                        </div>
                                    )}
                                </div>
                                <div className="interaction-footer">
                                    <button onClick={() => {
                                        const reason = document.getElementById('reject-reason')?.value || 'No reason provided';
                                        handleReject(selectedRequest.id, reason);
                                    }} className="doc-btn doc-btn-danger" style={{ justifyContent: 'center' }}>
                                        Reject
                                    </button>
                                    <button onClick={() => handleApprove(selectedRequest.id)} className="doc-btn doc-btn-primary" style={{ justifyContent: 'center' }}>
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helper Components & Modals ---

function MetricCard({ title, value, subtitle, icon, colorClass }) {
    return (
        <div className={`doc-metric-card ${colorClass}`}>
            <div className="doc-metric-info">
                <h3>{title}</h3>
                <div className="doc-metric-value">{value}</div>
                <div className="doc-metric-sub">{subtitle}</div>
            </div>
            <div className="doc-metric-icon">{icon}</div>
        </div>
    );
}

function StatusBadge({ status, direction, hasFile }) {
    let label = status;
    let className = `badge badge-status ${status}`;

    if (status === 'pending') {
        if (hasFile && direction === 'admin_to_employee') {
            label = 'Ready to Review';
            className = 'badge badge-status submitted';
        } else if (!hasFile && direction === 'admin_to_employee') {
            label = 'Pending Upload';
            className = 'badge badge-status pending';
        } else if (direction === 'employee_to_admin' && !hasFile) {
            label = 'Action Required';
            className = 'badge badge-status submitted';
        }
    }

    const icons = {
        pending: <Clock size={10} />,
        approved: <CheckCircle size={10} />,
        rejected: <XCircle size={10} />,
        submitted: <ArrowUpFromLine size={10} />
    };

    return (
        <span className={className}>
            {icons[status] || <Clock size={10} />} {label}
        </span>
    );
}

function PriorityBadge({ priority }) {
    return <span className={`badge badge-priority ${priority || 'medium'}`}>{priority?.toUpperCase() || 'NORMAL'}</span>;
}

function CheckboxItem({ label }) {
    const [checked, setChecked] = useState(false);
    return (
        <div className={`checklist-item ${checked ? 'checked' : ''}`} onClick={() => setChecked(!checked)}>
            <div className="checklist-box">{checked && <CheckCircle size={14} />}</div>
            <span className="checklist-label">{label}</span>
        </div>
    );
}

function NewRequestModal({ direction, employees, documentTypes, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ employee: '', document_type: '', reason: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createDocumentRequest({ ...formData, direction });
            onSuccess();
        } catch (err) {
            alert('Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="review-modal" style={{ maxWidth: '500px', height: 'auto', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h3>{direction === 'admin_to_employee' ? 'Request from Employee' : 'New Document'}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Employee</label>
                        <select
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            required
                            onChange={e => setFormData({ ...formData, employee: e.target.value })}
                        >
                            <option value="">Select...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Document Type</label>
                        <select
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            required
                            onChange={e => setFormData({ ...formData, document_type: e.target.value })}
                        >
                            <option value="">Select...</option>
                            {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Reason</label>
                        <textarea
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            required
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="doc-btn doc-btn-secondary">Cancel</button>
                        <button type="submit" className="doc-btn doc-btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UploadDocumentModal({ request, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('document_file', file);
            await submitDocumentForRequest(request.id, formData);
            onSuccess();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="review-modal" style={{ maxWidth: '500px', height: 'auto', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h3>Upload Document</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                        onClick={() => document.getElementById('file-upload').click()}
                        style={{ width: '100%', height: '150px', border: '2px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)' }}
                    >
                        <input id="file-upload" type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                        {file ? (
                            <>
                                <Paperclip size={32} style={{ color: 'var(--brand-primary)', marginBottom: '0.5rem' }} />
                                <span>{file.name}</span>
                            </>
                        ) : (
                            <>
                                <Upload size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Click to select file</span>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} className="doc-btn doc-btn-secondary">Cancel</button>
                        <button onClick={handleSubmit} className="doc-btn doc-btn-primary" disabled={!file || loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
