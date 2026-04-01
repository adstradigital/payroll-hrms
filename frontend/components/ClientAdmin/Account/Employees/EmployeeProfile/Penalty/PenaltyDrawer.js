'use client';

import React, { useState, useEffect } from 'react';
import {
    X as XIcon, AlertTriangle, Calendar as CalendarIcon,
    DollarSign, Type, FileText, Loader,
    AlertCircle
} from 'lucide-react';
import {
    createAdhocPayment,
    updateAdhocPayment,
    getSalaryComponents
} from '@/api/api_clientadmin';
import './PenaltyDrawer.css';

export default function PenaltyDrawer({
    isOpen,
    onClose,
    employeeId,
    penalty = null,
    onSuccess
}) {
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        component: '',
        notes: ''
    });
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingComponents, setFetchingComponents] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchComponents();
            if (penalty) {
                setFormData({
                    name: penalty.name || '',
                    amount: penalty.amount || '',
                    date: penalty.date || new Date().toISOString().split('T')[0],
                    component: penalty.component || '',
                    notes: penalty.notes || ''
                });
            } else {
                setFormData({
                    name: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    component: '',
                    notes: ''
                });
            }
            setError(null);
        }
    }, [isOpen, penalty]);

    const fetchComponents = async () => {
        setFetchingComponents(true);
        try {
            const res = await getSalaryComponents({ component_type: 'deduction' });
            setComponents(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch deduction components:', err);
        } finally {
            setFetchingComponents(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                employee: employeeId,
                amount: parseFloat(formData.amount),
                status: penalty ? penalty.status : 'pending'
            };

            if (penalty) {
                await updateAdhocPayment(penalty.id, payload);
            } else {
                await createAdhocPayment(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving penalty:', err);
            const errorData = err.response?.data;
            let msg = 'Failed to save penalty record.';
            if (errorData?.error) msg = errorData.error;
            else if (errorData) msg = JSON.stringify(errorData);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && !loading) return null;

    return (
        <>
            <div className={`penalty-drawer-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
            <div className={`penalty-drawer ${isOpen ? 'open' : ''}`}>
                <div className="penalty-drawer-header">
                    <h2>
                        <AlertTriangle size={24} className="text-warning" />
                        {penalty ? 'Edit Penalty' : 'Add New Penalty'}
                    </h2>
                    <button className="btn-close-drawer" onClick={onClose}>
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="penalty-drawer-body">
                    <form id="penalty-form" className="penalty-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-message">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name">Penalty Reason / Title *</label>
                            <div className="input-with-icon">
                                <FileText size={18} className="icon" />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="e.g., Late Arrival Fine, Resource Damage"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">Amount (INR) *</label>
                            <div className="input-with-icon">
                                <DollarSign size={18} className="icon" />
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">Effective Date *</label>
                            <div className="input-with-icon">
                                <CalendarIcon size={18} className="icon" />
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="component">Deduction Component (Optional)</label>
                            <div className="input-with-icon">
                                <Type size={18} className="icon" />
                                <select
                                    id="component"
                                    name="component"
                                    value={formData.component}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="">Select a component</option>
                                    {components.map(comp => (
                                        <option key={comp.id} value={comp.id}>
                                            {comp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <span className="form-hint">Choose how this deduction should be categorized in payslip.</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Additional Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                placeholder="Provide more details about why this penalty is being applied..."
                                value={formData.notes}
                                onChange={handleChange}
                                className="form-textarea"
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="penalty-drawer-footer">
                    <button type="button" className="btn-cancel-penalty" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="penalty-form"
                        className="btn-save-penalty"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            penalty ? 'Update Penalty' : 'Add Penalty'
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-with-icon .icon {
                    position: absolute;
                    left: 12px;
                    color: var(--text-muted);
                }
                .input-with-icon .form-input,
                .input-with-icon .form-select {
                    padding-left: 40px;
                    width: 100%;
                }
                .form-hint {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                }
                .text-warning {
                    color: #f59e0b;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .penalty-drawer-overlay.show {
                    display: block;
                }
            `}</style>
        </>
    );
}
