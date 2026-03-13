'use client';

import { useState, useEffect } from 'react';
import { mockClaims, reimbursementsApi } from '@/api/reimbursementsApi';
import './Approvals.css';

const Approvals = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setClaims(mockClaims.filter(c => c.status === 'pending'));
  }, []);

  const handleApprove = async (id) => {
    setLoading(true);
    try {
      // await reimbursementsApi.approveClaim(id);
      // Refresh list
      setClaims(claims.filter(c => c.id !== id));
    } catch (error) {
      console.error('Approve error', error);
    }
    setLoading(false);
  };

  const handleReject = async (id) => {
    setLoading(true);
    try {
      // await reimbursementsApi.rejectClaim(id);
      // Refresh list
      setClaims(claims.filter(c => c.id !== id));
    } catch (error) {
      console.error('Reject error', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'badge-pending',
    };
    return `badge ${classes[status] || 'badge-pending'}`;
  };

  return (
    <div className="approvals">

      <div className="approvals-header">
        <h2>Pending Expense Approvals</h2>
        <span className="pending-count">{claims.length} Requests</span>
      </div>

      {/* TOOLBAR */}

      <div className="approvals-toolbar">

        <input
          type="text"
          placeholder="Search employee or expense..."
          className="approval-search"
        />

        <select className="approval-filter">
          <option>All Categories</option>
          <option>Travel</option>
          <option>Food</option>
          <option>Office</option>
        </select>

      </div>

      {/* TABLE */}

      <div className="approvals-table-container">

        <table className="approvals-table">

          <thead>
            <tr>
              <th>Employee</th>
              <th>Expense</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {claims.map(claim => (

              <tr key={claim.id}>

                <td className="employee-cell">
                  <div className="avatar">JD</div>
                  <span>John Doe</span>
                </td>

                <td>{claim.title}</td>

                <td>
                  <span className="category-pill">
                    {claim.category.name}
                  </span>
                </td>

                <td className="amount">
                  ₹{claim.amount.toLocaleString()}
                </td>

                <td>
                  {new Date(claim.claim_date).toLocaleDateString()}
                </td>

                <td className="actions">

                  <button
                    onClick={() => handleApprove(claim.id)}
                    className="approve-btn"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(claim.id)}
                    className="reject-btn"
                  >
                    Reject
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Approvals;

