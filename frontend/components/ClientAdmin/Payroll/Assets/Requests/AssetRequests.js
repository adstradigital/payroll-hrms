'use client';

import { useState, useEffect } from 'react';
import {
    Send, CheckCircle2, XCircle, Clock,
    User, Box, MessageSquare, Filter,
    Search, ArrowUpRight, Calendar
} from 'lucide-react';
import { getAssetRequests, createAssetRequest, processAssetRequest } from '@/api/api_clientadmin';
import './AssetRequests.css';

export default function AssetRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [formData, setFormData] = useState({ asset_type: '', priority: 'medium', reason: '' });
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

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
            setFormData({ asset_type: '', priority: 'medium', reason: '' });
            fetchRequests();
        } catch (error) {
            console.error('Error creating request:', error);
        }
    };

    const handleProcess = async (id, action) => {
        try {
            await processAssetRequest(id, { action });
            fetchRequests();
        } catch (error) {
            console.error('Error processing request:', error);
        }
    };

    const filteredRequests = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

    return (
        <div className="asset-requests">
            {/* Upper Section: Request Form & Stats */}
            <div className="ar-top-layout">
                {/* Request Form */}
                <div className="ar-card ar-form-card">
                    <div className="ar-card-header">
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
                        <button type="submit" className="ar-btn-primary">Submit Request</button>
                    </form>
                </div>

                {/* Request Stats */}
                <div className="ar-stats-side">
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
            </div>

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
                            <input type="text" placeholder="Search requests..." />
                        </div>
                    </div>
                </div>

                <div className="ar-requests-list">
                    {filteredRequests.map(req => (
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
                                    {req.status === 'pending' ? (
                                        <>
                                            <button className="ar-action-btn ar-action--approve" title="Approve" onClick={() => handleProcess(req.id, 'approve')}><CheckCircle2 size={18} /></button>
                                            <button className="ar-action-btn ar-action--reject" title="Reject" onClick={() => handleProcess(req.id, 'reject')}><XCircle size={18} /></button>
                                        </>
                                    ) : (
                                        <button className="ar-action-btn" title="View Details"><ArrowUpRight size={18} /></button>
                                    )}
                                </div>
                            </div>
                            <div className="ar-req-footer">
                                <p><MessageSquare size={14} /> {req.reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
