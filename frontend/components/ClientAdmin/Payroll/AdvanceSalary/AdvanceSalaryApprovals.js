'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, Calendar,
    User, IndianRupee, AlertCircle, Info,
    ArrowRight, Filter, Search, Calculator
} from 'lucide-react';
import { getAdvances, updateAdvance } from '@/api/api_clientadmin';
import './AdvanceSalary.css';

export default function AdvanceSalaryApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const res = await getAdvances({ status: 'pending' });
            // The API might return all, so we filter just in case, but preferably backend handles it
            const data = res.data.results || res.data || [];
            setRequests(data.filter(r => r.status === 'pending'));
        } catch (error) {
            console.error("Error fetching pending advances:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;

        setProcessingId(id);
        try {
            await updateAdvance(id, { status });
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            alert("Action failed: " + (error.response?.data?.error || error.message));
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredRequests = requests.filter(r =>
        r.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employee_id_display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        count: filteredRequests.length,
        total: filteredRequests.reduce((sum, r) => sum + parseFloat(r.principal_amount), 0),
        avg: filteredRequests.length ? (filteredRequests.reduce((sum, r) => sum + parseFloat(r.principal_amount), 0) / filteredRequests.length) : 0
    };

    return (
        <div className="adv-container animate-fade-in">
            <div className="adv-content-wrapper mx-auto max-w-[1400px]">
                <header className="adv-header items-center">
                    <div>
                        <h1 className="adv-title">Advance <span className="text-gold">Approvals</span></h1>
                        <p className="adv-subtitle">Review and manage pending salary advance requests.</p>
                    </div>
                    <div className="adv-search self-center">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                {!loading && filteredRequests.length > 0 && (
                    <div className="adapprov-stats-grid animate-fade-in">
                        <div className="adapprov-stat-card">
                            <div className="adapprov-stat-icon" style={{ background: 'rgba(255, 191, 0, 0.1)', color: 'var(--brand-primary)' }}>
                                <Clock size={24} />
                            </div>
                            <div className="adapprov-stat-info">
                                <div className="adapprov-stat-label">Pending</div>
                                <div className="adapprov-stat-value">{stats.count} Requests</div>
                            </div>
                        </div>
                        <div className="adapprov-stat-card">
                            <div className="adapprov-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <IndianRupee size={24} />
                            </div>
                            <div className="adapprov-stat-info">
                                <div className="adapprov-stat-label">Total Volume</div>
                                <div className="adapprov-stat-value">{formatCurrency(stats.total)}</div>
                            </div>
                        </div>
                        <div className="adapprov-stat-card">
                            <div className="adapprov-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <Calculator size={24} />
                            </div>
                            <div className="adapprov-stat-info">
                                <div className="adapprov-stat-label">Average Value</div>
                                <div className="adapprov-stat-value">{formatCurrency(stats.avg)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Clock size={40} className="text-gold animate-spin" />
                        <p className="text-muted text-sm">Loading requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="adapprov-card text-center p-20 flex flex-col items-center gap-4">
                        <CheckCircle2 size={48} className="text-green-500" />
                        <h2 className="text-xl font-bold">No Pending Requests</h2>
                        <p className="text-muted">You are all caught up!</p>
                        <button className="btn btn-secondary mt-4" onClick={fetchPendingRequests}>Refresh</button>
                    </div>
                ) : (
                    <div className="adapprov-grid">
                        {filteredRequests.map(req => (
                            <div key={req.id} className="adapprov-card animate-fade-in">
                                <div className="adapprov-card-header">
                                    <div className="adapprov-emp-info">
                                        <div className="adapprov-avatar">{req.employee_name?.charAt(0)}</div>
                                        <div>
                                            <div className="adapprov-emp-name">{req.employee_name}</div>
                                            <div className="adapprov-emp-id">{req.employee_id_display}</div>
                                        </div>
                                    </div>
                                    <div className="adapprov-amount">
                                        <div className="adapprov-amount-label">Amount</div>
                                        <div className="adapprov-amount-value">{formatCurrency(req.principal_amount)}</div>
                                    </div>
                                </div>

                                <div className="adapprov-card-body">
                                    <div className="adapprov-policy-box">
                                        <span className="adapprov-policy-label">Recovery Policy:</span>
                                        <span className="adapprov-policy-value">Next Salary Cycle</span>
                                    </div>

                                    {req.remarks ? (
                                        <div className="adapprov-remarks">
                                            {req.remarks}
                                        </div>
                                    ) : (
                                        <div className="adapprov-no-remarks">
                                            No remarks provided
                                        </div>
                                    )}
                                </div>

                                <div className="adapprov-card-footer">
                                    <button
                                        className="adapprov-btn adapprov-btn-reject"
                                        onClick={() => handleAction(req.id, 'rejected')}
                                        disabled={processingId === req.id}
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        className="adapprov-btn adapprov-btn-approve"
                                        onClick={() => handleAction(req.id, 'approved')}
                                        disabled={processingId === req.id}
                                    >
                                        {processingId === req.id ? <Clock size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
