'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockCategories, mockClaims } from '@/api/reimbursementsApi';
import {
  Plus, FileText, CheckCircle, Clock,
  ClipboardList, LayoutGrid, List, X, Upload
} from 'lucide-react';
import './SubmitExpense.css';

const SubmitExpense = () => {
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [submittedClaims, setSubmittedClaims] = useState([]);

  useEffect(() => {
    setCategories(mockCategories);
    setSubmittedClaims(mockClaims);
  }, []);

  const stats = useMemo(() => {
    const total = submittedClaims.length;
    const pending = submittedClaims.filter(c => c.status === 'pending').length;
    const approved = submittedClaims.filter(c => c.status === 'approved').length;
    return { total, pending, approved };
  }, [submittedClaims]);

  const filteredClaims = submittedClaims
    .filter((claim) => claim.title.toLowerCase().includes(search.toLowerCase()))
    .filter((claim) => (filter ? claim.status === filter : true));

  const getStatusBadge = (status) => {
    const classes = status === 'pending' ? 'badge-warning' : status === 'approved' ? 'badge-success' : 'badge-danger';
    return `badge ${classes}`;
  };

  return (
    <div className="expense-container">
      {/* HEADER */}
      <div className="expense-header">
        <div>
          <p className="expense-subtitle">Reimbursements · Management</p>
          <h1 className="expense-title">Expense Claims</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Claim</span>
        </button>
      </div>

      {/* STATS */}
      <div className="expense-stats">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon"><ClipboardList size={22} /></div>
          <div className="stat-card__content">
            <div className="stat-card__value">{stats.total}</div>
            <div className="stat-card__label">Total Claims</div>
          </div>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon"><Clock size={22} /></div>
          <div className="stat-card__content">
            <div className="stat-card__value">{stats.pending}</div>
            <div className="stat-card__label">Pending Review</div>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__icon"><CheckCircle size={22} /></div>
          <div className="stat-card__content">
            <div className="stat-card__value">{stats.approved}</div>
            <div className="stat-card__label">Approved</div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="claims-toolbar">
        <div className='claims-box'>
          <div className="search-box">
            <FileText size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <select className="claims-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="view-toggle">
          <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
            <List size={18} />
          </button>
          <button className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="claims-content">
        {viewMode === 'list' ? (
          <div className="claims-table-container">
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td><span className="claim-name">{claim.title}</span></td>
                    <td><span className="pill">{claim.category?.name}</span></td>
                    <td className="amount">₹{parseFloat(claim.amount || 0).toLocaleString()}</td>
                    <td>{claim.claim_date || new Date(claim.created_at).toLocaleDateString()}</td>
                    <td><span className={getStatusBadge(claim.status)}>{claim.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="claims-grid">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="claim-card">
                <div className="claim-card-header">
                  <div>
                    <h4>{claim.title}</h4>
                    <p className="claim-category">{claim.category?.name}</p>
                  </div>
                  <span className={getStatusBadge(claim.status)}>{claim.status}</span>
                </div>
                <div className="claim-meta">
                  <div><span>Amount</span><b>₹{parseFloat(claim.amount).toLocaleString()}</b></div>
                  <div><span>Date</span><b>{claim.claim_date}</b></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW CLAIM MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">

            <div className="modal-top">
              <h2>Add Claim</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">

              <div className="form-section">
                <p className="section-title">BASIC INFORMATION</p>

                <div className="form-group">
                  <label>Expense Title *</label>
                  <input type="text" placeholder="Client Dinner" />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select>
                    {categories.map(cat => (
                      <option key={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <p className="section-title">EXPENSE DETAILS</p>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount *</label>
                    <input type="number" placeholder="₹ 0.00" />
                  </div>

                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Receipt</label>
                  <input type="file" />
                </div>

              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>

              <button className="btn btn-primary">
                Create Claim
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitExpense;