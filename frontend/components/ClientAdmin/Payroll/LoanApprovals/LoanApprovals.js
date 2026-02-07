'use client';

import React, { useState, useEffect } from 'react';
import {
    Check, Ban, Clock, Calendar,
    User, DollarSign, AlertCircle
} from 'lucide-react';
import { getLoans, updateLoan } from '@/api/api_clientadmin';
import './LoanApprovals.css';

export default function LoanApprovals() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingLoans();
    }, []);

    const fetchPendingLoans = async () => {
        setLoading(true);
        try {
            const res = await getLoans();
            const allLoans = res.data.results || res.data || [];
            // Filter only pending loans
            const pending = allLoans.filter(l => l.status === 'pending');
            setLoans(pending);
        } catch (err) {
            console.error('Failed to fetch loans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (loanId, action) => {
        if (!confirm(`Are you sure you want to ${action} this loan request?`)) return;

        setProcessingId(loanId);
        try {
            // action is 'approved' or 'rejected'
            await updateLoan(loanId, { status: action });
            // Remove from list locally for instant feedback
            setLoans(prev => prev.filter(l => l.id !== loanId));
        } catch (err) {
            console.error(`Failed to ${action} loan:`, err);
            alert(`Error: ${err.response?.data?.error || 'Action failed'}`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="loan-approvals-container">
                <div className="empty-state">
                    <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                        <Clock size={48} />
                    </div>
                    <h2>Loading Pending Requests...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="loan-approvals-container">
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">Loan <span className="title-accent">Approvals</span></h1>
                    <p className="cinematic-subtitle">Review and Action Pending Loan Requests</p>
                </div>
                <div className="header-badge">
                    {loans.length} Pending
                </div>
            </header>

            <div className="approvals-grid">
                {loans.length === 0 ? (
                    <div className="empty-state">
                        <Check size={64} className="empty-icon text-green" />
                        <h2>All caught up!</h2>
                        <p>No pending loan requests found.</p>
                    </div>
                ) : (
                    loans.map(loan => (
                        <div key={loan.id} className="approval-card">
                            <div className="card-header">
                                <div className="emp-details">
                                    <div className="emp-avatar">
                                        {loan.employee_name?.[0]}
                                    </div>
                                    <div className="emp-text">
                                        <h3>{loan.employee_name}</h3>
                                        <p>{loan.employee_id_display}</p>
                                    </div>
                                </div>
                                <div className="loan-amount-badge">
                                    ₹{parseFloat(loan.principal_amount).toLocaleString()}
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <span className="detail-label">Loan Type</span>
                                    <span className="detail-value">{loan.loan_type}</span>
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
                                    <span className="detail-label">Applied On</span>
                                    <span className="detail-value">
                                        {new Date(loan.created_at || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                {loan.remarks && (
                                    <div className="purpose-box">
                                        <strong>Purpose:</strong> {loan.remarks}
                                    </div>
                                )}
                            </div>

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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
