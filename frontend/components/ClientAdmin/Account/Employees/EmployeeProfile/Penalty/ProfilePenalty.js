'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, Calendar, Clock,
    Info, CreditCard, ChevronRight,
    ArrowDownRight, MoreVertical,
    History, Filter, Download, X as XIcon
} from 'lucide-react';
import {
    getAdhocPayments,
    getSalaryComponents,
    deleteAdhocPayment
} from '@/api/api_clientadmin';
import PenaltyDrawer from './PenaltyDrawer';
import './ProfilePenalty.css';

export default function ProfilePenalty({ employeeId }) {
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({
        total: 0,
        pending: 0,
        processed: 0
    });
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedPenalty, setSelectedPenalty] = useState(null);

    useEffect(() => {
        if (employeeId) {
            fetchData();
        }
    }, [employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch adhoc payments and salary components in parallel
            const [paymentsRes, componentsRes] = await Promise.all([
                getAdhocPayments({ employee: employeeId }),
                getSalaryComponents({ component_type: 'deduction' })
            ]);

            const deductionComponentIds = new Set(componentsRes.data.map(c => c.id));

            // Filter payments that are deductions
            // If component is null, we might still treat it as penalty if it's in this list?
            // Usually penalties should have a component. 
            // For now, let's show all where component is a deduction OR if it looks like a penalty
            const penaltyList = paymentsRes.data.filter(p => {
                if (!p.component) return true; // Treat as penalty if in this tab context? Or maybe label it.
                return deductionComponentIds.has(p.component);
            });

            setPenalties(penaltyList);

            // Calculate summary
            const total = penaltyList.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const pending = penaltyList.filter(p => p.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const processed = penaltyList.filter(p => p.status === 'processed').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

            setSummary({ total, pending, processed });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching penalties:', err);
            setError('Failed to load penalty records.');
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleAddPenalty = () => {
        setSelectedPenalty(null);
        setIsDrawerOpen(true);
    };

    const handleEditPenalty = (penalty) => {
        setSelectedPenalty(penalty);
        setIsDrawerOpen(true);
    };

    const handleDeletePenalty = async (id) => {
        if (window.confirm('Are you sure you want to delete this penalty record?')) {
            try {
                await deleteAdhocPayment(id);
                fetchData();
            } catch (err) {
                console.error('Error deleting penalty:', err);
                alert('Failed to delete penalty.');
            }
        }
    };

    if (loading) {
        return (
            <div className="penalty-loading">
                <div className="spinner"></div>
                <p>Loading penalty records...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="penalty-error-state">
                <AlertTriangle size={48} />
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button onClick={fetchData} className="btn-retry">Retry</button>
            </div>
        );
    }

    return (
        <div className="profile-penalty-container animate-fade-in">
            {/* Header Summary */}
            <div className="penalty-summary-grid">
                <div className="penalty-stat-card total">
                    <div className="stat-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Penalties</span>
                        <h2 className="stat-value">{formatCurrency(summary.total)}</h2>
                    </div>
                </div>

                <div className="penalty-stat-card pending">
                    <div className="stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">To be Deducted</span>
                        <h2 className="stat-value">{formatCurrency(summary.pending)}</h2>
                    </div>
                    <div className="stat-tag">Next Payroll</div>
                </div>

                <div className="penalty-stat-card processed">
                    <div className="stat-icon">
                        <History size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Recovered</span>
                        <h2 className="stat-value">{formatCurrency(summary.processed)}</h2>
                    </div>
                </div>
            </div>

            <div className="penalty-list-section card">
                <div className="section-header">
                    <div className="header-left">
                        <History size={20} />
                        <h3>Penalty History</h3>
                    </div>
                    <div className="header-actions">
                        <button className="btn-add-penalty" onClick={handleAddPenalty}>
                            <ArrowDownRight size={14} /> Add Penalty
                        </button>
                        <button className="btn-icon-text">
                            <Filter size={14} /> Filter
                        </button>
                    </div>
                </div>

                <div className="penalty-table-wrapper">
                    {penalties.length > 0 ? (
                        <table className="penalty-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Component</th>
                                    <th>Status</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {penalties.map((penalty) => (
                                    <tr key={penalty.id}>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                {new Date(penalty.date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="desc-cell">
                                                <span className="penalty-name">{penalty.name}</span>
                                                {penalty.notes && <span className="penalty-notes">{penalty.notes}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="component-badge">
                                                {penalty.component_name || 'Manual Penalty'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${penalty.status}`}>
                                                {penalty.status.charAt(0).toUpperCase() + penalty.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="text-right amount-cell">
                                            {formatCurrency(penalty.amount)}
                                        </td>
                                        <td className="text-center">
                                            <div className="table-actions">
                                                <button
                                                    className="action-btn edit"
                                                    title="Edit"
                                                    onClick={() => handleEditPenalty(penalty)}
                                                    disabled={penalty.status === 'processed'}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    title="Delete"
                                                    onClick={() => handleDeletePenalty(penalty.id)}
                                                    disabled={penalty.status === 'processed'}
                                                >
                                                    <XIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-penalty-state">
                            <Info size={48} />
                            <h3>No Penalty Records</h3>
                            <p>Good job! There are no penalties or fines recorded for this employee.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="penalty-info-note">
                <Info size={16} />
                <p>Penalties marked as <strong>Pending</strong> will be automatically deducted in the next payroll generation cycle. Once deducted, their status will change to <strong>Processed</strong>.</p>
            </div>

            <PenaltyDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                employeeId={employeeId}
                penalty={selectedPenalty}
                onSuccess={fetchData}
            />
        </div>
    );
}
