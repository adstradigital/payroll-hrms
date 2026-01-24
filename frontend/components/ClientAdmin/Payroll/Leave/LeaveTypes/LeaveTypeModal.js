import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { createLeaveType, updateLeaveType } from '@/api/api_clientadmin';
import './LeaveTypeModal.css';

export default function LeaveTypeModal({ isOpen, onClose, leaveType, companyId, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        days_per_year: '12',
        accrual_type: 'full_year',
        reset_cycle: 'calendar',
        max_consecutive_days: '3',
        is_paid: true,
        is_carry_forward: false,
        max_carry_forward_days: '0',
        is_encashable: false,
        applicable_after_months: '0',
        requires_document: false,
        is_active: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (leaveType) {
            // Editing existing leave type
            setFormData({
                name: leaveType.name || '',
                description: leaveType.description || '',
                days_per_year: String(leaveType.days_per_year || '12'),
                accrual_type: leaveType.accrual_type || 'full_year',
                reset_cycle: leaveType.reset_cycle || 'calendar',
                max_consecutive_days: String(leaveType.max_consecutive_days || '3'),
                is_paid: leaveType.is_paid ?? true,
                is_carry_forward: leaveType.is_carry_forward ?? false,
                max_carry_forward_days: String(leaveType.max_carry_forward_days || '0'),
                is_encashable: leaveType.is_encashable ?? false,
                applicable_after_months: String(leaveType.applicable_after_months || '0'),
                requires_document: leaveType.requires_document ?? false,
                is_active: leaveType.is_active ?? true
            });

            // If any advanced setting is enabled, show them by default
            if (leaveType.is_encashable || (leaveType.applicable_after_months && parseInt(leaveType.applicable_after_months) > 0) || leaveType.requires_document || !leaveType.is_active || leaveType.is_carry_forward) {
                setShowAdvanced(true);
            }
        }
    }, [leaveType]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        let finalValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({ ...prev, [name]: finalValue }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.days_per_year || parseFloat(formData.days_per_year) <= 0) {
            errors.days_per_year = 'Days per year must be greater than 0';
        }

        if (!formData.max_consecutive_days || parseInt(formData.max_consecutive_days) <= 0) {
            errors.max_consecutive_days = 'Max consecutive days must be greater than 0';
        }

        if (formData.is_carry_forward) {
            if (!formData.max_carry_forward_days || parseFloat(formData.max_carry_forward_days) < 0) {
                errors.max_carry_forward_days = 'Max carry forward days must be 0 or greater';
            }
        }

        if (parseInt(formData.applicable_after_months) < 0) {
            errors.applicable_after_months = 'Applicable after months cannot be negative';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const submitData = {
                ...formData,
                days_per_year: parseFloat(formData.days_per_year),
                max_consecutive_days: parseInt(formData.max_consecutive_days),
                max_carry_forward_days: parseFloat(formData.max_carry_forward_days),
                applicable_after_months: parseInt(formData.applicable_after_months)
            };

            if (leaveType?.id) {
                // Update existing
                await updateLeaveType(leaveType.id, submitData);
            } else {
                // Create new (including duplicate)
                if (companyId) {
                    submitData.company = companyId;
                }
                await createLeaveType(submitData);
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Error saving leave type:', err);
            setError(err.response?.data?.message || 'Failed to save leave type. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="leave-type-modal-overlay" onClick={onClose}>
            <div className="leave-type-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="leave-type-modal__header">
                    <h2>{leaveType ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
                    <button className="leave-type-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="leave-type-modal__error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="leave-type-form">
                    {/* Basic Information */}
                    <div className="form-section">
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label htmlFor="name">
                                    Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Casual Leave"
                                    className={validationErrors.name ? 'error' : ''}
                                />
                                {validationErrors.name && (
                                    <span className="error-message">{validationErrors.name}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="accrual_type">Accrual Strategy</label>
                                <select
                                    id="accrual_type"
                                    name="accrual_type"
                                    value={formData.accrual_type}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="full_year">Full Year (At Start)</option>
                                    <option value="monthly">Monthly Accrual</option>
                                    <option value="quarterly">Quarterly Accrual</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reset_cycle">Reset Cycle</label>
                                <select
                                    id="reset_cycle"
                                    name="reset_cycle"
                                    value={formData.reset_cycle}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="calendar">Calendar Year (Jan-Dec)</option>
                                    <option value="fiscal">Fiscal Year (Apr-Mar)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="days_per_year">
                                    Total Days Per Year <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="days_per_year"
                                    name="days_per_year"
                                    value={formData.days_per_year}
                                    onChange={handleInputChange}
                                    step="0.5"
                                    min="0"
                                    className={validationErrors.days_per_year ? 'error' : ''}
                                />
                                {validationErrors.days_per_year && (
                                    <span className="error-message">{validationErrors.days_per_year}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="max_consecutive_days">
                                    Max Consecutive Days <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="max_consecutive_days"
                                    name="max_consecutive_days"
                                    value={formData.max_consecutive_days}
                                    onChange={handleInputChange}
                                    min="1"
                                    className={validationErrors.max_consecutive_days ? 'error' : ''}
                                />
                                {validationErrors.max_consecutive_days && (
                                    <span className="error-message">{validationErrors.max_consecutive_days}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_paid"
                                    checked={formData.is_paid}
                                    onChange={handleInputChange}
                                />
                                <span>Is Paid Leave</span>
                            </label>
                        </div>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
                        <div className={`toggle-icon ${showAdvanced ? 'open' : ''}`}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 5l4 4 4-4" />
                            </svg>
                        </div>
                    </div>

                    {showAdvanced && (
                        <div className="advanced-section">
                            <div className="form-group">
                                <label htmlFor="description">Description (Optional)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={2}
                                    placeholder="Brief description..."
                                />
                            </div>

                            <div className="form-checkboxes">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_carry_forward"
                                        checked={formData.is_carry_forward}
                                        onChange={handleInputChange}
                                    />
                                    <span>Allow Carry Forward</span>
                                </label>

                                {formData.is_carry_forward && (
                                    <div className="form-group nested-group">
                                        <label htmlFor="max_carry_forward_days">Max Carry Forward Days</label>
                                        <input
                                            type="number"
                                            id="max_carry_forward_days"
                                            name="max_carry_forward_days"
                                            value={formData.max_carry_forward_days}
                                            onChange={handleInputChange}
                                            step="0.5"
                                            min="0"
                                        />
                                    </div>
                                )}

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="is_encashable"
                                        checked={formData.is_encashable}
                                        onChange={handleInputChange}
                                    />
                                    <span>Is Encashable</span>
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="requires_document"
                                        checked={formData.requires_document}
                                        onChange={handleInputChange}
                                    />
                                    <span>Requires Document</span>
                                </label>

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

                            <div className="form-group">
                                <label htmlFor="applicable_after_months">
                                    Available After (Months)
                                </label>
                                <input
                                    type="number"
                                    id="applicable_after_months"
                                    name="applicable_after_months"
                                    value={formData.applicable_after_months}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                                <small className="form-hint">Service period required before this leave can be taken</small>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="leave-type-modal__actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {leaveType ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                leaveType ? 'Update Leave Type' : 'Create Leave Type'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
