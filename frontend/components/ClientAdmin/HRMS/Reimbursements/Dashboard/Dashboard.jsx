'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { mockClaims } from '@/api/reimbursementsApi';
import './Dashboard.css';

const ReimbursementDashboard = () => {

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const total = mockClaims.length;
    const pending = mockClaims.filter(c => c.status === 'pending').length;
    const approved = mockClaims.filter(c => c.status === 'approved').length;
    const rejected = mockClaims.filter(c => c.status === 'rejected').length;

    setStats({ total, pending, approved, rejected });
  }, []);

  const cards = [
    {
      title: "Total Claims",
      value: stats.total,
      icon: <FileText size={22}/>,
      class: "blue"
    },
    {
      title: "Pending Claims",
      value: stats.pending,
      icon: <Clock size={22}/>,
      class: "orange"
    },
    {
      title: "Approved Claims",
      value: stats.approved,
      icon: <CheckCircle size={22}/>,
      class: "green"
    },
    {
      title: "Rejected Claims",
      value: stats.rejected,
      icon: <XCircle size={22}/>,
      class: "red"
    }
  ];

  const formatCurrency = (value) =>
    typeof value === 'number'
      ? value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })
      : value;

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-badge--approved';
      case 'rejected':
        return 'status-badge status-badge--rejected';
      default:
        return 'status-badge status-badge--pending';
    }
  };

  // 🔎 Search + Filter logic
  const filteredClaims = mockClaims.filter((claim) => {
    const matchSearch = claim.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === '' || claim.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="reimbursement-dashboard">

      <div className="reimb-header">
        <div>
          <p className="reimb-header__label">Expense Insights</p>
          <h2 className="reimb-header__title">Reimbursements Overview</h2>
          <p className="reimb-header__subtitle">
            Monitor claim volumes, approval velocity, and pending workloads in real time.
          </p>
        </div>
      </div>

      {/* Stats Cards */}

      <div className="reimb-stats-grid">
        {cards.map((card, index) => (
          <div className="reimb-card" key={index}>
            <div className={`reimb-card__icon ${card.class}`}>
              {card.icon}
            </div>
            <div className="reimb-card__content">
              <span className="reimb-card__label">{card.title}</span>
              <div className="reimb-card__value-row">
                <h2 className="reimb-card__value">{card.value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="reimb-panels">

        {/* Claims Table */}

        <div className="reimb-panel">

          <div className="reimb-panel__header">
            <div>
              <p className="reimb-panel__label">Claims</p>
              <h3 className="reimb-panel__title">Recent Claims Activity</h3>
            </div>
          </div>

          {/* Search + Filter + Button */}

          <div className="claims-actions">

            <input
              type="text"
              placeholder="Search claims..."
              className="claims-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="claims-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button className="new-claim-btn">
              + New Claim
            </button>

          </div>

          <div className="claims-table__wrapper">
            <table className="claims-table">

              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Claim Date</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>

                    <td>
                      <div className="claim-title">
                        <FileText size={14} /> {claim.title}
                      </div>
                    </td>

                    <td>{claim.category?.name || '-'}</td>

                    <td className="claims-amount">
                      {formatCurrency(claim.amount)}
                    </td>

                    <td>{claim.claim_date}</td>

                    <td>
                      <span className={getStatusClass(claim.status)}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </span>
                    </td>

                    <td>{claim.created_at}</td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>

        {/* Right Side Summary */}

        <div className="reimb-side">

          <div className="summary-card">

            <div className="summary-card__header">
              <TrendingUp size={18} />
              <div>
                <p className="summary-card__label">Throughput</p>
                <h4 className="summary-card__title">Approval Snapshot</h4>
              </div>
            </div>

            <div className="summary-metrics">

              <div className="summary-metric">
                <span className="summary-metric__label">Approval rate</span>
                <span className="summary-metric__value">
                  {stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </span>
              </div>

              <div className="summary-metric">
                <span className="summary-metric__label">Pending share</span>
                <span className="summary-metric__value">
                  {stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%
                </span>
              </div>

              <div className="summary-metric">
                <span className="summary-metric__label">Rejection rate</span>
                <span className="summary-metric__value">
                  {stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ReimbursementDashboard;