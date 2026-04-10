import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Loader2, Calendar, FileText, Tag, User, CalendarRange, Clock, Info } from 'lucide-react';
import { applyLeave, getAllEmployees, getLeaveBalance } from '@/api/api_clientadmin';
import './ApplyLeaveModal.css';

export default function ApplyLeaveModal({ isOpen, onClose, currentUser, leaveTypes, onSuccess, isMyLeave = false }) {
    const [formData, setFormData] = useState({
        employee: currentUser?.employee_profile?.id || currentUser?.employee_id || currentUser?.id || '',
        // Ensure leave_type is string for consistent handling
        leave_type: '',
        start_date: '',
        end_date: '',
        start_day_type: 'full',
        end_day_type: 'full',
        reason: '',
        document: null
    });

    const [employees, setEmployees] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Check if current user is admin
    const isAdmin = currentUser?.is_staff || currentUser?.role === 'admin' || currentUser?.is_admin;

    useEffect(() => {
        if (currentUser?.id) {
            setFormData(prev => ({ ...prev, employee: currentUser.id }));
        }
    }, [currentUser]);

    useEffect(() => {
        if (isOpen && isAdmin && !isMyLeave) {
            fetchEmployees();
        }
    }, [isOpen, isAdmin, isMyLeave]);

    useEffect(() => {
        if (formData.leave_type && formData.employee) {
            fetchLeaveBalance();
        }
    }, [formData.leave_type, formData.employee]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await getAllEmployees();
            const employeesData = res.data.results || (Array.isArray(res.data) ? res.data : []);
            setEmployees(employeesData);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveBalance = async () => {
        try {
            const res = await getLeaveBalance(formData.employee);
            const balances = res.data.results || (Array.isArray(res.data) ? res.data : []);
            const selectedTypeBalance = balances.find(
                b => String(b.leave_type) === String(formData.leave_type)
            );
            setLeaveBalance(selectedTypeBalance || null);
        } catch (err) {
            console.error('Error fetching leave balance:', err);
            setLeaveBalance(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, document: file }));

        if (validationErrors.document) {
            setValidationErrors(prev => ({ ...prev, document: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (isAdmin && !isMyLeave && !formData.employee) {
            errors.employee = 'Please select an employee';
        }

        if (!formData.leave_type) {
            errors.leave_type = 'Please select a leave type';
        }

        if (!formData.start_date) {
            errors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            errors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            if (endDate < startDate) {
                errors.end_date = 'End date must be after or equal to start date';
            }
        }

        if (!formData.reason.trim()) {
            errors.reason = 'Reason is required';
        }

        // Check if selected leave type requires document
        const selectedLeaveType = leaveTypes.find(lt => String(lt.id) === String(formData.leave_type));
        if (selectedLeaveType?.requires_document && !formData.document) {
            errors.document = 'Document is required for this leave type';
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

            const submitData = new FormData();
            submitData.append('employee', formData.employee);
            submitData.append('leave_type', formData.leave_type);
            submitData.append('start_date', formData.start_date);
            submitData.append('end_date', formData.end_date);
            submitData.append('start_day_type', formData.start_day_type);
            submitData.append('end_day_type', formData.end_day_type);
            submitData.append('reason', formData.reason);

            console.log('Submitting Leave Request Data:', {
                employee: formData.employee,
                leave_type: formData.leave_type,
                start_date: formData.start_date,
                end_date: formData.end_date
            });

            if (formData.document) {
                submitData.append('document', formData.document);
            }

            await applyLeave(submitData);

            // Success - call the callback and close modal
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error('Error submitting leave request:', err);

            // Handle structured backend errors
            if (err.response?.data) {
                const data = err.response.data;
                // Check if it's a specific field error object
                if (typeof data === 'object' && !Array.isArray(data)) {
                    const fieldErrors = Object.entries(data).map(([key, msgs]) => {
                        const msg = Array.isArray(msgs) ? msgs.join(', ') : msgs;
                        return `${key}: ${msg}`;
                    }).join(' | ');
                    setError(fieldErrors || 'Failed to submit leave request.');
                } else {
                    setError(data.message || 'Failed to submit leave request. Please try again.');
                }
            } else {
                setError('Failed to submit leave request. Please check your connection.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getSelectedLeaveType = () => {
        return leaveTypes.find(lt => String(lt.id) === String(formData.leave_type));
    };

    const calculateDays = () => {
        if (!formData.start_date || !formData.end_date) return 0;

        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);

        if (start.getTime() === end.getTime()) {
            // Single day
            if (formData.start_day_type === 'full') return 1;
            return 0.5;
        }

        // Multi-day
        let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (formData.start_day_type !== 'full') days -= 0.5;
        if (formData.end_day_type !== 'full') days -= 0.5;

        return days;
    };

    if (!isOpen) return null;

    const selectedLeaveType = getSelectedLeaveType();
    const requestedDays = calculateDays();
    const availableBalance = leaveBalance?.available || 0;
    const hasInsufficientBalance = leaveBalance && requestedDays > availableBalance;

    return (
        <div className="apply-leave-modal-overlay" onClick={onClose}>
            <div className="apply-leave-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="apply-leave-modal__header">
                    <div className="header-title">
                        <div className="header-icon-wrapper">
                            <CalendarRange size={24} />
                        </div>
                        <div>
                            <h2>Apply for Leave</h2>
                            <p className="header-subtitle">Submit your time off request</p>
                        </div>
                    </div>
                    <button className="apply-leave-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="apply-leave-modal__error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="apply-leave-form">
                    <div className="form-content-area">
                        {/* Employee Selection (Admin Only, and not on personal page) */}
                        {isAdmin && !isMyLeave && (
                            <div className="form-group">
                                <label htmlFor="employee">
                                    <User size={16} />
                                    <span>Employee</span> <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <select
                                        id="employee"
                                        name="employee"
                                        value={formData.employee}
                                        onChange={handleInputChange}
                                        className={validationErrors.employee ? 'error' : ''}
                                        disabled={loading}
                                        style={{ cursor: 'pointer', zIndex: 10 }}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name} ({emp.employee_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {validationErrors.employee && (
                                    <span className="error-message">{validationErrors.employee}</span>
                                )}
                            </div>
                        )}

                        {/* Leave Type */}
                        <div className="form-group">
                            <label htmlFor="leave_type">
                                <Tag size={16} />
                                <span>Leave Type</span> <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <select
                                    id="leave_type"
                                    name="leave_type"
                                    value={formData.leave_type}
                                    onChange={handleInputChange}
                                    className={validationErrors.leave_type ? 'error' : ''}
                                    style={{ cursor: 'pointer', zIndex: 10 }}
                                >
                                    <option value="">{leaveTypes.length === 0 ? 'No Leave Types Available' : 'Select Leave Type'}</option>
                                    {leaveTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name} ({type.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {validationErrors.leave_type && (
                                <span className="error-message">{validationErrors.leave_type}</span>
                            )}
                        </div>

                        {/* Leave Balance Display */}
                        {leaveBalance && formData.leave_type && (
                            <div className={`leave-balance-info ${hasInsufficientBalance ? 'insufficient' : 'sufficient'}`}>
                                <div className="balance-icon">
                                    {hasInsufficientBalance ? <AlertCircle size={24} /> : <Info size={24} />}
                                </div>
                                <div className="balance-content">
                                    <div className="balance-item">
                                        <span className="balance-label">Available Balance:</span>
                                        <span className="balance-value">{availableBalance} days</span>
                                    </div>
                                    {requestedDays > 0 && (
                                        <>
                                            <div className="balance-item">
                                                <span className="balance-label">Requested:</span>
                                                <span className="balance-value">{requestedDays} days</span>
                                            </div>
                                            {hasInsufficientBalance && (
                                                <div className="balance-warning">
                                                    <span>Insufficient balance for this request</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="dates-section">
                            <div className="section-label">
                                <Clock size={16} />
                                <span>Duration Details</span>
                            </div>
                            
                            {/* Date Range */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start_date">
                                        Start Date <span className="required">*</span>
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="date"
                                            id="start_date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            className={validationErrors.start_date ? 'error' : ''}
                                        />
                                    </div>
                                    {validationErrors.start_date && (
                                        <span className="error-message">{validationErrors.start_date}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end_date">
                                        End Date <span className="required">*</span>
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="date"
                                            id="end_date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            className={validationErrors.end_date ? 'error' : ''}
                                        />
                                    </div>
                                    {validationErrors.end_date && (
                                        <span className="error-message">{validationErrors.end_date}</span>
                                    )}
                                </div>
                            </div>

                            {/* Day Type Selection */}
                            <div className="form-row form-row--subtle">
                                <div className="form-group">
                                    <label htmlFor="start_day_type">Start Day Type</label>
                                    <div className="input-wrapper">
                                        <select
                                            id="start_day_type"
                                            name="start_day_type"
                                            value={formData.start_day_type}
                                            onChange={handleInputChange}
                                        >
                                            <option value="full">Full Day</option>
                                            <option value="first_half">First Half</option>
                                            <option value="second_half">Second Half</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end_day_type">End Day Type</label>
                                    <div className="input-wrapper">
                                        <select
                                            id="end_day_type"
                                            name="end_day_type"
                                            value={formData.end_day_type}
                                            onChange={handleInputChange}
                                        >
                                            <option value="full">Full Day</option>
                                            <option value="first_half">First Half</option>
                                            <option value="second_half">Second Half</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="form-group">
                            <label htmlFor="reason">
                                <FileText size={16} />
                                <span>Reason</span> <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Please provide a detailed reason for your leave request..."
                                    className={validationErrors.reason ? 'error textarea-modern' : 'textarea-modern'}
                                />
                            </div>
                            {validationErrors.reason && (
                                <span className="error-message">{validationErrors.reason}</span>
                            )}
                        </div>

                        {/* Document Upload (Conditional) */}
                        {selectedLeaveType?.requires_document && (
                            <div className="form-group document-upload-group">
                                <label htmlFor="document">
                                    <Upload size={16} />
                                    <span>Supporting Document</span> <span className="required">*</span>
                                </label>
                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        id="document"
                                        name="document"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className={validationErrors.document ? 'error' : ''}
                                    />
                                    <label htmlFor="document" className={`file-upload-label ${formData.document ? 'has-file' : ''}`}>
                                        <div className="file-upload-icon-container">
                                            <Upload size={24} />
                                        </div>
                                        <div className="file-upload-text">
                                            <span className="file-name">{formData.document ? formData.document.name : 'Click to browse or drag & drop'}</span>
                                            <span className="file-hint">Accepted formats: PDF, JPG, PNG</span>
                                        </div>
                                    </label>
                                </div>
                                {validationErrors.document && (
                                    <span className="error-message">{validationErrors.document}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="apply-leave-modal__actions">
                        <button
                            type="button"
                            className="apply-leave-modal__btn apply-leave-modal__btn--secondary"
                            onClick={onClose}
                            disabled={submitting}
                            style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="apply-leave-modal__btn apply-leave-modal__btn--primary"
                            disabled={submitting || hasInsufficientBalance}
                            style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: (submitting || hasInsufficientBalance) ? 'not-allowed' : 'pointer', opacity: (submitting || hasInsufficientBalance) ? 0.7 : 1 }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

