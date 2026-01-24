'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
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
        <div className="leave-type-modal-overlay" onClick={onClose}>
            <div className="leave-type-modal" onClick={e => e.stopPropagation()}>
                <div className="leave-type-modal__header">
                    <h2>{holiday ? 'Edit Holiday' : 'Add Holiday'}</h2>
                    <button className="leave-type-modal__close" onClick={onClose}><X size={20} /></button>
                </div>

                {error && (
                    <div className="leave-type-modal__error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="holiday-modal-form" style={{ padding: '1.5rem' }}>
                    <div className="holiday-form-group">
                        <label>Holiday Name *</label>
                        <input
                            type="text"
                            name="name"
                            className={`holiday-form-input ${validationErrors.name ? 'error' : ''}`}
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. New Year's Day"
                        />
                        {validationErrors.name && <span className="error-message">{validationErrors.name}</span>}
                    </div>

                    <div className="holiday-form-group">
                        <label>Date *</label>
                        <input
                            type="date"
                            name="date"
                            className={`holiday-form-input ${validationErrors.date ? 'error' : ''}`}
                            value={formData.date}
                            onChange={handleInputChange}
                        />
                        {validationErrors.date && <span className="error-message">{validationErrors.date}</span>}
                    </div>

                    <div className="holiday-form-group">
                        <label>Type</label>
                        <select
                            name="holiday_type"
                            className="holiday-form-select"
                            value={formData.holiday_type}
                            onChange={handleInputChange}
                        >
                            <option value="public">Public Holiday</option>
                            <option value="restricted">Restricted Holiday</option>
                            <option value="optional">Optional Holiday</option>
                        </select>
                    </div>

                    <div className="holiday-form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            className="holiday-form-textarea"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Optional holiday details..."
                        />
                    </div>

                    <div className="holiday-form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                            />
                            <span>Is Active</span>
                        </label>
                    </div>

                    <div className="leave-type-modal__actions" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : (holiday ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
