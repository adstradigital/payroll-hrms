'use client';

import { useState, useEffect } from 'react';
import { expensesApi } from '@/api/expensesApi';
import { Check, X, Eye, FileText, Calendar, User, CheckCircle } from 'lucide-react';
import './Approvals.css';

const Approvals = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.getPendingApprovals();
      setClaims(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id) => {
    try {
      await expensesApi.approveClaim(id);
      await fetchApprovals();
      alert('Claim moved to next stage or approved successfully');
    } catch (err) {
      console.error("Approve failed", err);
      alert('Failed to approve claim');
    }
  };

  const handleReject = async (id) => {
    try {
      await expensesApi.rejectClaim(id);
      setClaims(claims.filter(c => c.id !== id));
      alert('Claim rejected successfully');
    } catch (err) {
      console.error("Reject failed", err);
      alert('Failed to reject claim');
    }
  };

  return (
    <div className="approvals-container">
      <div className="approvals-header">
        <div>
          <h1 className="approvals-title">Expense Approvals</h1>
          <p className="approvals-subtitle">Review and manage employee expense claims</p>
        </div>
      </div>

      <div className="approvals-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </button>
      </div>

      <div className="approvals-content">
        {loading && claims.length === 0 ? (
          <div className="loading-state">Loading approvals...</div>
        ) : claims.length > 0 ? (
          <div className="claims-grid">
            {claims.map((claim) => (
              <div key={claim.id} className="claim-approval-card">
                <div className="card-header">
                  <div className="employee-info">
                    <User size={16} />
                    <span>{claim.employee_name || 'Employee'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`stage-badge ${claim.current_stage}`}>
                      {claim.current_stage === 'level1' ? 'Level 1: Manager' : 'Level 2: Finance'}
                    </span>
                    <span className="amount-badge">₹{parseFloat(claim.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="card-body">
                  <h4 className="claim-title">{claim.title}</h4>
                  <div className="claim-details">
                    <div className="detail-item">
                      <FileText size={14} />
                      <span>{claim.category?.name || claim.category_name || 'Uncategorized'}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={14} />
                      <span>{claim.claim_date || new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {claim.description && (
                    <p className="claim-desc">{claim.description}</p>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    onClick={() => handleReject(claim.id)}
                    className="btn-reject"
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(claim.id)}
                    className="btn-approve"
                  >
                    <Check size={16} />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <CheckCircle size={48} className="empty-icon" />
            <h3>All Caught Up!</h3>
            <p>No pending expense claims to approve.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
