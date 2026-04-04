'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Calendar, AlignLeft, Info, Activity, Type, Plus } from 'lucide-react';
import { createHoliday, updateHoliday } from '@/api/api_clientadmin';

export default function HolidayModal({ isOpen, onClose, holiday, companyId, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        holiday_type: 'public',
        description: '',
        is_active: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (holiday) {
            setFormData({
                name: holiday.name || '',
                date: holiday.date || '',
                holiday_type: holiday.holiday_type || 'public',
                description: holiday.description || '',
                is_active: holiday.is_active ?? true
            });
        } else {
            setFormData({
                name: '',
                date: '',
                holiday_type: 'public',
                description: '',
                is_active: true
            });
        }
    }, [holiday, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.date) errs.date = 'Date is required';
        setValidationErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);
            setError('');

            const data = { ...formData, company: companyId };

            if (holiday?.id) {
                await updateHoliday(holiday.id, data);
            } else {
                await createHoliday(data);
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving holiday:', err);
            setError(err.response?.data?.message || 'Failed to save holiday');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="hol-modal-overlay" onClick={onClose}>
            <div className="hol-modal-content hol-modal--form" onClick={e => e.stopPropagation()}>
                <div className="hol-modal-header">
                    <div className="hol-modal-title-area">
                        <div className="hol-modal-icon">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3>{holiday ? 'Edit Company Holiday' : 'Add New Holiday'}</h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {holiday ? 'Update the details for this holiday' : 'Define a new non-working day for your team'}
                            </p>
                        </div>
                    </div>
                    <button className="hol-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {error && (
                    <div className="hol-modal-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="hol-modal-form">
                    <div className="hol-form-grid">
                        <div className="hol-form-field">
                            <label className="hol-label">
                                <Type size={14} /> <span>Holiday Name</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                className={`hol-input ${validationErrors.name ? 'error' : ''}`}
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. New Year's Day"
                            />
                            {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
                        </div>

                        <div className="hol-form-field">
                            <label className="hol-label">
                                <Calendar size={14} /> <span>Date</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                className={`hol-input ${validationErrors.date ? 'error' : ''}`}
                                value={formData.date}
                                onChange={handleInputChange}
                            />
                            {validationErrors.date && <span className="error-message">{validationErrors.date}</span>}
                        </div>

                        <div className="hol-form-field">
                            <label className="hol-label">
                                <Info size={14} /> <span>Holiday Category</span>
                            </label>
                            <select
                                name="holiday_type"
                                className="hol-select"
                                value={formData.holiday_type}
                                onChange={handleInputChange}
                            >
                                <option value="public">Public Holiday</option>
                                <option value="restricted">Restricted Holiday</option>
                                <option value="optional">Optional Holiday</option>
                            </select>
                        </div>

                        <div className="hol-form-field full-width">
                            <label className="hol-label">
                                <AlignLeft size={14} /> <span>Description (Optional)</span>
                            </label>
                            <textarea
                                name="description"
                                className="hol-textarea"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Add context like 'Post-festival' or 'Office Closure'..."
                                rows={3}
                            />
                        </div>

                        <div className="hol-form-field">
                            <div className="hol-toggle-group">
                                <div className="hol-toggle-info">
                                    <span className="hol-label" style={{ marginBottom: 0 }}>
                                        <Activity size={14} /> Status
                                    </span>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        Make this holiday active on the calendar
                                    </p>
                                </div>
                                <label className="hol-switch">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                    />
                                    <span className="hol-slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="hol-modal-footer">
                        <button type="button" className="hol-btn-sec" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="hol-btn-pri" disabled={submitting}>
                            {submitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {holiday ? <Activity size={18} /> : <Plus size={18} />}
                                    <span>{holiday ? 'Update Holiday' : 'Create Holiday'}</span>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
