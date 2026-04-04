'use client';

import { useState, useEffect, useMemo } from 'react';
import { expensesApi } from '@/api/expensesApi';
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
  const [loading, setLoading] = useState(false);

  // Quick Add Category State
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [categories, setCategories] = useState([]);
  const [submittedClaims, setSubmittedClaims] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receipt: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, claimRes] = await Promise.all([
        expensesApi.getCategories(),
        expensesApi.getMyClaims()
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data.results || []));
      setSubmittedClaims(Array.isArray(claimRes.data) ? claimRes.data : (claimRes.data.results || []));
    } catch (err) {
      console.error("Failed to fetch data, falling back to mocks", err);
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error status:", err.response.status);
      }
      setCategories([]);
      setSubmittedClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'receipt') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await expensesApi.createCategory({ name: newCategoryName.trim(), description: 'Added from Submit Claim form' });
      const newCat = res.data;
      setCategories(prev => [...prev, newCat]);
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      setIsQuickAdd(false);
      setNewCategoryName('');
    } catch (err) {
      console.error("Failed to create category", err);
      alert('Failed to create category: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category_id) {
      alert('Please fill title, amount and category');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: formData.title,
        amount: formData.amount,
        claim_date: formData.date,
        description: formData.description || formData.title, // Use title as fallback description
        category_id: formData.category_id,
        receipt: formData.receipt
      };

      const res = await expensesApi.submitClaim(submitData);
      setSubmittedClaims(prev => [res.data, ...prev]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receipt: null
      });
      alert('Claim submitted successfully!');
    } catch (err) {
      console.error("Submission failed", err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert('Failed to submit claim: ' + errorMsg);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-container">
      {/* HEADER */}
      <div className="expense-header">
        <div>
          <p className="expense-subtitle">Expense Management</p>
          <h1 className="expense-title">Expense Claims</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Claim</span>
        </button>
      </div>

      {loading && submittedClaims.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading expense claims...</div>
      ) : (
        <>
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
                    {filteredClaims.length > 0 ? (
                      filteredClaims.map((claim) => (
                        <tr key={claim.id}>
                          <td><span className="claim-name">{claim.title}</span></td>
                          <td><span className="pill">{claim.category?.name || 'N/A'}</span></td>
                          <td className="amount">₹{parseFloat(claim.amount || 0).toLocaleString()}</td>
                          <td>{claim.claim_date || new Date(claim.created_at).toLocaleDateString()}</td>
                          <td><span className={getStatusBadge(claim.status)}>{claim.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No claims found.</td>
                      </tr>
                    )}
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
                        <p className="claim-category">{claim.category?.name || 'N/A'}</p>
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
        </>
      )}

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

            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                <div className="form-section">
                  <p className="section-title">BASIC INFORMATION</p>

                  <div className="form-group">
                    <label>Expense Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Travel to Client Site"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Category *</label>
                      {!isQuickAdd && (
                        <button 
                          type="button" 
                          onClick={() => setIsQuickAdd(true)}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                        >
                          + Quick Add
                        </button>
                      )}
                    </div>
                    
                    {isQuickAdd ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="New Category Name..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={handleQuickAddCategory}
                          disabled={savingCategory || !newCategoryName.trim()}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          {savingCategory ? '...' : 'Save'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setIsQuickAdd(false); setNewCategoryName(''); }}
                          className="btn btn-outline"
                          style={{ padding: '8px 12px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <p className="section-title">EXPENSE DETAILS</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount *</label>
                      <input
                        type="number"
                        name="amount"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter more details about this expense..."
                      rows="3"
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Receipt</label>
                    <input
                      type="file"
                      name="receipt"
                      onChange={handleInputChange}
                    />
                  </div>

                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Create Claim'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitExpense;