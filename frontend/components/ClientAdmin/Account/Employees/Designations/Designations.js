'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, Briefcase,
    ChevronRight, X, Crown, LayoutGrid, List,
    Info, Loader2, AlertCircle
} from 'lucide-react';
import {
    getAllDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation
} from '@/api/api_clientadmin';
import './Designations.css';

// --- COMPONENTS ---

// 1. Designation Form Component
const DesignationForm = ({ designation, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        level: 3,
        description: '',
        // Removed legacy 'roles' field
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (designation) {
            setFormData({
                name: designation.name,
                code: designation.code,
                level: designation.level,
                description: designation.description || ''
            });
        }
    }, [designation]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let res;
            if (designation) {
                res = await updateDesignation(designation.id, formData);
            } else {
                res = await createDesignation(formData);
            }
            onSuccess(res.data, !!designation);
        } catch (err) {
            console.error(err);
            setError('Failed to save designation. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-container">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="header-icon-box" style={{ width: '40px', height: '40px', borderRadius: '10px' }}>
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                {designation ? 'Edit Designation' : 'New Designation'}
                            </h3>
                            <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Set hierarchy and details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && (
                        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <div className="form-grid">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Senior Engineer"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g. SDEV"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Hierarchy Level</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                className="range-slider"
                            />
                            <div className="level-labels">
                                <span className={formData.level === 1 ? 'level-active' : ''}>C-Level (1)</span>
                                <span className={formData.level === 2 ? 'level-active' : ''}>Director (2)</span>
                                <span className={formData.level === 3 ? 'level-active' : ''}>Manager (3)</span>
                                <span className={formData.level === 4 ? 'level-active' : ''}>Senior (4)</span>
                                <span className={formData.level === 5 ? 'level-active' : ''}>Junior (5)</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="form-textarea"
                                placeholder="Briefly describe the responsibilities..."
                            />
                        </div>
                    </div>
                </form>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Save Designation'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. Designation Details Component
const DesignationDetail = ({ designation, onClose }) => {
    if (!designation) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content modal-container" style={{ maxWidth: '600px' }}>
                <div className="detail-hero">
                    <button onClick={onClose} className="close-btn" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.2)' }}>
                        <X size={20} />
                    </button>

                    <div className="detail-avatar-large">
                        {designation.name.charAt(0)}
                    </div>

                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{designation.name}</h2>
                    <div className="badges-row" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <span className="badge badge-code">{designation.code}</span>
                        <span className="badge badge-level">Level {designation.level}</span>
                        {designation.level === 1 && <span className="badge badge-level" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>Executive</span>}
                    </div>

                    <div className="detail-stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="stat-box">
                            <span className="stat-value">{designation.employee_count || 0}</span>
                            <span className="stat-label">Employees</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-value">{new Date(designation.created_at).toLocaleDateString()}</span>
                            <span className="stat-label">Created</span>
                        </div>
                    </div>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Description</label>
                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            {designation.description || 'No description provided for this designation.'}
                        </p>
                    </div>
                </div>

                <div className="modal-footer" style={{ background: 'var(--bg-primary)' }}>
                    <button onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>Close Details</button>
                </div>
            </div>
        </div>
    );
};

// 3. Designation List Component
const DesignationList = ({ designations, loading, setDesignations, refreshData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingDesig, setEditingDesig] = useState(null);
    const [detailDesig, setDetailDesig] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const filteredDesignations = designations.filter(d =>
        (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSuccess = (data, isEdit) => {
        if (isEdit) {
            setDesignations(prev => prev.map(d => d.id === data.id ? data : d));
        } else {
            setDesignations(prev => [data, ...prev]);
        }
        setShowForm(false);
        setEditingDesig(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this designation?')) {
            try {
                await deleteDesignation(id);
                setDesignations(prev => prev.filter(d => d.id !== id));
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete designation");
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    return (
        <div className="designation-page-content">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search designations..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <List size={20} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <button onClick={() => { setEditingDesig(null); setShowForm(true); }}
                        className="btn-primary">
                        <Plus size={20} /> <span>Add Designation</span>
                    </button>
                </div>
            </div>

            {/* View Content */}
            {filteredDesignations.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                    <p>No designations found.</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="designation-grid">
                    {filteredDesignations.map(desig => (
                        <div key={desig.id} className="designation-card">
                            <div className="card-accent-line" style={{ background: desig.level === 1 ? '#f59e0b' : desig.level === 2 ? '#7c3aed' : '#94a3b8' }}></div>

                            <div className="card-header">
                                <div>
                                    <h3 className="designation-title">
                                        {desig.name}
                                        {desig.level === 1 && <Crown size={16} className="crown-icon" />}
                                    </h3>
                                    <div className="badges-row">
                                        <span className="badge badge-code">{desig.code}</span>
                                        <span className="badge badge-level">Level {desig.level}</span>
                                    </div>
                                </div>
                                <div className="actions-overlay">
                                    <button onClick={() => { setEditingDesig(desig); setShowForm(true); }} className="action-btn"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(desig.id)} className="action-btn delete"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="card-body">
                                <p className="description-text">{desig.description}</p>
                            </div>

                            <div className="card-footer">
                                <div className="stats-row">
                                    <div className="text-sm font-medium text-secondary">
                                        {desig.employee_count || 0} Employees
                                    </div>
                                    <div onClick={() => setDetailDesig(desig)} className="details-link">
                                        Details <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* LIST VIEW */
                <div className="designation-list-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="designation-table">
                            <thead>
                                <tr>
                                    <th>Designation</th>
                                    <th>Title</th>
                                    <th>Hierarchy</th>
                                    <th>Staff Count</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDesignations.map(desig => (
                                    <tr key={desig.id} className="list-row">
                                        <td>
                                            <div className="list-item-main">
                                                <div className="list-avatar">
                                                    {desig.name.charAt(0)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {desig.name}
                                                    {desig.level === 1 && <Crown size={14} fill="#f59e0b" color="#f59e0b" />}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desig.code}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-level">Level {desig.level}</span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{desig.employee_count || 0}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button onClick={() => setDetailDesig(desig)} className="action-btn"><Info size={16} /></button>
                                                <button onClick={() => { setEditingDesig(desig); setShowForm(true); }} className="action-btn"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(desig.id)} className="action-btn delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showForm && (
                <DesignationForm
                    designation={editingDesig}
                    onClose={() => { setShowForm(false); setEditingDesig(null); }}
                    onSuccess={handleSuccess}
                />
            )}

            {detailDesig && (
                <DesignationDetail
                    designation={detailDesig}
                    onClose={() => setDetailDesig(null)}
                />
            )}
        </div>
    );
};

// 4. Main Designation Component
export default function Designation() {
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check if getAllDesignations returns { data: [...] } or { data: { results: [...] } }
            // The existing RoleAndPermission.js used: desigRes.data.results || desigRes.data || []
            const desigRes = await getAllDesignations();
            const data = desigRes.data.results || desigRes.data || [];
            setDesignations(data);
        } catch (error) {
            console.error("Error fetching designations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="designation-page">
            {/* Header / Page Title */}
            <div className="page-header">
                <div className="header-title-wrapper">
                    <div className="header-icon-box">
                        <Briefcase size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="page-title">Designations</h2>
                        <p className="page-subtitle">Manage hierarchy & job titles</p>
                    </div>
                </div>


            </div>

            <DesignationList
                designations={designations}
                setDesignations={setDesignations}
                loading={loading}
                refreshData={fetchData}
            />
        </div>
    );
}
