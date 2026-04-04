'use client';

import { useState, useEffect } from 'react';
import { expensesApi } from '@/api/expensesApi';
import {
  Check, X, Eye, FileText, Calendar, User, CheckCircle,
  Clock, DollarSign, ChevronRight, AlertCircle, CreditCard
} from 'lucide-react';
import './Approvals.css';

const Approvals = () => {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // Detail Modal
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(null); // claim id being acted upon

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendRes, approvedRes] = await Promise.all([
        expensesApi.getPendingApprovals(),
        expensesApi.getAllClaims({ status: 'approved' }),
      ]);
      setPendingClaims(Array.isArray(pendRes.data) ? pendRes.data : (pendRes.data.results || []));
      setApprovedClaims(Array.isArray(approvedRes.data) ? approvedRes.data : (approvedRes.data.results || []));
    } catch (err) {
      console.error('Failed to fetch claims', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await expensesApi.approveClaim(id, 'Approved');
      await fetchAll();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (claim) => {
    setRejectTarget(claim);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) { alert('Please enter a reason for rejection.'); return; }
    setRejectLoading(true);
    try {
      await expensesApi.rejectClaim(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      await fetchAll();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.error || err.message));
    } finally {
      setRejectLoading(false);
    }
  };

  const handlePay = async (id) => {
    if (!confirm('Mark this claim as Paid and notify the employee?')) return;
    setActionLoading(id);
    try {
      await expensesApi.payClaim(id);
      await fetchAll();
    } catch (err) {
      alert('Failed to mark as paid: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;

  const stageLabel = (stage) => {
    if (stage === 'level1') return 'Lvl 1 · Manager';
    if (stage === 'level2') return 'Lvl 2 · Finance';
    return 'Completed';
  };

  const claimsToShow = activeTab === 'pending' ? pendingClaims : approvedClaims;

  return (
    <div className="approvals-container">
      <div className="approvals-header">
        <div>
          <h1 className="approvals-title">Expense Approvals</h1>
          <p className="approvals-subtitle">Review, approve and disburse employee expense claims</p>
        </div>
        <div className="approvals-summary-pills">
          <span className="pill-badge orange"><Clock size={14} /> {pendingClaims.length} Pending</span>
          <span className="pill-badge green"><CheckCircle size={14} /> {approvedClaims.length} Awaiting Payment</span>
        </div>
      </div>

      <div className="approvals-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
          {pendingClaims.length > 0 && <span className="tab-count">{pendingClaims.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved — Awaiting Payment
          {approvedClaims.length > 0 && <span className="tab-count">{approvedClaims.length}</span>}
        </button>
      </div>

      <div className="approvals-content">
        {loading && claimsToShow.length === 0 ? (
          <div className="loading-state">Loading...</div>
        ) : claimsToShow.length > 0 ? (
          <div className="claims-grid">
            {claimsToShow.map((claim) => (
              <div key={claim.id} className="claim-approval-card">
                <div className="card-header">
                  <div className="employee-info">
                    <User size={15} />
                    <span>{claim.employee_name || 'Employee'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {activeTab === 'pending' && (
                      <span className={`stage-badge ${claim.current_stage}`}>
                        {stageLabel(claim.current_stage)}
                      </span>
                    )}
                    {activeTab === 'approved' && (
                      <span className="stage-badge completed">Finance Approved</span>
                    )}
                    <span className="amount-badge">{fmt(claim.amount)}</span>
                  </div>
                </div>

                <div className="card-body">
                  <h4 className="claim-title">{claim.title}</h4>
                  <div className="claim-details">
                    <div className="detail-item">
                      <FileText size={13} />
                      <span>{claim.category?.name || 'Uncategorized'}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={13} />
                      <span>{claim.claim_date || new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {claim.description && (
                    <p className="claim-desc">{claim.description}</p>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-detail" onClick={() => setSelectedClaim(claim)} title="View Details">
                    <Eye size={15} /> Details
                  </button>

                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => openRejectModal(claim)}
                        className="btn-reject"
                        disabled={actionLoading === claim.id}
                      >
                        <X size={15} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(claim.id)}
                        className="btn-approve"
                        disabled={actionLoading === claim.id}
                      >
                        {actionLoading === claim.id ? '...' : <><Check size={15} /> Approve</>}
                      </button>
                    </>
                  )}

                  {activeTab === 'approved' && (
                    <button
                      onClick={() => handlePay(claim.id)}
                      className="btn-pay"
                      disabled={actionLoading === claim.id}
                    >
                      {actionLoading === claim.id ? '...' : <><CreditCard size={15} /> Mark as Paid</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <CheckCircle size={48} className="empty-icon" />
            <h3>{activeTab === 'pending' ? 'All Caught Up!' : 'No Approved Claims Pending Payment'}</h3>
            <p>{activeTab === 'pending' ? 'No pending expense claims.' : 'All approved claims have been paid.'}</p>
          </div>
        )}
      </div>

      {/* ── Claim Detail Modal ───────────────────────── */}
      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal__header">
              <div>
                <h2>{selectedClaim.title}</h2>
                <p>{selectedClaim.employee_name} · {selectedClaim.category?.name}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedClaim(null)}><X size={18} /></button>
            </div>

            <div className="detail-modal__body">
              <div className="detail-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Amount</span>
                  <span className="meta-value amount-highlight">{fmt(selectedClaim.amount)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Claim Date</span>
                  <span className="meta-value">{selectedClaim.claim_date}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`meta-value status-chip ${selectedClaim.status}`}>{selectedClaim.status}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Stage</span>
                  <span className="meta-value">{stageLabel(selectedClaim.current_stage)}</span>
                </div>
              </div>

              {selectedClaim.description && (
                <div className="detail-description">
                  <p className="meta-label">Description</p>
                  <p>{selectedClaim.description}</p>
                </div>
              )}

              {selectedClaim.receipt && (
                <div style={{ margin: '12px 0' }}>
                  <a href={selectedClaim.receipt} target="_blank" rel="noopener noreferrer" className="receipt-link">
                    <FileText size={14} /> View Receipt
                  </a>
                </div>
              )}

              {/* Approval History Timeline */}
              <div className="history-section">
                <h4><ChevronRight size={16} /> Approval History</h4>
                {selectedClaim.approval_history && selectedClaim.approval_history.length > 0 ? (
                  <div className="timeline">
                    {selectedClaim.approval_history.map((entry, idx) => (
                      <div key={idx} className={`timeline-item ${entry.action}`}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-user">{entry.user}</span>
                            <span className={`timeline-action ${entry.action}`}>{entry.action.toUpperCase()}</span>
                          </div>
                          <p className="timeline-stage">Stage: {stageLabel(entry.stage)}</p>
                          {entry.comments && <p className="timeline-comment">"{entry.comments}"</p>}
                          <p className="timeline-time">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-history">No approval actions yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ──────────────────────── */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="reject-modal" onClick={e => e.stopPropagation()}>
            <div className="reject-modal__header">
              <AlertCircle size={20} />
              <h3>Reject Claim</h3>
              <button className="modal-close-btn" onClick={() => setRejectTarget(null)}><X size={16} /></button>
            </div>
            <div className="reject-modal__body">
              <p>You are about to reject: <strong>{rejectTarget.title}</strong></p>
              <label>Reason for Rejection <span style={{ color: 'red' }}>*</span></label>
              <textarea
                rows={4}
                placeholder="Enter the reason the employee will see in their email..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="reject-modal__footer">
              <button className="btn-cancel" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn-reject-confirm" onClick={handleConfirmReject} disabled={rejectLoading}>
                {rejectLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
