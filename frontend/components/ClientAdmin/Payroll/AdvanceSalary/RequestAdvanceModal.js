'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, Info, Calculator, AlertTriangle } from 'lucide-react';
import { createAdvance, getAllEmployees } from '@/api/api_clientadmin';

export default function RequestAdvanceModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        employee: '',
        principal_amount: '',
        tenure_months: '1',
        repayment_start_date: '',
        remarks: ''
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    useEffect(() => {
        // Default start date to next month
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        setFormData(prev => ({
            ...prev,
            repayment_start_date: nextMonth.toISOString().split('T')[0]
        }));

        const fetchEmployees = async () => {
            try {
                const res = await getAllEmployees();
                setEmployees(res.data.results || res.data || []);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAdvance(formData);
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    const monthlyDeduction = formData.principal_amount && formData.tenure_months
        ? (parseFloat(formData.principal_amount) / parseInt(formData.tenure_months)).toFixed(2)
        : 0;

    return (
        <div className="adv-modal-overlay">
            <div className="adv-modal-content card-glass animate-scale-up">
                <div className="adv-modal-header">
                    <div className="flex items-center gap-3">
                        <div className="adv-modal-icon-header"><Calculator size={20} /></div>
                        <div>
                            <h2 className="text-xl font-bold">Request Advance <span className="text-gold">Salary</span></h2>
                            <p className="text-xs text-muted">Submit a new request for financial assistance.</p>
                        </div>
                    </div>
                    <button className="adv-modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="adv-modal-form">
                    <div className="adv-form-grid">
                        <div className="adv-form-group col-span-full">
                            <label>Employee Selection</label>
                            <select
                                value={formData.employee}
                                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                required
                                disabled={fetchLoading}
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id_display})</option>
                                ))}
                            </select>
                        </div>

                        <div className="adv-form-group col-span-full">
                            <label>Amount Requested (₹)</label>
                            <div className="adv-input-wrapper">
                                <IndianRupee size={16} />
                                <input
                                    type="number"
                                    placeholder="Enter principal amount"
                                    value={formData.principal_amount}
                                    onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="adv-form-group col-span-full">
                            <div className="adv-modal-info">
                                <Info size={16} className="text-blue-400" />
                                <p>This advance will be automatically deducted in full from your <strong>next salary</strong>.</p>
                            </div>
                        </div>

                        <div className="adv-form-group col-span-full">
                            <label>Reason / Remarks</label>
                            <textarea
                                placeholder="State the reason for advance request..."
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                rows="3"
                                required
                            />
                        </div>
                    </div>



                    <div className="adv-modal-footer">
                        <button type="button" className="adv-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="adv-btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
