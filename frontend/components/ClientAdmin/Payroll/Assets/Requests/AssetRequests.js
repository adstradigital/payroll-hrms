'use client';

import { useState, useEffect } from 'react';
import {
    Send, CheckCircle2, XCircle, Clock,
    Plus, User, Box, MessageSquare, Filter,
    Search, ArrowUpRight, Calendar
} from 'lucide-react';
import { 
    getAssetRequests, createAssetRequest, 
    getAssetCategories, createAssetCategory 
} from '@/api/api_clientadmin';
import './AssetRequests.css';

const INITIAL_FORM_DATA = { asset_type: '', asset_name: '', priority: 'medium', reason: '', needed_by: '' };

export default function AssetRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const resp = await getAssetCategories();
            setCategories(resp.data.results || resp.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleQuickAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            setSavingCategory(true);
            await createAssetCategory({ name: newCategoryName });
            setNewCategoryName('');
            setShowQuickAdd(false);
            fetchCategories();
        } catch (error) {
            console.error('Error adding category:', error);
        } finally {
            setSavingCategory(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await getAssetRequests();
            const data = response.data.results || response.data;
            setRequests(data);

            // Calculate stats
            setStats({
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                approved: data.filter(r => r.status === 'approved').length
            });
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAssetRequest(formData);
            setFormData(INITIAL_FORM_DATA);
            setShowRequestForm(false);
            fetchRequests();
        } catch (error) {
            console.error('Error creating request:', error);
        }
    };

    const handleCloseRequestForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setShowRequestForm(false);
    };

    const filteredRequests = requests.filter(req => {
        const matchesTab = activeTab === 'all' ? true : req.status === activeTab;
        const matchesSearch = req.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="asset-requests">
            <div className="ar-dashboard-header">
                <div className="ar-dashboard-copy">
                    <span className="ar-dashboard-kicker">Assets Dashboard</span>
                    <h2>Asset Requests</h2>
                    <p>Track request volume, pending approvals, and submit a new asset request from one place.</p>
                </div>
                {!showRequestForm && (
                    <button
                        type="button"
                        className="ar-btn-primary ar-btn-primary--compact"
                        onClick={() => setShowRequestForm(true)}
                    >
                        Submit New Request
                    </button>
                )}
            </div>

            <div className="ar-stats-grid">
                <div className="ar-mini-stat">
                    <div className="ar-mini-stat-info">
                        <span className="label">Total Requests</span>
                        <span className="value">{stats.total}</span>
                    </div>
                    <div className="ar-mini-stat-icon blue"><Send size={20} /></div>
                </div>
                <div className="ar-mini-stat">
                    <div className="ar-mini-stat-info">
                        <span className="label">Pending</span>
                        <span className="value">{stats.pending}</span>
                    </div>
                    <div className="ar-mini-stat-icon orange"><Clock size={20} /></div>
                </div>
                <div className="ar-mini-stat">
                    <div className="ar-mini-stat-info">
                        <span className="label">Approved</span>
                        <span className="value">{stats.approved}</span>
                    </div>
                    <div className="ar-mini-stat-icon green"><CheckCircle2 size={20} /></div>
                </div>
            </div>

            {showRequestForm && (
                <div className="ar-modal-overlay" onClick={handleCloseRequestForm}>
                    <div className="ar-modal" onClick={e => e.stopPropagation()}>
                        <div className="ar-modal-header">
                            <h3><Send size={18} /> New Asset Request</h3>
                            <button className="ar-modal-close" onClick={handleCloseRequestForm}>
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <form className="ar-modal-form" onSubmit={handleSubmit}>
                            <div className="ar-form-row">
                                <div className="ar-form-group">
                                    <label>Asset Type *</label>
                                    <div className="ar-input-quick-add">
                                        <select
                                            value={formData.asset_type}
                                            onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Asset Type</option>
                                            {categories.length > 0 ? (
                                                categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="Laptop">Laptop</option>
                                                    <option value="Monitor">Monitor</option>
                                                    <option value="Mobile">Mobile</option>
                                                </>
                                            )}
                                        </select>
                                        <button 
                                            type="button" 
                                            className={`ar-btn-icon-add ${showQuickAdd ? 'active' : ''}`}
                                            onClick={() => setShowQuickAdd(!showQuickAdd)}
                                            title="Add New Category"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    {showQuickAdd && (
                                        <div className="ar-quick-add-popover">
                                            <input 
                                                type="text" 
                                                placeholder="New Asset Category..." 
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                autoFocus
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleQuickAddCategory} 
                                                className="ar-btn-primary ar-btn--xs"
                                                disabled={savingCategory}
                                            >
                                                {savingCategory ? '...' : 'Add'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="ar-form-group">
                                    <label>Date Needed By *</label>
                                    <div className="ar-input-with-icon">
                                        <Calendar size={16} />
                                        <input
                                            type="date"
                                            value={formData.needed_by}
                                            onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="ar-form-row">
                                <div className="ar-form-group">
                                    <label>Asset Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MacBook Pro 16-inch"
                                        value={formData.asset_name}
                                        onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="ar-form-group">
                                    <label>Priority Level *</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        required
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ar-form-group">
                                <label>Reason for Request *</label>
                                <input
                                    type="text"
                                    placeholder="Briefly explain why you need this..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="ar-modal-actions">
                                <button type="button" className="ar-btn-outline" onClick={handleCloseRequestForm}>Cancel</button>
                                <button type="submit" className="ar-btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabs & List */}
            <div className="ar-list-section">
                <div className="ar-list-header">
                    <div className="ar-tabs">
                        <button className={`ar-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Requests</button>
                        <button className={`ar-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending</button>
                        <button className={`ar-tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>Approved</button>
                        <button className={`ar-tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
                    </div>
                    <div className="ar-list-actions">
                        <div className="ar-search-mini">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="ar-requests-list">
                    {loading ? (
                        <div className="ar-loading">Loading requests...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="ar-empty">No requests found.</div>
                    ) : (
                        filteredRequests.map(req => (
                            <div key={req.id} className="ar-request-item">
                                <div className="ar-req-main">
                                    <div className="ar-req-info">
                                        <span className="ar-req-id">{req.request_id || req.id}</span>
                                        <h4 className="ar-req-title">{req.asset_type}</h4>
                                        <p className="ar-req-subtitle">{req.asset_name}</p>
                                        <div className="ar-req-meta">
                                            <span><User size={14} /> {req.employee_details ? req.employee_details.full_name : '-'}</span>
                                            <span><Calendar size={14} /> Created: {req.date}</span>
                                            {req.needed_by && (
                                                <span className="ar-needed-by"><Clock size={14} /> Needed: {req.needed_by}</span>
                                            )}
                                            <span className={`ar-priority-tag ar-priority--${req.priority.toLowerCase()}`}>{req.priority} Priority</span>
                                        </div>
                                    </div>
                                    <div className="ar-req-status-col">
                                        <span className={`ar-status-badge ar-status--${req.status}`}>{req.status}</span>
                                    </div>
                                    <div className="ar-req-actions">
                                        <button className="ar-action-btn" title="View Details"><ArrowUpRight size={18} /></button>
                                    </div>
                                </div>
                                <div className="ar-req-footer">
                                    <p><MessageSquare size={14} /> {req.reason}</p>
                                    {req.status === 'rejected' && req.rejection_reason && (
                                        <div className="rejection-box">
                                            <strong>Rejection Reason:</strong> {req.rejection_reason}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
