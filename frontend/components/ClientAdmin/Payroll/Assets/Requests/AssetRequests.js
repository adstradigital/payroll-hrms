'use client';

import { useState, useEffect } from 'react';
import {
    Send, CheckCircle2, XCircle, Clock,
    User, Box, MessageSquare, Filter,
    Search, ArrowUpRight, Calendar
} from 'lucide-react';
import { getAssetRequests, createAssetRequest } from '@/api/api_clientadmin';
import './AssetRequests.css';

const INITIAL_FORM_DATA = { asset_type: '', priority: 'medium', reason: '' };

export default function AssetRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [showRequestForm, setShowRequestForm] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

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
                <div className="ar-card ar-form-card is-open">
                    <div className="ar-card-header ar-card-header--split">
                        <h3><Send size={18} /> New Asset Request</h3>
                    </div>

                    <form className="ar-form" onSubmit={handleSubmit}>
                        <div className="ar-form-row">
                            <div className="ar-form-group">
                                <label>Asset Type</label>
                                <select
                                    value={formData.asset_type}
                                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select Asset Type</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Mobile">Mobile</option>
                                    <option value="Peripherals">Peripherals</option>
                                </select>
                            </div>
                            <div className="ar-form-group">
                                <label>Priority</label>
                                <div className="ar-priority-options">
                                    <label><input type="radio" name="priority" value="low" checked={formData.priority === 'low'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} /> Low</label>
                                    <label><input type="radio" name="priority" value="medium" checked={formData.priority === 'medium'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} /> Medium</label>
                                    <label><input type="radio" name="priority" value="high" checked={formData.priority === 'high'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} /> High</label>
                                </div>
                            </div>
                        </div>
                        <div className="ar-form-group">
                            <label>Reason for Request</label>
                            <textarea
                                rows={3}
                                placeholder="Explain why you need this asset..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="ar-form-actions">
                            <button type="button" className="ar-btn-secondary" onClick={handleCloseRequestForm}>Cancel</button>
                            <button type="submit" className="ar-btn-primary">Send Request</button>
                        </div>
                    </form>
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
                                        <span className="ar-req-id">{req.id}</span>
                                        <h4 className="ar-req-title">{req.asset_type} Request</h4>
                                        <div className="ar-req-meta">
                                            <span><User size={14} /> {req.employee_details ? req.employee_details.full_name : '-'}</span>
                                            <span><Calendar size={14} /> {req.date}</span>
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
