'use client';

import { useState, useEffect, useMemo } from 'react';
import { expensesApi, mockClaims } from '@/api/expensesApi';
import { Download, Filter, BarChart2, PieChart, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const res = await expensesApi.getMyClaims();
        setClaims(Array.isArray(res.data) ? res.data : (res.data.results || []));
      } catch (err) {
        console.error("Failed to fetch claims for reports", err);
        setClaims(mockClaims);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const stats = useMemo(() => {
    const total = claims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const approved = claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const pending = claims.filter(c => c.status === 'pending').length;

    // Group by category
    const byCategory = claims.reduce((acc, c) => {
      const name = c.category?.name || 'Uncategorized';
      acc[name] = (acc[name] || 0) + parseFloat(c.amount || 0);
      return acc;
    }, {});

    return { total, approved, pending, byCategory };
  }, [claims]);

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Expense Reports</h1>
          <p className="reports-subtitle">Financial insights and expenditure analysis</p>
        </div>
        <button className="btn btn-outline">
          <Download size={18} />
          Export Data
        </button>
      </div>

      <div className="reports-stats-grid">
        <div className="report-stat-card">
          <div className="stat-icon purple"><DollarSign size={24} /></div>
          <div className="stat-info">
            <span className="label">Total Expenditure</span>
            <h2 className="value">₹{stats.total.toLocaleString()}</h2>
          </div>
        </div>
        <div className="report-stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="label">Approved Payouts</span>
            <h2 className="value">₹{stats.approved.toLocaleString()}</h2>
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
            <h3>Expenditure by Category</h3>
            <PieChart size={20} />
          </div>
          <div className="category-list">
            {Object.entries(stats.byCategory).map(([name, amount]) => (
              <div key={name} className="category-item">
                <div className="cat-info">
                  <span className="cat-name">{name}</span>
                  <span className="cat-amount">₹{amount.toLocaleString()}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(amount / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-panel trend-analysis">
          <div className="panel-header">
            <h3>Spend Trends</h3>
            <TrendingUp size={20} />
          </div>
          <div className="trend-placeholder">
            <BarChart2 size={48} />
            <p>Spending trend visualization for the current quarter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;