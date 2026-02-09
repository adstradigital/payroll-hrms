'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Search, RefreshCw, DollarSign,
    Calendar, CheckCircle2, Clock, AlertCircle,
    ChevronDown, ChevronUp, Filter, Wallet,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { getLoanRepaymentTracking, getLoanRepaymentStats } from '@/api/api_clientadmin';
import './LoanRepaymentTracking.css';

export default function LoanRepaymentTracking() {
    const [loans, setLoans] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedLoan, setExpandedLoan] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [loansRes, statsRes] = await Promise.all([
                getLoanRepaymentTracking(statusFilter !== 'all' ? { status: statusFilter } : {}),
                getLoanRepaymentStats()
            ]);

            console.log('Loans Response:', loansRes.data);
            console.log('Stats Response:', statsRes.data);

            setLoans(loansRes.data.results || loansRes.data || []);
            setStats(statsRes.data || {});
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (loanId) => {
        setExpandedLoan(expandedLoan === loanId ? null : loanId);
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading && !stats) {
        return (
            <div className="loan-repayment-container">
                <div className="loading-state">
                    <div className="loading-spinner">
                        <Clock size={48} className="animate-spin" />
                    </div>
                    <h2>Loading Repayment Data...</h2>
                    <p>Please wait while we fetch your loan information</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loan-repayment-container">
                <div className="error-state">
                    <AlertCircle size={64} className="error-icon" />
                    <h2>Failed to Load Data</h2>
                    <p>{error}</p>
                    <button className="btn-retry" onClick={fetchData}>
                        <RefreshCw size={18} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="loan-repayment-container">
            {/* Enhanced Header */}
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">
                        <Wallet className="title-icon" />
                        Loan <span className="title-accent">Repayment Tracking</span>
                    </h1>
                    <p className="cinematic-subtitle">Monitor EMI Payments & Recovery Progress</p>
                </div>
                <button
                    className="btn-refresh-premium"
                    onClick={fetchData}
                    disabled={loading}
                    title="Refresh Data"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </header>

            {/* Enhanced Statistics Dashboard */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon-wrapper">
                            <DollarSign className="stat-icon-large" size={32} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Disbursed</span>
                            <div className="stat-value">{formatCurrency(stats.total_disbursed)}</div>
                            <span className="stat-meta">
                                <Activity size={14} />
                                {(stats.active_loans_count || 0) + (stats.completed_loans_count || 0)} total loans
                            </span>
                        </div>
                    </div>

                    <div className="stat-card stat-success">
                        <div className="stat-icon-wrapper stat-success-bg">
                            <CheckCircle2 className="stat-icon-large" size={32} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Recovered</span>
                            <div className="stat-value">{formatCurrency(stats.total_recovered)}</div>
                            <span className="stat-meta stat-success-text">
                                <ArrowUpRight size={14} />
                                {stats.paid_emis || 0} EMIs paid
                            </span>
                        </div>
                    </div>

                    <div className="stat-card stat-warning">
                        <div className="stat-icon-wrapper stat-warning-bg">
                            <AlertCircle className="stat-icon-large" size={32} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Outstanding Balance</span>
                            <div className="stat-value">{formatCurrency(stats.total_outstanding)}</div>
                            <span className="stat-meta stat-warning-text">
                                <ArrowDownRight size={14} />
                                {stats.pending_emis || 0} EMIs pending
                            </span>
                        </div>
                    </div>

                    <div className="stat-card stat-info">
                        <div className="stat-icon-wrapper stat-info-bg">
                            <TrendingUp className="stat-icon-large" size={32} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Recovery Rate</span>
                            <div className="stat-value">{stats.recovery_rate || 0}%</div>
                            <span className="stat-meta stat-info-text">
                                <Activity size={14} />
                                {stats.active_loans_count || 0} active loans
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Filters */}
            <div className="toolbar-premium">
                <div className="search-box-premium">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by employee name or loan type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Loans</option>
                        <option value="disbursed">Active</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Enhanced Loans Grid */}
            <div className="repayment-grid">
                {filteredLoans.length === 0 ? (
                    <div className="empty-state">
                        {searchTerm || statusFilter !== 'all' ? (
                            <>
                                <Search size={64} className="empty-icon" />
                                <h2>No loans found</h2>
                                <p>Try adjusting your search or filter criteria</p>
                                <button
                                    className="btn-clear-filters"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={64} className="empty-icon" />
                                <h2>No active loan repayments</h2>
                                <p>There are currently no loans to track</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredLoans.map(loan => {
                        const tracking = loan.repayment_tracking || {};
                        const isExpanded = expandedLoan === loan.id;
                        const progressPercentage = tracking.progress_percentage || 0;

                        return (
                            <div key={loan.id} className="repayment-card">
                                {/* Card Header */}
                                <div className="card-header">
                                    <div className="emp-details">
                                        <div className="emp-avatar">
                                            {loan.employee_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="emp-text">
                                            <h3>{loan.employee_name || 'Unknown Employee'}</h3>
                                            <p>{loan.employee_id_display || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className={`status-badge status-${loan.status}`}>
                                        {loan.status === 'disbursed' ? 'Active' : 'Completed'}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="card-body">
                                    <div className="detail-row">
                                        <span className="detail-label">Loan Type</span>
                                        <span className="detail-value">{loan.loan_type || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Principal Amount</span>
                                        <span className="detail-value">{formatCurrency(loan.principal_amount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Total Payable</span>
                                        <span className="detail-value">{formatCurrency(loan.total_payable)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Outstanding</span>
                                        <span className="detail-value outstanding">{formatCurrency(loan.balance_amount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">EMIs Progress</span>
                                        <span className="detail-value">
                                            {tracking.paid_emis || 0} / {tracking.total_emis || 0}
                                        </span>
                                    </div>

                                    {/* Enhanced Progress Bar */}
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span>Repayment Progress</span>
                                            <span className="progress-percentage">{progressPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${progressPercentage >= 100 ? 'progress-complete' : ''}`}
                                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                            >
                                                <span className="progress-shine"></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next EMI Info */}
                                    {tracking.next_emi_date && loan.status === 'disbursed' && (
                                        <div className="next-emi-info">
                                            <Calendar size={16} />
                                            <span>Next EMI: {formatDate(tracking.next_emi_date)}</span>
                                        </div>
                                    )}

                                    {/* Last Payment Info */}
                                    {tracking.last_payment_date && (
                                        <div className="last-payment-info">
                                            <CheckCircle2 size={16} />
                                            <span>Last Payment: {formatDate(tracking.last_payment_date)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Expandable EMI Schedule */}
                                <div className="card-footer">
                                    <button
                                        className="btn-expand"
                                        onClick={() => toggleExpand(loan.id)}
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        {isExpanded ? 'Hide' : 'View'} EMI Schedule ({tracking.total_emis || 0})
                                    </button>
                                </div>

                                {/* EMI Schedule Details */}
                                {isExpanded && (
                                    <div className="emi-schedule">
                                        <div className="schedule-header">
                                            <span>Month</span>
                                            <span>Amount</span>
                                            <span>Status</span>
                                        </div>
                                        <div className="schedule-list">
                                            {loan.emis && loan.emis.length > 0 ? (
                                                loan.emis.map((emi, idx) => (
                                                    <div key={emi.id} className="schedule-row">
                                                        <span className="emi-month">
                                                            EMI #{idx + 1} - {new Date(emi.year, emi.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="emi-amount">{formatCurrency(emi.amount)}</span>
                                                        <span className={`emi-status emi-${emi.status}`}>
                                                            {emi.status === 'paid' ? (
                                                                <>
                                                                    <CheckCircle2 size={14} />
                                                                    Paid
                                                                </>
                                                            ) : emi.status === 'skipped' ? (
                                                                <>
                                                                    <AlertCircle size={14} />
                                                                    Skipped
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock size={14} />
                                                                    Pending
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-schedule">
                                                    <AlertCircle size={24} />
                                                    <p>No EMI schedule available</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
