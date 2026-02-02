'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, Layers,
    CheckCircle2, AlertCircle, ChevronRight, X,
    DollarSign, ArrowUpDown, Settings, Save, Loader2,
    Percent, Hash
} from 'lucide-react';
import {
    getSalaryStructures, createSalaryStructure,
    updateSalaryStructure, deleteSalaryStructure,
    getSalaryComponents, updateSalaryStructureComponents, apiClient
} from '@/api/api_clientadmin';
import './SalaryStructure.css';

// --- SUB-COMPONENTS ---

const StructureForm = ({ structure, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (structure) setFormData({ name: structure.name, description: structure.description, is_active: structure.is_active });
    }, [structure]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (structure) {
                res = await updateSalaryStructure(structure.id, formData);
            } else {
                res = await createSalaryStructure(formData);
            }
            onSuccess(res.data);
        } catch (e) {
            console.error("Error saving structure:", e);
            alert("Error saving structure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="text-xl font-serif" style={{ color: 'var(--text-primary)' }}>{structure ? 'Edit Structure' : 'New Structure'}</h3>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="field-label-gold">Structure Name</label>
                        <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Grade A" />
                    </div>
                    <div className="form-group">
                        <label className="field-label-gold">Description</label>
                        <textarea className="form-textarea" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <label className="checkbox-wrapper">
                        <input type="checkbox" className="accent-gold w-4 h-4" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Status</span>
                    </label>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-gold">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Save Structure</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ComponentManager = ({ structure, onClose }) => {
    const [allComponents, setAllComponents] = useState([]);
    // Local state for the components attached to this structure
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch All Components
                const compRes = await getSalaryComponents();
                const allComps = compRes.data.results || compRes.data || [];
                setAllComponents(allComps);

                // 2. Map structure components to local state
                // Assuming structure.components is populated by serializer (read-only)
                // We need to map them to the format we edit
                if (structure.components) {
                    const mapped = structure.components.map(sc => ({
                        component_id: sc.component, // SalaryStructureComponent uses 'component' ID
                        name: sc.component_name, // from ReadOnly field
                        type: sc.component_type,
                        // ✅ FIX: Use Backend Source of Truth
                        calculation_type: sc.calculation_type,
                        value: sc.calculation_type === 'percentage'
                            ? parseFloat(sc.percentage || 0)
                            : parseFloat(sc.amount || 0)
                    }));
                    setSelectedComponents(mapped);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [structure]);

    const handleAdd = (comp) => {
        if (!selectedComponents.find(c => c.component_id === comp.id)) {
            setSelectedComponents([...selectedComponents, {
                component_id: comp.id,
                name: comp.name,
                type: comp.component_type,
                // ✅ FIX: Use Comp definition
                calculation_type: comp.calculation_type,
                // Auto-populate from Salary Component default
                value: comp.calculation_type === 'percentage'
                    ? (parseFloat(comp.default_percentage) || 0)
                    : (parseFloat(comp.default_amount) || 0)
            }]);
        }
    };

    const handleRemove = (compId) => {
        setSelectedComponents(selectedComponents.filter(c => c.component_id !== compId));
    };

    const handleChange = (index, field, value) => {
        const updated = [...selectedComponents];
        updated[index][field] = value;
        setSelectedComponents(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSalaryStructureComponents(structure.id, {
                components: selectedComponents
            });
            onClose();
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save components configuration.");
        } finally {
            setSaving(false);
        }
    };

    const available_filtered = allComponents.filter(
        ac => !selectedComponents.find(sc => sc.component_id === ac.id)
    );

    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-content-lg">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-serif" style={{ color: 'var(--text-primary)' }}>Configure Components</h3>
                        <p className="text-xs text-gold">{structure.name}</p>
                    </div>
                    <button onClick={onClose}><X style={{ color: 'var(--text-muted)' }} className="hover:text-white" /></button>
                </div>

                <div className="config-layout">
                    {/* Available Components */}
                    <div className="config-column">
                        <h4 className="config-section-title">Available Components</h4>
                        <div className="config-list">
                            {loading && <div className="text-center p-4 text-sm text-gray-500">Loading...</div>}

                            {available_filtered.map(comp => (
                                <div key={comp.id} className="available-component-card">
                                    <div>
                                        <div className="component-name">{comp.name}</div>
                                        <div className="component-meta">
                                            <span className={comp.component_type === 'earning' ? 'text-green' : 'text-red'}>{comp.component_type}</span>
                                            <span className="component-type-tag">{comp.calculation_type?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleAdd(comp)} className="btn-add-icon">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            ))}
                            {!loading && available_filtered.length === 0 && (
                                <div className="text-center p-4 text-xs text-gray-500">All components added.</div>
                            )}
                        </div>
                    </div>

                    {/* Selected Components */}
                    <div className="config-column">
                        <h4 className="config-section-title text-gold">Structure Configuration</h4>
                        <div className="config-list selected-list">
                            {selectedComponents.length === 0 && <div className="text-center text-gray-600 text-sm mt-10">No components added yet.</div>}
                            {selectedComponents.map((item, idx) => (
                                <div key={idx} className="selected-component-card">
                                    <div className="card-top-row">
                                        <div>
                                            <span className="component-name block">{item.name}</span>
                                            <span className="component-calc-type">
                                                {item.calculation_type?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <button onClick={() => handleRemove(item.component_id)} className="btn-remove-icon"><Trash2 size={14} /></button>
                                    </div>

                                    <div className="card-input-row">
                                        <div className="input-group">
                                            <label className="input-label">
                                                Calculation
                                            </label>
                                            <div className="read-only-box">
                                                {item.calculation_type?.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">
                                                Value
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="custom-input pl-6"
                                                    value={item.value}
                                                    onChange={e => handleChange(idx, 'value', parseFloat(e.target.value))}
                                                />
                                                <div className="input-icon">
                                                    {item.calculation_type === 'percentage' ? <Percent size={10} /> : <Hash size={10} />}
                                                </div>
                                            </div>
                                            <p className="input-help-text">Default from component, editable per structure</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-outline">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-gold">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>Save Configuration</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function SalaryStructure() {
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showComponents, setShowComponents] = useState(false);
    const [selectedStruct, setSelectedStruct] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getSalaryStructures();
            setStructures(res.data.results || res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        fetchData();
        setShowForm(false);
        setSelectedStruct(null);
    };

    const handleCloseComponents = () => {
        setShowComponents(false);
        setSelectedStruct(null);
        fetchData(); // Refresh to show new counts
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this salary structure? This action cannot be undone.")) {
            try {
                await deleteSalaryStructure(id);
                fetchData();
            } catch (error) {
                console.error("Error deleting structure:", error);
                alert("Failed to delete structure. It may be in use.");
            }
        }
    };

    const filtered = structures.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="structure-page">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-serif mb-2" style={{ color: 'var(--text-primary)' }}>Salary <span className="text-gold-gradient">Structures</span></h1>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Define compensation templates and component rules.</p>
            </div>

            {/* Toolbar */}
            <div className="structure-toolbar">
                <div className="search-wrapper">
                    <Search className="text-gray-500" size={18} />
                    <input
                        className="search-input"
                        placeholder="Search structures..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => { setSelectedStruct(null); setShowForm(true); }} className="btn-gold">
                    <Plus size={18} /> <span>New Structure</span>
                </button>
            </div>

            {loading ? <div className="text-center p-10 text-gold">Loading structures...</div> :
                <div className="structure-grid">
                    {filtered.map(str => (
                        <div key={str.id} className="structure-card group">
                            <div className="structure-card-header">
                                <div className="flex gap-4">
                                    <div className="structure-icon-box"><Layers size={20} /></div>
                                    <div>
                                        <h3 className="structure-title">{str.name}</h3>
                                        <span className={str.is_active ? 'status-badge active' : 'status-badge inactive'}>
                                            {str.is_active ? 'ACTIVE' : 'ARCHIVED'}
                                        </span>
                                    </div>
                                </div>
                                <div className="structure-card-actions">
                                    <button onClick={() => { setSelectedStruct(str); setShowForm(true); }} className="action-btn hover:text-white"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(str.id)} className="action-btn delete"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">
                                {str.description || "No description provided."}
                            </div>

                            <div className="structure-card-footer">
                                <div className="structure-meta">
                                    <Layers size={14} />
                                    <span>{str.components_count || 0} Components</span>
                                </div>
                                <button
                                    onClick={() => { setSelectedStruct(str); setShowComponents(true); }}
                                    className="btn-link-gold"
                                >
                                    <Settings size={14} /> CONFIGURE
                                </button>
                            </div>
                        </div>
                    ))}
                    {!loading && filtered.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">No structures found</div>
                    )}
                </div>
            }

            {/* Modals */}
            {showForm && (
                <StructureForm
                    structure={selectedStruct}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}

            {showComponents && selectedStruct && (
                <ComponentManager
                    structure={selectedStruct}
                    onClose={handleCloseComponents}
                />
            )}
        </div>
    );
}
