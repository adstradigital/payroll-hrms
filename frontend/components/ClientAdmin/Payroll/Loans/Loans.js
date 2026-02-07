'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Plus, Search, RefreshCw, Wallet,
    Calendar, User, AlertCircle, CheckCircle2,
    Clock, DollarSign, X, ArrowUpRight,
    ChevronRight, Info, Filter, MoreVertical,
    Check, Ban, CreditCard
} from 'lucide-react';
import {
    getLoans, createLoan, updateLoan, deleteLoan,
    getAllEmployees, generateLoanSchedule
} from '@/api/api_clientadmin';
import './Loans.css';

export default function Loans() {
    const router = useRouter();
    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [formData, setFormData] = useState({
        employee: '',
        loan_type: 'personal',
        principal_amount: '',
        interest_rate: '0',
        tenure_months: '12',
        disbursement_date: new Date().toISOString().split('T')[0],
        remarks: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    // Auto-select logged-in employee
    useEffect(() => {
        if (employees.length > 0) {
            const storedEmpId = localStorage.getItem('employeeId');
            if (storedEmpId) {
                setFormData(prev => ({ ...prev, employee: storedEmpId }));
            } else if (user?.email) {
                const found = employees.find(e => e.email === user.email);
                if (found) {
                    setFormData(prev => ({ ...prev, employee: found.id }));
                }
            }
        }
    }, [employees, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getLoans();
            setLoans(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch loans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getAllEmployees();
            setEmployees(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    const handleCreateLoan = async (e) => {
        e.preventDefault();

        if (!formData.employee) {
            alert('Error: Could not identify current employee account. Please try logging out and logging back in.');
            return;
        }

        setActionLoading(true);
        try {
            await createLoan(formData);
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error('Failed to create loan:', err);
            const errorData = err.response?.data;
            const errorMessage = errorData?.error || (typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData)) || 'Unknown error';
            alert('Error creating loan: ' + errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (loanId, newStatus) => {
        setActionLoading(true);
        try {
            await updateLoan(loanId, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            employee: '',
            loan_type: 'personal',
            principal_amount: '',
            interest_rate: '0',
            tenure_months: '12',
            disbursement_date: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setSelectedLoan(null);
    };

    const stats = useMemo(() => {
        const total = loans.length;
        const active = loans.filter(l => l.status === 'disbursed').length;
        const pending = loans.filter(l => l.status === 'pending').length;
        const totalAmount = loans.reduce((acc, l) => acc + parseFloat(l.principal_amount || 0), 0);
        return { total, active, pending, totalAmount };
    }, [loans]);

    const filteredLoans = loans.filter(loan =>
        loan.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusClass = (status) => `status-badge status-${status}`;

    return (
        <div className="loans-container">
            {/* Header */}
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">Loans <span className="title-accent">& EMI</span></h1>
                    <p className="cinematic-subtitle">Manage Employee Borrowings & Repayments</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary-premium" onClick={() => router.push('/dashboard/payroll/loan-approvals')}>
                        Review Approvals <ArrowUpRight size={18} />
                    </button>
                    <button className="btn-primary-premium" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} /> New Loan Request
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="loan-stats-grid">
                <div className="loan-stat-card">
                    <span className="stat-label">Total Loan Requests</span>
                    <div className="stat-value">{stats.total}</div>
                    <Wallet className="stat-icon-bg" size={64} />
                </div>
                <div className="loan-stat-card">
                    <span className="stat-label">Active Disbursements</span>
                    <div className="stat-value">{stats.active}</div>
                    <CheckCircle2 className="stat-icon-bg" size={64} />
                </div>
                <div className="loan-stat-card">
                    <span className="stat-label">Pending Approvals</span>
                    <div className="stat-value">{stats.pending}</div>
                    <Clock className="stat-icon-bg" size={64} />
                </div>
                <div className="loan-stat-card">
                    <span className="stat-label">Total Principal Portfolio</span>
                    <div className="stat-value">₹{stats.totalAmount.toLocaleString()}</div>
                    <DollarSign className="stat-icon-bg" size={64} />
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar-premium">
                <div className="search-box-premium">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by employee name or loan type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-refresh-premium" onClick={fetchData} title="Refresh Data">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Table */}
            <div className="table-container-premium">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Loan Type</th>
                            <th>Principal</th>
                            <th>Tenure</th>
                            <th>Interest</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Loading data...</td></tr>
                        ) : filteredLoans.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No loans found.</td></tr>
                        ) : (
                            filteredLoans.map(loan => (
                                <tr key={loan.id} onClick={() => { setSelectedLoan(loan); setIsModalOpen(true); }} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div className="emp-cell">
                                            <div className="salary-avatar-circle">{loan.employee_name?.[0]}</div>
                                            <div className="emp-info">
                                                <span className="emp-name-text">{loan.employee_name}</span>
                                                <span className="emp-id-text">{loan.employee_id_display}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{loan.loan_type}</td>
                                    <td className="font-mono">₹{parseFloat(loan.principal_amount || 0).toLocaleString()}</td>
                                    <td>{loan.tenure_months} Months</td>
                                    <td>{loan.interest_rate}%</td>
                                    <td className="font-mono">₹{parseFloat(loan.balance_amount || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={getStatusClass(loan.status)}>{loan.status}</span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>

                                            {loan.status === 'approved' && (
                                                <button className="action-btn text-blue" onClick={() => handleUpdateStatus(loan.id, 'disbursed')} title="Mark Disbursed">
                                                    <CreditCard size={16} />
                                                </button>
                                            )}
                                            <button className="action-btn" onClick={() => { setSelectedLoan(loan); setIsModalOpen(true); }} title="View Details">
                                                <Info size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content-premium" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title-text">{selectedLoan ? 'Loan Details' : 'New Loan Request'}</h2>
                                <p className="modal-subtitle-text">{selectedLoan ? `ID: ${selectedLoan.id}` : 'Fill in the details to initiate a new loan'}</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {selectedLoan ? (
                                <>
                                    <div className="loan-details-section">
                                        <div className="form-group">
                                            <label>Employee</label>
                                            <div className="premium-input">{selectedLoan.employee_name}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Loan Type</label>
                                            <div className="premium-input" style={{ textTransform: 'capitalize' }}>{selectedLoan.loan_type}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Principal Amount</label>
                                            <div className="premium-input">₹{parseFloat(selectedLoan.principal_amount || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Total Payable (with Interest)</label>
                                            <div className="premium-input">₹{parseFloat(selectedLoan.total_payable || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Remaining Balance</label>
                                            <div className="premium-input" style={{ fontWeight: 800, color: 'var(--comp-loan)' }}>₹{parseFloat(selectedLoan.balance_amount || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <div className={getStatusClass(selectedLoan.status)} style={{ display: 'inline-block', width: 'fit-content' }}>{selectedLoan.status}</div>
                                        </div>
                                    </div>

                                    <div className="schedule-container">
                                        <div className="schedule-header">
                                            <span>EMI Repayment Schedule</span>
                                            <span>Total {selectedLoan.tenure_months} Installments</span>
                                        </div>
                                        <div className="schedule-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {selectedLoan.emis && selectedLoan.emis.length > 0 ? (
                                                selectedLoan.emis.map((emi, idx) => (
                                                    <div key={emi.id} className="schedule-row">
                                                        <span>{idx + 1}. {new Date(emi.year, emi.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                                                        <span className="font-mono">₹{parseFloat(emi.amount || 0).toLocaleString()}</span>
                                                        <span className={emi.status === 'paid' ? 'emi-paid' : 'emi-pending'}>
                                                            {emi.status === 'paid' ? 'Settled' : 'Pending'}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                                    Schedule will be generated upon approval.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleCreateLoan} style={{ display: 'contents' }}>
                                    <div className="form-column">
                                        <div className="form-group">
                                            <label>Employee</label>
                                            <div className="premium-input" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'default' }}>
                                                {employees.find(e => e.id === formData.employee)?.full_name || user?.name || 'Current Employee'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Loan Type</label>
                                            <select
                                                className="premium-select"
                                                value={formData.loan_type}
                                                onChange={e => setFormData({ ...formData, loan_type: e.target.value })}
                                            >
                                                <option value="personal">Personal Loan</option>
                                                <option value="advance">Salary Advance</option>
                                                <option value="asset">Asset Purchase</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Principal Amount (₹)</label>
                                            <input
                                                type="number"
                                                className="premium-input"
                                                required
                                                placeholder="Enter amount"
                                                value={formData.principal_amount}
                                                onChange={e => setFormData({ ...formData, principal_amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-column">
                                        <div className="form-group">
                                            <label>Interest Rate (% Annual Simple)</label>
                                            <input
                                                type="number"
                                                className="premium-input"
                                                required
                                                placeholder="0 for interest-free"
                                                value={formData.interest_rate}
                                                onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Tenure (Months)</label>
                                            <input
                                                type="number"
                                                className="premium-input"
                                                required
                                                value={formData.tenure_months}
                                                onChange={e => setFormData({ ...formData, tenure_months: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Repayment Start Date</label>
                                            <input
                                                type="date"
                                                className="premium-input"
                                                required
                                                value={formData.disbursement_date}
                                                onChange={e => setFormData({ ...formData, disbursement_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Remarks / Purpose</label>
                                        <textarea
                                            className="premium-input"
                                            rows="3"
                                            value={formData.remarks}
                                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                        ></textarea>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary-premium" onClick={() => setIsModalOpen(false)}>
                                {selectedLoan ? 'Close' : 'Cancel'}
                            </button>
                            {!selectedLoan && (
                                <button className="btn-primary-premium" onClick={handleCreateLoan} disabled={actionLoading}>
                                    {actionLoading ? 'Creating...' : 'Submit Request'}
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
