'use client';

import { useState, useEffect } from 'react';
import { expensesApi, mockClaims } from '@/api/expensesApi';
import './MyClaims.css';

const MyClaims = () => {

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.getMyClaims();
      setClaims(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) {
      console.error("Failed to fetch my claims, using mocks", err);
      setClaims(mockClaims);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClaims = claims.filter(claim =>
    (filterStatus === 'all' || claim.status === filterStatus) &&
    claim.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status, stage) => {
    if (status === 'rejected') return 'badge badge-rejected';
    if (status === 'paid') return 'badge badge-paid';

    if (stage === 'level1') return 'badge badge-pending'; // Manager
    if (stage === 'level2') return 'badge badge-process'; // Finance
    if (status === 'approved') return 'badge badge-approved'; // Ready for payment

    return 'badge badge-pending';
  };

  const getStatusText = (status, stage) => {
    if (status === 'rejected') return 'Rejected';
    if (status === 'paid') return 'Paid';
    if (status === 'approved') return 'Approved (Pending Payment)';

    if (stage === 'level1') return 'Pending Manager';
    if (stage === 'level2') return 'Pending Finance';

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (

    <div className="my-claims">

      <div className="claims-header">

        <h2>My Expense Claims</h2>

        <div className="claims-toolbar">

          <input
            type="text"
            placeholder="Search expense..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>

        </div>

      </div>

      <div className="claims-table-container">

        {loading && claims.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading claims...</div>
        ) : (
          <table className="claims-table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Workflow Stage</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredClaims.length > 0 ? (
                filteredClaims.map(claim => (
                  <tr key={claim.id}>

                    <td>{claim.title}</td>

                    <td>
                      <span className="category-pill">
                        {claim.category?.name || claim.category_name || 'N/A'}
                      </span>
                    </td>

                    <td className="amount">
                      ₹{parseFloat(claim.amount || 0).toLocaleString()}
                    </td>

                    <td>
                      {new Date(claim.claim_date || claim.created_at).toLocaleDateString()}
                    </td>

                    <td className="text-muted text-sm">
                      {claim.current_stage === 'level1' ? 'Level 1: Manager' :
                        claim.current_stage === 'level2' ? 'Level 2: Finance' : 'Completed'}
                    </td>

                    <td>
                      <span className={getStatusBadge(claim.status, claim.current_stage)}>
                        {getStatusText(claim.status, claim.current_stage)}
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No claims found.</td>
                </tr>
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>

  );

};

export default MyClaims;