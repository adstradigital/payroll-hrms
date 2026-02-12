'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Plus, Search, RefreshCw, Gift,
    Calendar, User, DollarSign, X,
    CheckCircle2, Clock, TrendingUp, Filter,
    Edit2, Trash2, AlertCircle
} from 'lucide-react';
import {
    getAdhocPayments, createAdhocPayment, updateAdhocPayment,
    deleteAdhocPayment, getAdhocPaymentStats, getAllEmployees,
    getSalaryComponents
} from '@/api/api_clientadmin';
import './BonusAndIncentive.css';

export default function BonusAndIncentive() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [components, setComponents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [formData, setFormData] = useState({
        employee: '',
        name: '',
        amount: '',
        component: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchData();
        fetchEmployees();
        fetchComponents();
        fetchStats();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await getAdhocPayments();
            setPayments(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch adhoc payments:', err);
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

    const fetchComponents = async () => {
        try {
            const res = await getSalaryComponents();
            const earningComponents = (res.data.results || res.data || []).filter(
                c => c.component_type === 'earning'
            );
            setComponents(earningComponents);
        } catch (err) {
            console.error('Failed to fetch components:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await getAdhocPaymentStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');

        // Manual Validation Check (Just in case)
        if (!formData.amount || isNaN(parseFloat(formData.amount))) {
            setErrorMsg("Please enter a valid amount.");
            setActionLoading(false);
            return;
        }

        try {
            await createAdhocPayment(formData);
            setIsModalOpen(false);
            resetForm();
            fetchData();
            fetchStats();
        } catch (err) {
            console.error('Failed to create payment:', err);
            const errorData = err.response?.data;
            let msg = 'Unknown error';
            if (errorData?.error) msg = errorData.error;
            else if (errorData?.amount) msg = `Amount Error: ${errorData.amount[0]}`;
            else if (typeof errorData === 'object') msg = JSON.stringify(errorData);

            setErrorMsg(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');
        try {
            await updateAdhocPayment(selectedPayment.id, formData);
            setIsModalOpen(false);
            resetForm();
            fetchData();
            fetchStats();
        } catch (err) {
            console.error('Failed to update payment:', err);
            const errorData = err.response?.data;
            let msg = errorData?.error || 'Failed to update payment';
            if (errorData?.amount) msg = `Amount Error: ${errorData.amount[0]}`;
            setErrorMsg(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
            return;
        }

        setActionLoading(true);
        try {
            await deleteAdhocPayment(paymentId);
            fetchData();
            fetchStats();
        } catch (err) {
            console.error('Failed to delete payment:', err);
            alert(err.response?.data?.error || 'Failed to delete payment');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            employee: '',
            name: '',
            amount: '',
            component: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setSelectedPayment(null);
        setErrorMsg('');
    };

    const openEditModal = (payment) => {
        setSelectedPayment(payment);
        setFormData({
            employee: payment.employee,
            name: payment.name,
            amount: payment.amount,
            component: payment.component || '',
            date: payment.date,
            notes: payment.notes || ''
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusClass = (status) => `status-badge status-${status}`;

    return (
        <div className="bonus-container">
            {/* Header */}
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">Bonus <span className="title-accent">& Incentives</span></h1>
                    <p className="cinematic-subtitle">Manage One-Time Payments & Rewards</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-premium" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} /> Add Bonus
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            {stats && (
                <div className="bonus-stats-grid">
                    <div className="bonus-stat-card">
                        <span className="stat-label">Total Pending</span>
                        <div className="stat-value">₹{parseFloat(stats.total_pending || 0).toLocaleString()}</div>
                        <span className="stat-count">{stats.pending_count} payments</span>
                        <Clock className="stat-icon-bg" size={64} />
                    </div>
                    <div className="bonus-stat-card">
                        <span className="stat-label">Total Paid</span>
                        <div className="stat-value">₹{parseFloat(stats.total_paid || 0).toLocaleString()}</div>
                        <span className="stat-count">{stats.processed_count} payments</span>
                        <CheckCircle2 className="stat-icon-bg" size={64} />
                    </div>
                    <div className="bonus-stat-card">
                        <span className="stat-label">Total Payments</span>
                        <div className="stat-value">{stats.total_count}</div>
                        <span className="stat-count">All time</span>
                        <Gift className="stat-icon-bg" size={64} />
                    </div>
                    <div className="bonus-stat-card">
                        <span className="stat-label">Recent Activity</span>
                        <div className="stat-value">{stats.recent_payments?.length || 0}</div>
                        <span className="stat-count">Last 5 payments</span>
                        <TrendingUp className="stat-icon-bg" size={64} />
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="toolbar-premium">
                <div className="search-box-premium">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by employee name or payment name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} className="text-muted" />
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processed">Processed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
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
                            <th>Payment Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Component</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Loading data...</td></tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No payments found.</td></tr>
                        ) : (
                            filteredPayments.map(payment => (
                                <tr key={payment.id}>
                                    <td>
                                        <div className="emp-cell">
                                            <div className="salary-avatar-circle">{payment.employee_name?.[0]}</div>
                                            <div className="emp-info">
                                                <span className="emp-name-text">{payment.employee_name}</span>
                                                <span className="emp-id-text">{payment.employee_id_display}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{payment.name}</td>
                                    <td className="font-mono">₹{parseFloat(payment.amount || 0).toLocaleString()}</td>
                                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                                    <td>{payment.component_name || '-'}</td>
                                    <td>
                                        <span className={getStatusClass(payment.status)}>{payment.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {payment.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="action-btn text-blue"
                                                        onClick={() => openEditModal(payment)}
                                                        title="Edit Payment"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn text-red"
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        title="Delete Payment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
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
                                <h2 className="modal-title-text">{selectedPayment ? 'Edit Payment' : 'Add New Bonus'}</h2>
                                <p className="modal-subtitle-text">{selectedPayment ? 'Update payment details' : 'Create a new one-time payment'}</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={selectedPayment ? handleUpdatePayment : handleCreatePayment} style={{ display: 'contents' }}>
                            <div className="modal-body">
                                {errorMsg && (
                                    <div className="error-alert">
                                        <AlertCircle size={16} />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}
                                <div className="form-column">
                                    <div className="form-group">
                                        <label>Employee *</label>
                                        <select
                                            className="premium-select"
                                            required
                                            value={formData.employee}
                                            onChange={e => setFormData({ ...formData, employee: e.target.value })}
                                            disabled={selectedPayment}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Payment Name *</label>
                                        <input
                                            type="text"
                                            className="premium-input"
                                            required
                                            placeholder="e.g., Performance Bonus Q1"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (₹) *</label>
                                        <input
                                            type="number"
                                            className="premium-input"
                                            required
                                            min="1"
                                            step="0.01"
                                            placeholder="Enter amount"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-column">
                                    <div className="form-group">
                                        <label>Component (Optional)</label>
                                        <select
                                            className="premium-select"
                                            value={formData.component}
                                            onChange={e => setFormData({ ...formData, component: e.target.value })}
                                        >
                                            <option value="">None (Standard Bonus)</option>
                                            {components.map(comp => (
                                                <option key={comp.id} value={comp.id}>{comp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            className="premium-input"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            className="premium-input"
                                            rows="3"
                                            placeholder="Optional notes..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary-premium" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary-premium"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Saving...' : (selectedPayment ? 'Update Payment' : 'Create Payment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
