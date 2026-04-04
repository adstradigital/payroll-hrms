'use client';

import { useState, useEffect, useMemo } from 'react';
import { expensesApi } from '@/api/expensesApi';
import { Download, PieChart, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const res = await expensesApi.getAllClaims();
        setClaims(Array.isArray(res.data) ? res.data : (res.data.results || []));
      } catch (err) {
        console.error("Failed to fetch claims for reports", err);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const stats = useMemo(() => {
    const approvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'paid');
    
    const total = claims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const approved = approvedClaims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const pending = claims.filter(c => c.status === 'pending').length;

    // Group by category (approved/paid only)
    const byCategory = approvedClaims.reduce((acc, c) => {
      const name = c.category?.name || 'Uncategorized';
      acc[name] = (acc[name] || 0) + parseFloat(c.amount || 0);
      return acc;
    }, {});

    // Group by month for Bar Chart (approved/paid only)
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    approvedClaims.forEach(c => {
      const d = new Date(c.claim_date || c.created_at);
      const m = months[d.getMonth()];
      monthlyData[m] = (monthlyData[m] || 0) + parseFloat(c.amount || 0);
    });

    const chartData = months.map(m => ({
      month: m,
      amount: monthlyData[m] || 0
    }));

    return { total, approved, pending, byCategory, chartData };
  }, [claims]);

  const handleExport = () => {
    if (claims.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ['ID', 'Employee', 'Title', 'Category', 'Amount', 'Date', 'Status', 'Stage'];
    const rows = claims.map(c => [
      c.id,
      `"${c.employee_name || 'N/A'}"`,
      `"${c.title}"`,
      `"${c.category?.name || 'Uncategorized'}"`,
      c.amount,
      c.claim_date,
      c.status,
      c.current_stage
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartMax = Math.max(...stats.chartData.map(d => d.amount), 1); // avoid div by 0

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Expense Reports</h1>
          <p className="reports-subtitle">Financial insights and expenditure analysis across the company</p>
        </div>
        <button onClick={handleExport} className="btn btn-outline">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading report data...</div>
      ) : (
        <>
          <div className="reports-stats-grid">
            <div className="report-stat-card">
              <div className="stat-icon purple"><DollarSign size={24} /></div>
              <div className="stat-info">
                <span className="label">Gross Requested</span>
                <h2 className="value">₹{stats.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
              </div>
            </div>
            <div className="report-stat-card">
              <div className="stat-icon green"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <span className="label">Approved Payouts</span>
                <h2 className="value">₹{stats.approved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
              </div>
            </div>
            <div className="report-stat-card">
              <div className="stat-icon orange"><Clock size={24} /></div>
              <div className="stat-info">
                <span className="label">Pending Claims</span>
                <h2 className="value">{stats.pending}</h2>
              </div>
            </div>
          </div>

          <div className="reports-main-grid">
            <div className="report-panel category-analysis">
              <div className="panel-header">
                <h3>Spend by Category (Approved)</h3>
                <PieChart size={20} />
              </div>
              <div className="category-list">
                {Object.entries(stats.byCategory).length > 0 ? (
                  Object.entries(stats.byCategory).map(([name, amount]) => (
                    <div key={name} className="category-item">
                      <div className="cat-info">
                        <span className="cat-name">{name}</span>
                        <span className="cat-amount">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(amount / stats.approved) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888', marginTop: '20px' }}>No approved claims found.</p>
                )}
              </div>
            </div>

            <div className="report-panel trend-analysis">
              <div className="panel-header">
                <h3>Monthly Approval Trends</h3>
                <TrendingUp size={20} />
              </div>
              <div className="bar-chart-container">
                {stats.chartData.map((d) => (
                  <div key={d.month} className="bar-column">
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${(d.amount / chartMax) * 100}%` }}
                        title={`₹${d.amount.toLocaleString('en-IN')}`}
                      ></div>
                    </div>
                    <span className="bar-label">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;