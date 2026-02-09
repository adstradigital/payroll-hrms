'use client';

import React, { useState, useEffect } from 'react';
import {
    Check, Ban, Clock, Calendar,
    User, DollarSign, AlertCircle, CheckCircle2,
    XCircle, RefreshCw
} from 'lucide-react';
import { getLoans, updateLoan } from '@/api/api_clientadmin';
import './LoanApprovals.css';

export default function LoanApprovals() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await getLoans();
            const allLoans = res.data.results || res.data || [];
            setLoans(allLoans);
        } catch (err) {
            console.error('Failed to fetch loans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (loanId, action) => {
        if (!confirm(`Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this loan request?`)) return;

        setProcessingId(loanId);
        try {
            await updateLoan(loanId, { status: action });
            // Refresh the loans list
            await fetchLoans();
        } catch (err) {
            console.error(`Failed to ${action} loan:`, err);
            alert(`Error: ${err.response?.data?.error || 'Action failed'}`);
        } finally {
            setProcessingId(null);
        }
    };

    // Filter loans based on active tab
    const filteredLoans = loans.filter(loan => {
        if (activeTab === 'pending') return loan.status === 'pending';
        if (activeTab === 'approved') return loan.status === 'approved' || loan.status === 'disbursed';
        if (activeTab === 'rejected') return loan.status === 'rejected';
        return false;
    });

    const pendingCount = loans.filter(l => l.status === 'pending').length;
    const approvedCount = loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length;
    const rejectedCount = loans.filter(l => l.status === 'rejected').length;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(parseFloat(amount || 0));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loan-approvals-container">
                <div className="loading-state">
                    <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                        <Clock size={48} />
                    </div>
                    <h2>Loading Loan Requests...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="loan-approvals-container">
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">Loan <span className="title-accent">Approvals</span></h1>
                    <p className="cinematic-subtitle">Review and Action Loan Requests</p>
                </div>
                <button className="btn-refresh" onClick={fetchLoans} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </header>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    <Clock size={18} />
                    Pending
                    {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                </button>
                <button
                    className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    <CheckCircle2 size={18} />
                    Approved
                    {approvedCount > 0 && <span className="tab-badge tab-badge-success">{approvedCount}</span>}
                </button>
                <button
                    className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    <XCircle size={18} />
                    Rejected
                    {rejectedCount > 0 && <span className="tab-badge tab-badge-danger">{rejectedCount}</span>}
                </button>
            </div>

            <div className="approvals-grid">
                {filteredLoans.length === 0 ? (
                    <div className="empty-state">
                        {activeTab === 'pending' && (
                            <>
                                <Check size={64} className="empty-icon text-green" />
                                <h2>All caught up!</h2>
                                <p>No pending loan requests found.</p>
                            </>
                        )}
                        {activeTab === 'approved' && (
                            <>
                                <CheckCircle2 size={64} className="empty-icon text-green" />
                                <h2>No approved loans</h2>
                                <p>No approved loan requests found.</p>
                            </>
                        )}
                        {activeTab === 'rejected' && (
                            <>
                                <XCircle size={64} className="empty-icon text-red" />
                                <h2>No rejected loans</h2>
                                <p>No rejected loan requests found.</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredLoans.map(loan => (
                        <div key={loan.id} className={`approval-card ${activeTab !== 'pending' ? 'card-readonly' : ''}`}>
                            <div className="card-header">
                                <div className="emp-details">
                                    <div className="emp-avatar">
                                        {loan.employee_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="emp-text">
                                        <h3>{loan.employee_name || 'Unknown'}</h3>
                                        <p>{loan.employee_id_display || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="loan-amount-badge">
                                    {formatCurrency(loan.principal_amount)}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <span className="detail-label">Loan Type</span>
                                    <span className="detail-value">{loan.loan_type || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Tenure</span>
                                    <span className="detail-value">{loan.tenure_months} Months</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Interest</span>
                                    <span className="detail-value">{loan.interest_rate}%</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Total Payable</span>
                                    <span className="detail-value">{formatCurrency(loan.total_payable)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Applied On</span>
                                    <span className="detail-value">
                                        {formatDate(loan.created_at)}
                                    </span>
                                </div>

                                {/* Show approval/rejection date for processed loans */}
                                {(activeTab === 'approved' || activeTab === 'rejected') && loan.updated_at && (
                                    <div className="detail-row">
                                        <span className="detail-label">
                                            {activeTab === 'approved' ? 'Approved On' : 'Rejected On'}
                                        </span>
                                        <span className="detail-value">
                                            {formatDate(loan.updated_at)}
                                        </span>
                                    </div>
                                )}

                                {/* Show disbursement date if disbursed */}
                                {loan.disbursement_date && (
                                    <div className="detail-row">
                                        <span className="detail-label">Disbursed On</span>
                                        <span className="detail-value">
                                            {formatDate(loan.disbursement_date)}
                                        </span>
                                    </div>
                                )}

                                {loan.remarks && (
                                    <div className="purpose-box">
                                        <strong>Purpose:</strong> {loan.remarks}
                                    </div>
                                )}

                                {/* Show status badge for approved/rejected */}
                                {activeTab !== 'pending' && (
                                    <div className={`status-indicator status-${loan.status}`}>
                                        {loan.status === 'approved' && <CheckCircle2 size={16} />}
                                        {loan.status === 'disbursed' && <CheckCircle2 size={16} />}
                                        {loan.status === 'rejected' && <XCircle size={16} />}
                                        {loan.status === 'approved' ? 'Approved' :
                                            loan.status === 'disbursed' ? 'Disbursed' : 'Rejected'}
                                    </div>
                                )}
                            </div>

                            {/* Show action buttons only for pending loans */}
                            {activeTab === 'pending' && (
                                <div className="card-footer">
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleAction(loan.id, 'rejected')}
                                        disabled={processingId === loan.id}
                                    >
                                        <Ban size={18} />
                                        Reject
                                    </button>
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleAction(loan.id, 'approved')}
                                        disabled={processingId === loan.id}
                                    >
                                        {processingId === loan.id ? (
                                            <Clock size={18} className="animate-spin" />
                                        ) : (
                                            <Check size={18} />
                                        )}
                                        Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
