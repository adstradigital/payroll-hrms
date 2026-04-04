'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Banknote, Clock, CheckCircle, XCircle, AlertCircle,
    Loader2, RefreshCcw, ChevronDown, X, Search,
    Calendar, DollarSign, TrendingUp, Users, Filter
} from 'lucide-react';
import {
    getEncashmentEligibility,
    getLeaveEncashments,
    requestLeaveEncashment,
    processLeaveEncashment,
} from '@/api/api_clientadmin';
import { usePermissions } from '@/context/PermissionContext';
import './LeaveEncashment.css';

const STATUS_CONFIG = {
    pending:  { label: 'Pending',  color: 'amber',  icon: Clock },
    approved: { label: 'Approved', color: 'blue',   icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'red',    icon: XCircle },
    paid:     { label: 'Paid',     color: 'green',  icon: Banknote },
};

export default function LeaveEncashment({ currentUser }) {
    const { isAdmin } = usePermissions();

    /* ─── State ─────────────────────────────────────────────── */
    const [encashments, setEncashments]       = useState([]);
    const [eligibility, setEligibility]       = useState([]);
    const [loading, setLoading]               = useState(true);
    const [eligLoading, setEligLoading]       = useState(false);
    const [showModal, setShowModal]           = useState(false);
    const [processing, setProcessing]         = useState(null); // id being processed
    const [rejectModal, setRejectModal]       = useState(null); // { id, reason }
    const [searchTerm, setSearchTerm]         = useState('');
    const [statusFilter, setStatusFilter]     = useState('');
    const [isEnabled, setIsEnabled]           = useState(true);
    const [disabledMsg, setDisabledMsg]       = useState('');

    /* Modal form */
    const [form, setForm] = useState({
        leave_type: '',
        days_encashed: '',
        remarks: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError]   = useState('');

    const employeeId = currentUser?.id || currentUser?.employee_id;

    /* ─── Fetch Data ─────────────────────────────────────────── */
    const fetchEncashments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (!isAdmin && employeeId) params.employee = employeeId;
            if (statusFilter) params.status = statusFilter;
            const res = await getLeaveEncashments(params);
            setEncashments(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Error fetching encashments:', err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, employeeId, statusFilter]);

    const fetchEligibility = useCallback(async () => {
        if (!employeeId) return;
        setEligLoading(true);
        try {
            const res = await getEncashmentEligibility({ employee: employeeId });
            if (res.data.is_enabled === false) {
                setIsEnabled(false);
                setDisabledMsg(res.data.message || 'Leave encashment is currently disabled.');
                setEligibility([]);
            } else {
                setIsEnabled(true);
                setEligibility(res.data.eligibility || []);
            }
        } catch (err) {
            console.error('Error fetching eligibility:', err);
        } finally {
            setEligLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        fetchEncashments();
    }, [fetchEncashments]);

    useEffect(() => {
        fetchEligibility();
    }, [fetchEligibility]);

    /* ─── Computed values ───────────────────────────────────── */
    const selectedLeaveType = eligibility.find(e => String(e.leave_type_id) === String(form.leave_type));
    const estimatedPayout = selectedLeaveType && form.days_encashed
        ? (parseFloat(form.days_encashed) * selectedLeaveType.daily_rate).toFixed(2)
        : null;

    const filtered = encashments.filter(e => {
        if (!searchTerm) return true;
        const name = (e.employee_name || '').toLowerCase();
        const empId = (e.employee_id_display || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || empId.includes(searchTerm.toLowerCase());
    });

    const stats = {
        pending:  encashments.filter(e => e.status === 'pending').length,
        approved: encashments.filter(e => e.status === 'approved').length,
        paid:     encashments.filter(e => e.status === 'paid').length,
        totalPendingAmt: encashments
            .filter(e => e.status === 'pending')
            .reduce((s, e) => s + parseFloat(e.total_amount || 0), 0),
    };

    /* ─── Handlers ──────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.leave_type) { setFormError('Please select a leave type.'); return; }
        const days = parseFloat(form.days_encashed);
        if (!days || days <= 0) { setFormError('Please enter a valid number of days.'); return; }
        if (selectedLeaveType && days > selectedLeaveType.available_days) {
            setFormError(`You only have ${selectedLeaveType.available_days} days available.`); return;
        }
        try {
            setSubmitting(true);
            await requestLeaveEncashment({
                employee: employeeId,
                leave_type: form.leave_type,
                days_encashed: days,
                year: new Date().getFullYear(),
                remarks: form.remarks,
            });
            setShowModal(false);
            setForm({ leave_type: '', days_encashed: '', remarks: '' });
            await fetchEncashments();
            await fetchEligibility();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleProcess = async (id, action, reason = '') => {
        setProcessing(id);
        try {
            await processLeaveEncashment(id, { action, rejection_reason: reason });
            await fetchEncashments();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} encashment.`);
        } finally {
            setProcessing(null);
            setRejectModal(null);
        }
    };

    /* ─── Render ─────────────────────────────────────────────── */
    return (
        <div className="le-root">

            {/* ── Stats Row ──────────────────────────────────── */}
            <div className="le-stats-row">
                <div className="le-stat-card le-stat-amber">
                    <div className="le-stat-icon"><Clock size={22} /></div>
                    <div>
                        <div className="le-stat-label">Pending Requests</div>
                        <div className="le-stat-value">{stats.pending}</div>
                    </div>
                </div>
                <div className="le-stat-card le-stat-blue">
                    <div className="le-stat-icon"><CheckCircle size={22} /></div>
                    <div>
                        <div className="le-stat-label">Approved</div>
                        <div className="le-stat-value">{stats.approved}</div>
                    </div>
                </div>
                <div className="le-stat-card le-stat-green">
                    <div className="le-stat-icon"><Banknote size={22} /></div>
                    <div>
                        <div className="le-stat-label">Paid Out</div>
                        <div className="le-stat-value">{stats.paid}</div>
                    </div>
                </div>
                <div className="le-stat-card le-stat-purple">
                    <div className="le-stat-icon"><DollarSign size={22} /></div>
                    <div>
                        <div className="le-stat-label">Pending Payout</div>
                        <div className="le-stat-value">₹{stats.totalPendingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                </div>
            </div>

            {/* ── Eligibility Cards (employee view) ─────────── */}
            {!isAdmin && (
                <div className="le-section">
                    <div className="le-section-header">
                        <h3 className="le-section-title">
                            <TrendingUp size={18} /> Your Encashable Leaves
                        </h3>
                        {isEnabled && (
                            <button className="le-btn le-btn-primary" onClick={() => setShowModal(true)}
                                disabled={eligibility.length === 0}>
                                <Banknote size={16} /> Request Encashment
                            </button>
                        )}
                    </div>

                    {!isEnabled ? (
                        <div className="le-disabled-banner">
                            <AlertCircle size={24} />
                            <div>
                                <h4>Feature Currently Disabled</h4>
                                <p>{disabledMsg}</p>
                            </div>
                        </div>
                    ) : eligLoading ? (
                        <div className="le-center"><Loader2 className="le-spin" size={28} /></div>
                    ) : eligibility.length === 0 ? (
                        <div className="le-empty-card">
                            <AlertCircle size={36} />
                            <p>No encashable leave types found. Contact your admin to enable encashment for your leave types.</p>
                        </div>
                    ) : (
                        <div className="le-elig-grid">
                            {eligibility.map(e => (
                                <div key={e.leave_type_id} className="le-elig-card">
                                    <div className="le-elig-badge">{e.leave_type_code || e.leave_type_name}</div>
                                    <div className="le-elig-name">{e.leave_type_name}</div>
                                    <div className="le-elig-days">{e.available_days} <span>days available</span></div>
                                    <div className="le-elig-rate">₹{e.daily_rate.toLocaleString('en-IN')}/day</div>
                                    <div className="le-elig-est">
                                        Max payout ≈ <strong>₹{e.estimated_amount.toLocaleString('en-IN')}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Toolbar ───────────────────────────────────── */}
            <div className="le-toolbar">
                <div className="le-toolbar-left">
                    {isAdmin && (
                        <div className="le-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search employee…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                id="le-search"
                            />
                        </div>
                    )}
                    <div className="le-filter-box">
                        <Filter size={16} />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="le-status-filter">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>
                {isAdmin && (
                    <button className="le-btn le-btn-secondary" onClick={fetchEncashments}>
                        <RefreshCcw size={15} /> Refresh
                    </button>
                )}
                {!isAdmin && (
                    <button className="le-btn le-btn-primary" onClick={() => setShowModal(true)}
                        disabled={eligibility.length === 0}>
                        <Banknote size={16} /> New Request
                    </button>
                )}
            </div>

            {/* ── Table ─────────────────────────────────────── */}
            <div className="le-table-wrapper">
                {loading ? (
                    <div className="le-center"><Loader2 className="le-spin" size={36} /></div>
                ) : filtered.length === 0 ? (
                    <div className="le-empty-state">
                        <Banknote size={48} />
                        <p>No encashment records found.</p>
                        {!isAdmin && (
                            <button className="le-btn le-btn-primary" onClick={() => setShowModal(true)} disabled={eligibility.length === 0}>
                                Request Your First Encashment
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="le-table">
                        <thead>
                            <tr>
                                {isAdmin && <th>Employee</th>}
                                <th>Leave Type</th>
                                <th>Year</th>
                                <th className="le-text-right">Days</th>
                                <th className="le-text-right">Daily Rate</th>
                                <th className="le-text-right">Payout</th>
                                <th>Status</th>
                                <th>Date</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(enc => {
                                const cfg = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pending;
                                const Icon = cfg.icon;
                                const isProc = processing === enc.id;
                                return (
                                    <tr key={enc.id}>
                                        {isAdmin && (
                                            <td>
                                                <div className="le-emp-pill">
                                                    <div className="le-emp-avatar">{(enc.employee_name || 'E')[0]}</div>
                                                    <div>
                                                        <div className="le-emp-name">{enc.employee_name}</div>
                                                        <div className="le-emp-id">{enc.employee_id_display}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <span className="le-type-badge">{enc.leave_type_name}</span>
                                        </td>
                                        <td>{enc.year}</td>
                                        <td className="le-text-right le-font-bold">{parseFloat(enc.days_encashed).toFixed(1)}</td>
                                        <td className="le-text-right">₹{parseFloat(enc.daily_rate).toLocaleString('en-IN')}</td>
                                        <td className="le-text-right le-font-bold le-text-green">
                                            ₹{parseFloat(enc.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td>
                                            <span className={`le-status-badge le-status-${cfg.color}`}>
                                                <Icon size={13} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="le-text-muted">
                                            {new Date(enc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <div className="le-actions">
                                                    {enc.status === 'pending' && (
                                                        <>
                                                            <button
                                                                className="le-action-btn le-action-approve"
                                                                onClick={() => handleProcess(enc.id, 'approve')}
                                                                disabled={isProc}
                                                                title="Approve"
                                                            >
                                                                {isProc ? <Loader2 size={14} className="le-spin" /> : <CheckCircle size={14} />}
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="le-action-btn le-action-reject"
                                                                onClick={() => setRejectModal({ id: enc.id, reason: '' })}
                                                                disabled={isProc}
                                                                title="Reject"
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {enc.status === 'approved' && (
                                                        <button
                                                            className="le-action-btn le-action-paid"
                                                            onClick={() => handleProcess(enc.id, 'mark_paid')}
                                                            disabled={isProc}
                                                            title="Mark as Paid"
                                                        >
                                                            {isProc ? <Loader2 size={14} className="le-spin" /> : <Banknote size={14} />}
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    {['rejected', 'paid'].includes(enc.status) && (
                                                        <span className="le-text-muted le-text-sm">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Request Modal ──────────────────────────────── */}
            {showModal && (
                <div className="le-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="le-modal" onClick={e => e.stopPropagation()}>
                        <div className="le-modal-header">
                            <h2><Banknote size={20} /> Request Leave Encashment</h2>
                            <button className="le-modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="le-modal-body">
                            {formError && (
                                <div className="le-alert le-alert-error">
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}

                            <div className="le-form-group">
                                <label htmlFor="le-modal-leave-type">Leave Type</label>
                                <select
                                    id="le-modal-leave-type"
                                    value={form.leave_type}
                                    onChange={e => setForm(f => ({ ...f, leave_type: e.target.value, days_encashed: '' }))}
                                    required
                                >
                                    <option value="">Select encashable leave type…</option>
                                    {eligibility.map(e => (
                                        <option key={e.leave_type_id} value={e.leave_type_id}>
                                            {e.leave_type_name} ({e.available_days} days available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedLeaveType && (
                                <div className="le-info-card">
                                    <div className="le-info-row">
                                        <span>Available Balance</span>
                                        <strong>{selectedLeaveType.available_days} days</strong>
                                    </div>
                                    <div className="le-info-row">
                                        <span>Daily Rate</span>
                                        <strong>₹{selectedLeaveType.daily_rate.toLocaleString('en-IN')}</strong>
                                    </div>
                                </div>
                            )}

                            <div className="le-form-group">
                                <label htmlFor="le-modal-days">Days to Encash</label>
                                <input
                                    id="le-modal-days"
                                    type="number"
                                    min="0.5"
                                    max={selectedLeaveType?.available_days || undefined}
                                    step="0.5"
                                    placeholder="e.g. 5"
                                    value={form.days_encashed}
                                    onChange={e => setForm(f => ({ ...f, days_encashed: e.target.value }))}
                                    required
                                />
                            </div>

                            {estimatedPayout && (
                                <div className="le-payout-preview">
                                    <span>Estimated Payout</span>
                                    <span className="le-payout-amount">₹{parseFloat(estimatedPayout).toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            <div className="le-form-group">
                                <label htmlFor="le-modal-remarks">Remarks <span className="le-optional">(optional)</span></label>
                                <textarea
                                    id="le-modal-remarks"
                                    rows={3}
                                    placeholder="Any additional notes…"
                                    value={form.remarks}
                                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                                />
                            </div>

                            <div className="le-modal-footer">
                                <button type="button" className="le-btn le-btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="le-btn le-btn-primary" disabled={submitting}>
                                    {submitting ? <><Loader2 size={16} className="le-spin" /> Submitting…</> : <><Banknote size={16} /> Submit Request</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ───────────────────────────────── */}
            {rejectModal && (
                <div className="le-modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="le-modal le-modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="le-modal-header">
                            <h2><XCircle size={20} /> Reject Encashment</h2>
                            <button className="le-modal-close" onClick={() => setRejectModal(null)}><X size={20} /></button>
                        </div>
                        <div className="le-modal-body">
                            <div className="le-form-group">
                                <label htmlFor="le-reject-reason">Reason for rejection</label>
                                <textarea
                                    id="le-reject-reason"
                                    rows={4}
                                    placeholder="Provide a reason…"
                                    value={rejectModal.reason}
                                    onChange={e => setRejectModal(r => ({ ...r, reason: e.target.value }))}
                                />
                            </div>
                            <div className="le-modal-footer">
                                <button className="le-btn le-btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
                                <button
                                    className="le-btn le-btn-danger"
                                    onClick={() => handleProcess(rejectModal.id, 'reject', rejectModal.reason)}
                                    disabled={processing === rejectModal.id}
                                >
                                    {processing === rejectModal.id
                                        ? <><Loader2 size={16} className="le-spin" /> Rejecting…</>
                                        : <><XCircle size={16} /> Confirm Reject</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
