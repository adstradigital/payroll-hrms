'use client';

import React, { useState, useEffect } from 'react';
import {
    Briefcase, Search, Filter, CheckCircle, XCircle, ArrowRight,
    MoreVertical, Eye, Calendar, Loader2, Plus, X, User as UserIcon
} from 'lucide-react';
import { getWorkTypeRequests, getAllEmployees, createWorkTypeRequest, approveWorkTypeRequest, rejectWorkTypeRequest } from '@/api/api_clientadmin';
import { useAuth } from '@/context/AuthContext';
import './WorkTypeRequest.css';

export default function WorkTypeRequest({ approvalMode = false }) {
    const { user } = useAuth();
    const isAdmin = (user?.role === 'admin' || user?.is_admin) && approvalMode;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(approvalMode ? 'pending' : 'all');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
        if (isAdmin) fetchEmployees();
    }, [isAdmin]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getWorkTypeRequests();
            const data = res.data.results ? res.data.results : res.data;
            setRequests(data);
        } catch (err) {
            console.error("Error fetching work type requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getAllEmployees({ status: 'active' });
            setEmployees(res.data.results || res.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this work type request?')) return;
        try {
            await approveWorkTypeRequest(id);
            fetchRequests();
        } catch (err) {
            alert('Failed to approve request');
            console.error(err);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Please enter a reason for rejection:');
        if (reason === null) return;
        try {
            await rejectWorkTypeRequest(id, reason);
            fetchRequests();
        } catch (err) {
            alert('Failed to reject request');
            console.error(err);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredRequests.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRequests.map(r => r.id)));
        }
    };

    const toggleSelectRow = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkApprove = async () => {
        if (!selectedIds.size) return;
        if (!window.confirm(`Are you sure you want to approve ${selectedIds.size} requests?`)) return;
        
        setIsProcessing(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => approveWorkTypeRequest(id)));
            setSelectedIds(new Set());
            fetchRequests();
        } catch (err) {
            alert('Some requests failed to approve');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkReject = async () => {
        if (!selectedIds.size) return;
        const reason = window.prompt('Enter reason for bulk rejection:');
        if (reason === null) return;
        
        setIsProcessing(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => rejectWorkTypeRequest(id, reason)));
            setSelectedIds(new Set());
            fetchRequests();
        } catch (err) {
            alert('Some requests failed to reject');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'status-success';
            case 'rejected': return 'status-error';
            default: return 'status-warning';
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.current_type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="req-container">
            <div className="req-header">
                <div className="req-title-section">
                    <div className="req-icon-box">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1>Work Type Requests</h1>
                        <p>Manage employee work mode change requests</p>
                    </div>
                </div>
                <div className="req-actions">
                    {!approvalMode && (
                        <button className="req-btn-primary" onClick={() => setShowNewModal(true)}>
                            <Plus size={18} /> New Request
                        </button>
                    )}
                    {isAdmin && (
                        <button className="req-btn-secondary">
                            <Filter size={18} /> Filter
                        </button>
                    )}
                </div>
            </div>

            <div className="req-content">
                <div className="req-toolbar">
                    <div className="req-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="req-toolbar-right">
                        {isAdmin && selectedIds.size > 0 && (
                            <div className="req-bulk-actions fade-in">
                                <span>{selectedIds.size} selected</span>
                                <button className="req-btn-success-sm" onClick={handleBulkApprove} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Approve
                                </button>
                                <button className="req-btn-danger-sm" onClick={handleBulkReject} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />} Reject
                                </button>
                            </div>
                        )}
                        <div className="req-tabs">
                            <button
                                className={`req-tab ${statusFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('all')}
                            >
                                All Requests
                            </button>
                            <button
                                className={`req-tab ${statusFilter === 'pending' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('pending')}
                            >
                                Pending
                            </button>
                            <button
                                className={`req-tab ${statusFilter === 'approved' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('approved')}
                            >
                                Approved
                            </button>
                        </div>
                    </div>
                </div>

                <div className="req-table-wrapper">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-brand-primary" size={32} />
                        </div>
                    ) : (
                        <table className="req-table">
                            <thead>
                                <tr>
                                    {isAdmin && (
                                        <th style={{ width: '40px' }}>
                                            <input 
                                                type="checkbox" 
                                                onChange={toggleSelectAll}
                                                checked={selectedIds.size > 0 && selectedIds.size === filteredRequests.length}
                                            />
                                        </th>
                                    )}
                                    <th>Employee</th>
                                    <th>Current Mode</th>
                                    <th>Requested Mode</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map(req => (
                                        <tr key={req.id} className={selectedIds.has(req.id) ? 'selected-row' : ''}>
                                            {isAdmin && (
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedIds.has(req.id)}
                                                        onChange={() => toggleSelectRow(req.id)}
                                                    />
                                                </td>
                                            )}
                                            <td>
                                                <div className="req-user-cell">
                                                    <div className="req-avatar">
                                                        {req.employee_name ? req.employee_name.charAt(0) : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="req-name">{req.employee_name || 'Unknown'}</div>
                                                        <div className="req-sub">{req.employee_code || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{req.current_type}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <ArrowRight size={14} color="var(--brand-primary)" /> {req.requested_type}
                                                </div>
                                            </td>
                                            <td className="req-reason">{req.reason}</td>
                                            <td>{req.effective_date}</td>
                                            <td>
                                                <span className={`req-status-badge ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="req-action-buttons">
                                                    {isAdmin && req.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                className="req-action-btn success" 
                                                                title="Approve"
                                                                onClick={() => handleApprove(req.id)}
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button 
                                                                className="req-action-btn danger" 
                                                                title="Reject"
                                                                onClick={() => handleReject(req.id)}
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="req-action-btn" title="View Details">
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} className="text-center p-4 text-muted">No requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showNewModal && (
                <NewWorkTypeRequestModal 
                    employees={employees}
                    user={user}
                    isAdmin={isAdmin}
                    onClose={() => setShowNewModal(false)}
                    onSuccess={() => {
                        setShowNewModal(false);
                        fetchRequests();
                    }}
                />
            )}
        </div>
    );
}

function NewWorkTypeRequestModal({ employees, user, isAdmin, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        employee: user?.id || '',
        requested_type: '',
        reason: '',
        effective_date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const empId = localStorage.getItem('employeeId');
        if (empId) {
            setFormData(prev => ({ ...prev, employee: empId }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createWorkTypeRequest(formData);
            onSuccess();
        } catch (err) {
            console.error('Work type request creation error:', err.response?.data || err.message);
            alert(`Failed to create work type request: ${JSON.stringify(err.response?.data || err.message)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="req-modal slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>New Work Type Request</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="req-form">
                    <div className="form-group">
                        <label>Employee *</label>
                        <div className="form-input disabled-input" style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }}>
                            {user?.name || user?.full_name || 'My Profile'}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Requested Work Type *</label>
                            <select 
                                required 
                                className="form-input"
                                value={formData.requested_type}
                                onChange={e => setFormData({ ...formData, requested_type: e.target.value })}
                            >
                                <option value="">Select Type</option>
                                <option value="On-Site">On-site</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Effective Date *</label>
                            <input 
                                type="date" 
                                required 
                                className="form-input"
                                value={formData.effective_date}
                                onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Reason *</label>
                        <textarea 
                            required 
                            className="form-input"
                            rows={3}
                            placeholder="Reason for change..."
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            {isSubmitting ? 'Submitting...' : 'Create Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
