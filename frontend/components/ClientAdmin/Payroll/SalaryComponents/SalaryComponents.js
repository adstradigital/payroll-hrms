'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, X, DollarSign,
    Percent, Calculator, FileText, CheckCircle2, AlertCircle,
    Info, ArrowUpDown, Filter
} from 'lucide-react';
import {
    getSalaryComponents, createSalaryComponent,
    updateSalaryComponent, deleteSalaryComponent
} from '@/api/api_clientadmin';
import './SalaryComponents.css';

// --- MOCK DATA FOR DEMO IF API EMPTY ---
const MOCK_COMPONENTS = [
    { id: '1', name: 'Basic Salary', code: 'BASIC', component_type: 'earning', calculation_type: 'fixed', is_taxable: true, is_statutory: true, is_active: true },
    { id: '2', name: 'House Rent Allowance', code: 'HRA', component_type: 'earning', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 40, is_taxable: true, is_active: true },
    { id: '3', name: 'Provident Fund', code: 'PF', component_type: 'deduction', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 12, is_statutory: true, is_active: true },
    { id: '4', name: 'Professional Tax', code: 'PT', component_type: 'deduction', calculation_type: 'fixed', amount: 200, is_statutory: true, is_active: true },
];

const ComponentForm = ({ component, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        component_type: 'earning', // earning, deduction
        calculation_type: 'fixed', // fixed, percentage, formula
        amount: '',
        percentage_value: '',
        description: '',
        is_taxable: false,
        is_statutory: false,
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (component) {
            setFormData({
                name: component.name || '',
                code: component.code || '',
                component_type: component.component_type || 'earning',
                calculation_type: component.calculation_type || 'fixed',
                amount: component.amount || '',
                percentage_value: component.percentage_value || '',
                description: component.description || '',
                is_taxable: component.is_taxable || false,
                is_statutory: component.is_statutory || false,
                is_active: component.is_active !== false
            });
        }
    }, [component]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = { ...formData };
            if (payload.calculation_type !== 'fixed') payload.amount = 0;
            if (payload.calculation_type !== 'percentage') payload.percentage_value = 0;

            let res;
            if (component) {
                res = await updateSalaryComponent(component.id, payload);
            } else {
                res = await createSalaryComponent(payload);
            }
            onSuccess(res.data);
        } catch (err) {
            console.error("Save error:", err);
            setError(err.response?.data?.detail || "Failed to save salary component.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${formData.component_type === 'earning' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                            {formData.component_type === 'earning' ? <DollarSign size={20} /> : <ArrowUpDown size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{component ? 'Edit Component' : 'New Component'}</h3>
                            <p className="text-xs text-secondary">Configure earning or deduction rules</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon hover:bg-tertiary"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body space-y-4">
                    {error && (
                        <div className="p-3 bg-danger-light text-danger rounded-md text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Component Name <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Basic Salary"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="form-input uppercase"
                                placeholder="e.g. BASIC"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <div className="flex gap-2 p-1 bg-tertiary rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, component_type: 'earning' })}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.component_type === 'earning' ? 'bg-white shadow-sm text-success' : 'text-secondary hover:text-primary'
                                        }`}
                                >
                                    Earning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, component_type: 'deduction' })}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.component_type === 'deduction' ? 'bg-white shadow-sm text-danger' : 'text-secondary hover:text-primary'
                                        }`}
                                >
                                    Deduction
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Calculation</label>
                            <select
                                name="calculation_type"
                                value={formData.calculation_type}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="fixed">Fixed Amount</option>
                                <option value="percentage">Percentage of Basic</option>
                                <option value="formula">Custom Formula</option>
                            </select>
                        </div>
                    </div>

                    {formData.calculation_type === 'fixed' && (
                        <div className="form-group">
                            <label className="form-label">Default Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted">$</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="form-input pl-8"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    )}

                    {formData.calculation_type === 'percentage' && (
                        <div className="form-group">
                            <label className="form-label">Percentage Value</label>
                            <div className="relative">
                                <span className="absolute right-3 top-2.5 text-muted">%</span>
                                <input
                                    type="number"
                                    name="percentage_value"
                                    value={formData.percentage_value}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-muted mt-1">% of Basic Salary</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="2"
                            className="form-textarea"
                            placeholder="Optional description..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                name="is_statutory"
                                checked={formData.is_statutory}
                                onChange={handleChange}
                            />
                            <span className="checkbox-label">
                                <span className="font-medium">Statutory Component</span>
                                <span className="text-xs text-muted block">Legal requirement (PF, ESI)</span>
                            </span>
                        </label>

                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                name="is_taxable"
                                checked={formData.is_taxable}
                                onChange={handleChange}
                            />
                            <span className="checkbox-label">
                                <span className="font-medium">Taxable</span>
                                <span className="text-xs text-muted block">Subject to income tax</span>
                            </span>
                        </label>
                    </div>

                    <div className="pt-2 border-t border-color flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn ${formData.component_type === 'earning' ? 'btn-primary' : 'bg-danger text-white hover:bg-danger/90'}`}
                        >
                            {loading ? <span className="spinner-sm"></span> : 'Save Component'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function SalaryComponents() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, earning, deduction
    const [showForm, setShowForm] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            const res = await getSalaryComponents();
            if (res.data && Array.isArray(res.data.results || res.data)) {
                setComponents(res.data.results || res.data);
            } else {
                setComponents(MOCK_COMPONENTS);
            }
        } catch (error) {
            console.error("Error fetching components", error);
            setComponents(MOCK_COMPONENTS); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (comp) => {
        setSelectedComponent(comp);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this component?')) return;
        try {
            await deleteSalaryComponent(id);
            setComponents(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            alert("Failed to delete component");
        }
    };

    const handleSuccess = (data) => {
        fetchComponents();
        setShowForm(false);
        setSelectedComponent(null);
    };

    const filteredComponents = components.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || c.component_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const earnings = filteredComponents.filter(c => c.component_type === 'earning');
    const deductions = filteredComponents.filter(c => c.component_type === 'deduction');

    return (
        <div className="salary-components-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="text-brand" /> Salary Components
                    </h1>
                    <p className="text-secondary">Manage earnings, deductions, and statutory components</p>
                </div>
                <button onClick={() => { setSelectedComponent(null); setShowForm(true); }} className="btn btn-primary">
                    <Plus size={18} /> Add Component
                </button>
            </div>

            {/* Toolbar */}
            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="toolbar-input"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setTypeFilter('earning')}
                        className={`filter-chip ${typeFilter === 'earning' ? 'active' : ''}`}
                    >
                        Earnings
                    </button>
                    <button
                        onClick={() => setTypeFilter('deduction')}
                        className={`filter-chip ${typeFilter === 'deduction' ? 'active' : ''}`}
                    >
                        Deductions
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading components...</p>
                </div>
            ) : (
                <div className="components-grid">
                    {/* Earnings Column */}
                    {(typeFilter === 'all' || typeFilter === 'earning') && (
                        <div className="grid-column">
                            <h3 className="column-title text-success">
                                <DollarSign size={18} /> Earnings ({earnings.length})
                            </h3>
                            <div className="cards-stack">
                                {earnings.map(comp => (
                                    <div key={comp.id} className="component-card group">
                                        <div className="card-top">
                                            <div className="icon-box bg-success-light text-success">
                                                <DollarSign size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{comp.name}</h4>
                                                    <span className="badge-code">{comp.code}</span>
                                                </div>
                                                <p className="text-xs text-secondary mt-1">
                                                    {comp.calculation_type === 'fixed'
                                                        ? 'Fixed Amount'
                                                        : `Percentage (${comp.percentage_value}%)`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="tags-row">
                                            {comp.is_taxable && <span className="tag">Taxable</span>}
                                            {comp.is_statutory && <span className="tag">Statutory</span>}
                                            <span className={`tag ${comp.is_active ? 'active' : 'inactive'}`}>
                                                {comp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(comp)} className="action-btn" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(comp.id)} className="action-btn text-danger" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {earnings.length === 0 && <div className="empty-placeholder">No earnings found</div>}
                            </div>
                        </div>
                    )}

                    {/* Deductions Column */}
                    {(typeFilter === 'all' || typeFilter === 'deduction') && (
                        <div className="grid-column">
                            <h3 className="column-title text-danger">
                                <ArrowUpDown size={18} /> Deductions ({deductions.length})
                            </h3>
                            <div className="cards-stack">
                                {deductions.map(comp => (
                                    <div key={comp.id} className="component-card group">
                                        <div className="card-top">
                                            <div className="icon-box bg-danger-light text-danger">
                                                <ArrowUpDown size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{comp.name}</h4>
                                                    <span className="badge-code">{comp.code}</span>
                                                </div>
                                                <p className="text-xs text-secondary mt-1">
                                                    {comp.calculation_type === 'fixed'
                                                        ? 'Fixed Amount'
                                                        : `Percentage (${comp.percentage_value}%)`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="tags-row">
                                            {comp.is_taxable && <span className="tag">Taxable</span>}
                                            {comp.is_statutory && <span className="tag">Statutory</span>}
                                            <span className={`tag ${comp.is_active ? 'active' : 'inactive'}`}>
                                                {comp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(comp)} className="action-btn" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(comp.id)} className="action-btn text-danger" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {deductions.length === 0 && <div className="empty-placeholder">No deductions found</div>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <ComponentForm
                    component={selectedComponent}
                    onClose={() => { setShowForm(false); setSelectedComponent(null); }}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
