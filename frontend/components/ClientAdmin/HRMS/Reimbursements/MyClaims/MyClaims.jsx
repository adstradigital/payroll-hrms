'use client';

import { useState, useEffect } from 'react';
import { mockClaims } from '@/api/reimbursementsApi';
import './MyClaims.css';

const MyClaims = () => {

  const [claims,setClaims] = useState([]);
  const [filterStatus,setFilterStatus] = useState('all');
  const [search,setSearch] = useState('');

  useEffect(()=>{
    setClaims(mockClaims);
  },[]);

  const filteredClaims = claims.filter(claim =>
    (filterStatus === 'all' || claim.status === filterStatus) &&
    claim.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status)=>{
    const classes = {
      pending:'badge-pending',
      approved:'badge-approved',
      rejected:'badge-rejected'
    };
    return `badge ${classes[status]}`;
  };

  return(

    <div className="my-claims">

      <div className="claims-header">

        <h2>My Expense Claims</h2>

        <div className="claims-toolbar">

          <input
            type="text"
            placeholder="Search expense..."
            className="search-input"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />

          <select
            value={filterStatus}
            onChange={(e)=>setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

        </div>

      </div>

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

            {filteredClaims.map(claim=>(
              <tr key={claim.id}>

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

                <td>
                  <span className={getStatusBadge(claim.status)}>
                    {claim.status}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default MyClaims;