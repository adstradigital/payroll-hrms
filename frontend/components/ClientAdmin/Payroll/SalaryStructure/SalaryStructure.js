'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, Layers,
    CheckCircle2, AlertCircle, ChevronRight, X,
    DollarSign, ArrowUpDown
} from 'lucide-react';
import {
    getSalaryStructures, createSalaryStructure,
    updateSalaryStructure, deleteSalaryStructure,
    getSalaryComponents, addComponentToStructure
} from '@/api/api_clientadmin';
import './SalaryStructure.css';

const StructureForm = ({ structure, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (structure) {
            setFormData({
                name: structure.name || '',
                description: structure.description || '',
                is_active: structure.is_active !== false
            });
        }
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
        } catch (error) {
            alert("Failed to save structure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="text-lg font-bold">{structure ? 'Edit Structure' : 'New Salary Structure'}</h3>
                    <button onClick={onClose} className="btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body space-y-4">
                    <div className="form-group">
                        <label className="form-label">Structure Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g. Senior Manager Grade"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <span className="text-sm font-medium">Active Structure</span>
                    </label>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Save Structure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StructureComponentsManager = ({ structure, onClose }) => {
    const [availableComponents, setAvailableComponents] = useState([]);
    const [structureComponents, setStructureComponents] = useState([]); // This would normally come from structure detail
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch components and structure details
        // customizable based on actual API response structure
        const fetchData = async () => {
            try {
                const compRes = await getSalaryComponents();
                setAvailableComponents(compRes.data.results || compRes.data || []);
                // If structure has components in it, set them here
                // For now assuming we might need to fetch them or they are in structure obj
            } catch (error) {
                console.error("Error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [structure]);

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="text-lg font-bold">Configure Components</h3>
                        <p className="text-xs text-secondary">For structure: {structure.name}</p>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <p className="text-sm text-secondary mb-4">
                        Add earnings and deductions to this structure. (Implementation pending backend support for structure-component mapping)
                    </p>

                    {/* Placeholder for component selection UI */}
                    <div className="grid grid-cols-2 gap-4 h-96 overflow-y-auto bg-tertiary rounded-lg p-4">
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm mb-2">Available Components</h4>
                            {availableComponents.map(comp => (
                                <div key={comp.id} className="p-2 bg-secondary border border-color rounded flex justify-between items-center">
                                    <span className="text-sm">{comp.name}</span>
                                    <button className="btn-icon w-6 h-6 bg-brand-light text-brand"><Plus size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-l border-color pl-4">
                            <h4 className="font-bold text-sm mb-2">Selected Components</h4>
                            <p className="text-xs text-muted italic">No components selected yet.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SalaryStructure() {
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showComponents, setShowComponents] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);

    useEffect(() => {
        fetchStructures();
    }, []);

    const fetchStructures = async () => {
        try {
            setLoading(true);
            const res = await getSalaryStructures();
            setStructures(res.data.results || res.data || []);
        } catch (error) {
            console.error("Error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (structure) => {
        setSelectedStructure(structure);
        setShowForm(true);
    };

    const handleManageComponents = (structure) => {
        setSelectedStructure(structure);
        setShowComponents(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteSalaryStructure(id);
            setStructures(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            alert("Failed to delete");
        }
    };

    const handleSuccess = () => {
        fetchStructures();
        setShowForm(false);
        setSelectedStructure(null);
    };

    const filteredStructures = structures.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="salary-structure-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="text-brand" /> Salary Structures
                    </h1>
                    <p className="text-secondary">Define salary templates for different grades</p>
                </div>
                <button onClick={() => { setSelectedStructure(null); setShowForm(true); }} className="btn btn-primary">
                    <Plus size={18} /> Add Structure
                </button>
            </div>

            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search structures..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="toolbar-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading structures...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStructures.map(structure => (
                        <div key={structure.id} className="component-card group hover:shadow-lg transition-all">
                            <div className="card-top items-start">
                                <div className="icon-box bg-brand-light text-brand">
                                    <Layers size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg">{structure.name}</h4>
                                        <span className={`tag ${structure.is_active ? 'active' : 'inactive'}`}>
                                            {structure.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-secondary mt-1">{structure.description || 'No description'}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-color flex justify-between items-center">
                                <button
                                    onClick={() => handleManageComponents(structure)}
                                    className="text-sm text-brand font-medium hover:underline flex items-center gap-1"
                                >
                                    Configure Components <ChevronRight size={14} />
                                </button>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(structure)} className="action-btn">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(structure.id)} className="action-btn text-danger">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredStructures.length === 0 && (
                        <div className="col-span-full text-center p-12 text-muted border-2 dashed border-color rounded-lg">
                            No structures found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <StructureForm
                    structure={selectedStructure}
                    onClose={() => { setShowForm(false); setSelectedStructure(null); }}
                    onSuccess={handleSuccess}
                />
            )}

            {showComponents && (
                <StructureComponentsManager
                    structure={selectedStructure}
                    onClose={() => { setShowComponents(false); setSelectedStructure(null); }}
                />
            )}
        </div>
    );
}
