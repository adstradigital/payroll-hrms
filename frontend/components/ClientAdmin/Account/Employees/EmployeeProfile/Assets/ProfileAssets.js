'use client';

import { useState, useEffect } from 'react';
import {
    Laptop, Tablet, Smartphone, Monitor,
    Printer, Speaker, MousePointer, Box,
    Search, Plus, Calendar, Hash,
    ShieldCheck, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, Info, X as XIcon
} from 'lucide-react';
import { getAssets, getAssetRequests, createAssetRequest } from '@/api/api_clientadmin';
import './ProfileAssets.css';

export default function ProfileAssets({ employeeId }) {
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        asset_type: '',
        priority: 'medium',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeId) {
            fetchData();
        }
    }, [employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assetsRes, requestsRes] = await Promise.all([
                getAssets({ assigned_to: employeeId }),
                getAssetRequests() // Filtered by employee on backend normally
            ]);

            setAssets(assetsRes.data || []);
            // If the backend doesn't filter requests by employee automatically for non-admins,
            // we might need to filter manually if employeeId is available.
            // But usually this belongs to the logged in user's profile.
            setRequests(requestsRes.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Failed to load asset information.');
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createAssetRequest(requestForm);
            setShowRequestModal(false);
            setRequestForm({ asset_type: '', priority: 'medium', reason: '' });
            fetchData();
        } catch (err) {
            console.error('Error creating asset request:', err);
            alert('Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getAssetIcon = (category) => {
        const cat = category?.toLowerCase();
        if (cat === 'laptop') return <Laptop size={20} />;
        if (cat === 'monitor') return <Monitor size={20} />;
        if (cat === 'mobile') return <Smartphone size={20} />;
        if (cat === 'tablet') return <Tablet size={20} />;
        if (cat === 'printer') return <Printer size={20} />;
        if (cat === 'audio') return <Speaker size={20} />;
        if (cat === 'peripherals') return <MousePointer size={20} />;
        return <Box size={20} />;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="assets-loading">
                <div className="spinner"></div>
                <p>Loading Asset Inventory...</p>
            </div>
        );
    }

    return (
        <div className="profile-assets-container animate-fade-in">
            {/* --- Stats Summary --- */}
            <div className="assets-summary-grid">
                <div className="asset-stat-card active">
                    <div className="stat-icon-bg">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Active Assets</span>
                        <h2 className="stat-value">{assets.length}</h2>
                    </div>
                </div>

                <div className="asset-stat-card pending">
                    <div className="stat-icon-bg">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Open Requests</span>
                        <h2 className="stat-value">{requests.filter(r => r.status === 'pending').length}</h2>
                    </div>
                </div>

                <div className="asset-stat-card action" onClick={() => setShowRequestModal(true)}>
                    <div className="stat-icon-bg">
                        <Plus size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">New Request</span>
                        <h2 className="stat-value">Request Asset</h2>
                    </div>
                    <ArrowUpRight size={20} className="arrow-icon" />
                </div>
            </div>

            {/* --- Assigned Assets Section --- */}
            <section className="assets-section card">
                <div className="section-header">
                    <div className="header-left">
                        <Box size={20} />
                        <h3>Assigned Assets</h3>
                    </div>
                    <div className="header-badge">{assets.length} Items</div>
                </div>

                <div className="assets-grid">
                    {assets.length > 0 ? (
                        assets.map((asset) => (
                            <div key={asset.id} className="asset-item-card">
                                <div className="asset-main">
                                    <div className={`asset-category-icon ${asset.category}`}>
                                        {getAssetIcon(asset.category)}
                                    </div>
                                    <div className="asset-id-tags">
                                        <span className="asset-id">#{asset.asset_id}</span>
                                        <span className={`asset-status-tag ${asset.status}`}>
                                            {asset.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="asset-details">
                                    <h4 className="asset-name">{asset.name}</h4>
                                    <p className="asset-model">{asset.model || 'Standard Edition'}</p>

                                    <div className="asset-meta-rows">
                                        <div className="meta-row">
                                            <Hash size={14} />
                                            <span>S/N: {asset.serial_number || 'N/A'}</span>
                                        </div>
                                        <div className="meta-row">
                                            <Calendar size={14} />
                                            <span>Assigned: {new Date(asset.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {asset.warranty_expiry && (
                                    <div className="asset-footer">
                                        <ShieldCheck size={14} />
                                        <span>Warranty until {new Date(asset.warranty_expiry).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-assets">
                            <Box size={40} />
                            <p>No company assets currently assigned to you.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Asset Requests Section --- */}
            <section className="assets-section card requests-table-section">
                <div className="section-header">
                    <div className="header-left">
                        <Clock size={20} />
                        <h3>Request History</h3>
                    </div>
                </div>

                <div className="requests-container">
                    {requests.length > 0 ? (
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Asset Type</th>
                                    <th>Request Date</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="font-medium">{request.asset_type}</td>
                                        <td>{new Date(request.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`priority-tag ${request.priority}`}>
                                                {request.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={`status-pill ${request.status}`}>
                                                {request.status === 'pending' && <Clock size={12} />}
                                                {request.status === 'approved' && <CheckCircle2 size={12} />}
                                                {request.status === 'rejected' && <AlertCircle size={12} />}
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </div>
                                        </td>
                                        <td className="reason-cell" title={request.reason}>
                                            {request.reason}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-requests">
                            <Info size={24} />
                            <p>No asset requests found in history.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Request Modal --- */}
            {showRequestModal && (
                <div className="asset-request-overlay">
                    <div className="asset-request-modal animate-slide-up">
                        <div className="modal-header">
                            <h3>Request New Asset</h3>
                            <button className="close-btn" onClick={() => setShowRequestModal(false)}>
                                <XIcon size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRequestSubmit}>
                            <div className="form-group">
                                <label>Asset Type *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MacBook Pro M3, Noise Cancelling Headphones"
                                    value={requestForm.asset_type}
                                    onChange={(e) => setRequestForm({ ...requestForm, asset_type: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <div className="priority-options">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`p-option ${p} ${requestForm.priority === p ? 'active' : ''}`}
                                            onClick={() => setRequestForm({ ...requestForm, priority: p })}
                                        >
                                            {p.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason for Request *</label>
                                <textarea
                                    placeholder="Briefly explain why you need this asset..."
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    required
                                    rows={4}
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-ghost" onClick={() => setShowRequestModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
