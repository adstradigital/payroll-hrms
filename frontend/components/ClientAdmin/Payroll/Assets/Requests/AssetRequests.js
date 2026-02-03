'use client';

import { useState } from 'react';
import {
    Send, CheckCircle2, XCircle, Clock,
    User, Box, MessageSquare, Filter,
    Search, ArrowUpRight
} from 'lucide-react';
import './AssetRequests.css';

const initialRequests = [
    { id: 'REQ-001', user: 'Anil Kumar', assetType: 'Laptop', priority: 'High', date: '2023-11-20', status: 'pending', reason: 'Old machine performance issues' },
    { id: 'REQ-002', user: 'Sneha Rao', assetType: 'Monitor', priority: 'Medium', date: '2023-11-21', status: 'approved', reason: 'Dual monitor setup for design' },
    { id: 'REQ-003', user: 'Rahul Singh', assetType: 'Mouse', priority: 'Low', date: '2023-11-22', status: 'rejected', reason: 'Damaged existing mouse' },
    { id: 'REQ-004', user: 'Priya Verma', assetType: 'Keyboard', priority: 'Medium', date: '2023-11-23', status: 'pending', reason: 'Ergonomic keyboard requirement' },
];

export default function AssetRequests() {
    const [requests, setRequests] = useState(initialRequests);
    const [activeTab, setActiveTab] = useState('all');

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
                    <form className="ar-form">
                        <div className="ar-form-row">
                            <div className="ar-form-group">
                                <label>Asset Type</label>
                                <select>
                                    <option>Select Asset Type</option>
                                    <option>Laptop</option>
                                    <option>Monitor</option>
                                    <option>Mobile</option>
                                    <option>Peripherals</option>
                                </select>
                            </div>
                            <div className="ar-form-group">
                                <label>Priority</label>
                                <div className="ar-priority-options">
                                    <label><input type="radio" name="priority" value="low" /> Low</label>
                                    <label><input type="radio" name="priority" value="medium" defaultChecked /> Medium</label>
                                    <label><input type="radio" name="priority" value="high" /> High</label>
                                </div>
                            </div>
                        </div>
                        <div className="ar-form-group">
                            <label>Reason for Request</label>
                            <textarea rows={3} placeholder="Explain why you need this asset..."></textarea>
                        </div>
                        <button type="button" className="ar-btn-primary">Submit Request</button>
                    </form>
                </div>

                {/* Request Stats */}
                <div className="ar-stats-side">
                    <div className="ar-mini-stat">
                        <div className="ar-mini-stat-info">
                            <span className="label">Your Requests</span>
                            <span className="value">12</span>
                        </div>
                        <div className="ar-mini-stat-icon blue"><Send size={20} /></div>
                    </div>
                    <div className="ar-mini-stat">
                        <div className="ar-mini-stat-info">
                            <span className="label">Pending</span>
                            <span className="value">2</span>
                        </div>
                        <div className="ar-mini-stat-icon orange"><Clock size={20} /></div>
                    </div>
                    <div className="ar-mini-stat">
                        <div className="ar-mini-stat-info">
                            <span className="label">Approved</span>
                            <span className="value">9</span>
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
                                    <h4 className="ar-req-title">{req.assetType} Request</h4>
                                    <div className="ar-req-meta">
                                        <span><User size={14} /> {req.user}</span>
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
                                            <button className="ar-action-btn ar-action--approve" title="Approve"><CheckCircle2 size={18} /></button>
                                            <button className="ar-action-btn ar-action--reject" title="Reject"><XCircle size={18} /></button>
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
