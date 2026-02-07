import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './TaxSlabModal.css';

const TaxSlabModal = ({ isOpen, onClose, onSave, initialData, regime }) => {
    const [formData, setFormData] = useState({
        regime: 'new',
        min_income: '',
        max_income: '',
        tax_rate: '',
        cess: '4' // Default 4% cess
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    max_income: initialData.max_income || ''
                });
            } else {
                setFormData({
                    regime: regime || 'new',
                    min_income: '',
                    max_income: '',
                    tax_rate: '',
                    cess: '4'
                });
            }
            setErrors({});
        }
    }, [isOpen, initialData, regime]);

    const validate = () => {
        const newErrors = {};
        if (formData.min_income === '') newErrors.min_income = 'Min Income is required';
        if (formData.tax_rate === '') newErrors.tax_rate = 'Tax Rate is required';

        if (formData.max_income && Number(formData.max_income) <= Number(formData.min_income)) {
            newErrors.max_income = 'Max Income must be greater than Min Income';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const payload = {
                ...formData,
                max_income: formData.max_income === '' ? null : formData.max_income
            };
            onSave(payload);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>{initialData ? 'Edit Tax Slab' : 'Add New a Slab'}</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Tax Regime</label>
                        <select
                            value={formData.regime}
                            onChange={(e) => setFormData({ ...formData, regime: e.target.value })}
                            className="form-input"
                            disabled={!!initialData} // Lock regime on edit usually, or allow? Let's lock to keep it simple contextually
                        >
                            <option value="new">New Regime</option>
                            <option value="old">Old Regime</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Min Income (₹)</label>
                            <input
                                type="number"
                                value={formData.min_income}
                                onChange={(e) => setFormData({ ...formData, min_income: e.target.value })}
                                className={`form-input ${errors.min_income ? 'error' : ''}`}
                                placeholder="0"
                            />
                            {errors.min_income && <span className="error-text">{errors.min_income}</span>}
                        </div>

                        <div className="form-group">
                            <label>Max Income (₹)</label>
                            <input
                                type="number"
                                value={formData.max_income}
                                onChange={(e) => setFormData({ ...formData, max_income: e.target.value })}
                                className={`form-input ${errors.max_income ? 'error' : ''}`}
                                placeholder="Leave empty for unlimited"
                            />
                            <span className="help-text">Leave blank for "Above..."</span>
                            {errors.max_income && <span className="error-text">{errors.max_income}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tax Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                className={`form-input ${errors.tax_rate ? 'error' : ''}`}
                                placeholder="e.g. 5"
                            />
                            {errors.tax_rate && <span className="error-text">{errors.tax_rate}</span>}
                        </div>

                        <div className="form-group">
                            <label>Cess (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.cess}
                                onChange={(e) => setFormData({ ...formData, cess: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save Slab</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaxSlabModal;
