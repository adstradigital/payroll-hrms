'use client';

import React, { useState, useEffect } from 'react';
import {
    Briefcase, Search, Filter, CheckCircle, XCircle, ArrowRight,
    MoreVertical, Eye, Calendar, Loader2
} from 'lucide-react';
import { getWorkTypeRequests } from '@/api/api_clientadmin';
import './WorkTypeRequest.css';

export default function WorkTypeRequest() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

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
                    <button className="req-btn-primary">
                        <Filter size={18} /> Filter
                    </button>
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

                <div className="req-table-wrapper">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-brand-primary" size={32} />
                        </div>
                    ) : (
                        <table className="req-table">
                            <thead>
                                <tr>
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
                                        <tr key={req.id}>
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
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button className="req-action-btn success" title="Approve">
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button className="req-action-btn danger" title="Reject">
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
                                        <td colSpan="7" className="text-center p-4 text-muted">No requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
