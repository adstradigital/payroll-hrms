'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Edit2, Trash2, Briefcase,
    X, Crown, LayoutGrid, List,
    Loader2, Download, Filter, Users
} from 'lucide-react';
import './Designations.css';

import {
    getAllDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
} from '@/api/api_clientadmin';


// --- SUB-COMPONENTS ---

const LevelBadge = ({ level }) => {
    const config = {
        1: { label: 'C-Level', class: 'level-1' },
        2: { label: 'Director', class: 'level-2' },
        3: { label: 'Manager', class: 'level-3' },
        4: { label: 'Senior', class: 'level-4' },
        5: { label: 'Junior', class: 'level-5' },
    };
    const current = config[level] || config[5];
    return <span className={`level-badge ${current.class}`}>{current.label} (L{level})</span>;
};

const DesignationForm = ({ designation, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', code: '', level: 3, description: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (designation) setFormData({ ...designation });
    }, [designation]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = designation ? await updateDesignation(designation.id, formData) : await createDesignation(formData);
            onSuccess(res.data, !!designation);
        } catch (err) { alert('Error saving data'); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <h3 className="modal-title">{designation ? 'Edit Designation' : 'New Designation'}</h3>
                    <button onClick={onClose} className="btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Senior VP" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input className="form-input" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. SVP" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label label-between">
                            <span>Hierarchy Level</span>
                            <span style={{ color: 'var(--brand-primary)' }}>Level {formData.level}</span>
                        </label>
                        <input type="range" min="1" max="5" step="1" className="range-slider"
                            value={formData.level} onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })} />
                        <div className="range-labels">
                            <span>C-Suite (1)</span>
                            <span>Entry (5)</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Responsibilities</label>
                        <textarea rows="3" className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            <span>{designation ? 'Update Role' : 'Create Role'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function Designations() {
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('level'); // 'level' | 'name'

    // Form States
    const [showForm, setShowForm] = useState(false);
    const [editingDesig, setEditingDesig] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await getAllDesignations();
                // Handle potential pagination or direct array response
                const data = res.data.results || res.data || [];
                setDesignations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch designations:", error);
                setDesignations([]);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // --- Stats ---
    const stats = useMemo(() => ({
        total: designations.length,
        executives: designations.filter(d => d.level === 1).length,
        staff: designations.reduce((acc, curr) => acc + (curr.employee_count || 0), 0)
    }), [designations]);

    // --- Filter & Sort ---
    const filteredData = useMemo(() => {
        let data = designations.filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return data.sort((a, b) => {
            if (sortBy === 'level') return a.level - b.level; // Ascending (1 is top)
            return a.name.localeCompare(b.name);
        });
    }, [designations, searchTerm, sortBy]);

    // --- Actions ---
    const handleExport = () => {
        const header = "ID,Title,Code,Level,Staff Count,Description\n";
        const rows = filteredData.map(d => `${d.id},"${d.name}","${d.code}",${d.level},${d.employee_count},"${d.description}"`).join("\n");
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'designations.csv'; a.click();
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this designation?")) {
            await deleteDesignation(id);
            setDesignations(prev => prev.filter(d => d.id !== id));
        }
    };

    return (
        <div className="designation-page">
            {/* Header Area */}
            <div className="page-header">
                <h1 className="page-title">Corporate <span className="text-highlight">Designations</span></h1>
                <p className="page-subtitle">Define organizational hierarchy, job titles, and career ladders.</p>

                {/* Stats Dashboard */}
                <div className="dash-grid">
                    <div className="dash-card">
                        <div className="dash-label">Total Roles</div>
                        <div className="dash-value">{stats.total}</div>
                        <Briefcase className="dash-icon-bg" />
                    </div>
                    <div className="dash-card">
                        <div className="dash-label">Executive Roles (C-Level)</div>
                        <div className="dash-value highlight">{stats.executives}</div>
                        <Crown className="dash-icon-bg" />
                    </div>
                    <div className="dash-card">
                        <div className="dash-label">Total Assigned Staff</div>
                        <div className="dash-value">{stats.staff}</div>
                        <Users className="dash-icon-bg" />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            className="search-input"
                            placeholder="Search designations..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="sort-container">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="level">Hierarchy (High to Low)</option>
                            <option value="name">Name (A-Z)</option>
                        </select>
                        <Filter className="sort-icon" size={14} />
                    </div>
                </div>

                <div className="toolbar-right">
                    <button onClick={handleExport} className="btn-outline" title="Export CSV">
                        <Download size={18} />
                    </button>

                    <div className="view-toggle">
                        <button onClick={() => setViewMode('list')} className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}>
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}>
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <button onClick={() => { setEditingDesig(null); setShowForm(true); }} className="btn-primary">
                        <Plus size={18} /> <span>New Role</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <span>Retrieving hierarchy data...</span>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="designation-grid">
                    {filteredData.map(desig => (
                        <div key={desig.id} className="designation-card">
                            <LevelBadge level={desig.level} />

                            <div className="card-header-row">
                                <h3 className="card-title">{desig.name}</h3>
                                <div className="card-code">{desig.code}</div>
                            </div>

                            <p className="card-desc">
                                {desig.description || "No description provided."}
                            </p>

                            <div className="card-footer">
                                <div className="staff-count">
                                    <Users size={14} />
                                    <span>{desig.employee_count} Staff</span>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => { setEditingDesig(desig); setShowForm(true); }} className="btn-icon"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(desig.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="desig-table">
                        <thead>
                            <tr>
                                <th>Designation Title</th>
                                <th>Hierarchy</th>
                                <th>Description</th>
                                <th>Headcount</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(desig => (
                                <tr key={desig.id}>
                                    <td>
                                        <div className="table-title">{desig.name}</div>
                                        <div className="table-code">{desig.code}</div>
                                    </td>
                                    <td><LevelBadge level={desig.level} /></td>
                                    <td className="table-desc" title={desig.description}>{desig.description}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{desig.employee_count}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button onClick={() => { setEditingDesig(desig); setShowForm(true); }} className="btn-icon"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(desig.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <DesignationForm
                    designation={editingDesig}
                    onClose={() => setShowForm(false)}
                    onSuccess={(data, isEdit) => {
                        setDesignations(prev => isEdit ? prev.map(d => d.id === data.id ? data : d) : [...prev, data]);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}
