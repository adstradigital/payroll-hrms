'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, Package, Calendar,
    CheckCircle, Clock, AlertCircle,
    ChevronDown, MoreVertical, LayoutGrid,
    List
} from 'lucide-react';
import {
    getAssetBatches, createAssetBatch, updateAssetBatch, deleteAssetBatch
} from '@/api/api_clientadmin';
import './AssetBatches.css';

export default function AssetBatches() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [stats, setStats] = useState({ total_batches: 0, active_items: 0, in_progress: 0 });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        batch_type: 'purchase',
        items_count: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'planned',
        vendor: ''
    });

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await getAssetBatches();
            const batchData = response.data.results || response.data;
            setBatches(batchData);

            const total = batchData.length;
            const items = batchData.reduce((acc, b) => acc + (b.items_count || 0), 0);
            const inProgress = batchData.filter(b => b.status === 'in-progress' || b.status === 'pending').length;

            setStats({ total_batches: total, active_items: items, in_progress: inProgress });
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBatch = () => {
        setEditMode(false);
        setFormData({
            name: '',
            batch_type: 'purchase',
            items_count: 0,
            date: new Date().toISOString().split('T')[0],
            status: 'planned',
            vendor: ''
        });
        setError(null);
        setShowModal(true);
    };

    const handleEditBatch = (batch) => {
        setEditMode(true);
        setFormData({
            id: batch.id,
            name: batch.name,
            batch_type: batch.batch_type,
            items_count: batch.items_count,
            date: batch.date,
            status: batch.status,
            vendor: batch.vendor || ''
        });
        setError(null);
        setShowModal(true);
    };

    const handleDeleteBatch = async (id) => {
        if (window.confirm('Are you sure you want to delete this batch?')) {
            try {
                await deleteAssetBatch(id);
                fetchBatches();
            } catch (error) {
                console.error('Error deleting batch:', error);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            if (editMode) {
                await updateAssetBatch(formData.id, formData);
            } else {
                await createAssetBatch(formData);
            }
            setShowModal(false);
            fetchBatches();
        } catch (err) {
            console.error('Error saving batch:', err);
            setError(err.response?.data?.detail || err.message || 'Error saving batch');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="asset-batches">
            {/* Header / Stats */}
            <div className="ab-header-stats">
                <div className="ab-stat-box">
                    <span className="ab-stat-label">Total Batches</span>
                    <span className="ab-stat-value">{stats.total_batches}</span>
                </div>
                <div className="ab-stat-box">
                    <span className="ab-stat-label">Total Items</span>
                    <span className="ab-stat-value">{stats.active_items}</span>
                </div>
                <div className="ab-stat-box">
                    <span className="ab-stat-label">In-Progress</span>
                    <span className="ab-stat-value">{stats.in_progress}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="ab-toolbar">
                <div className="ab-search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search batches by name, ID or vendor..." />
                </div>
                <div className="ab-actions">
                    <div className="ab-view-toggle">
                        <button
                            className={`ab-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <List size={18} />
                        </button>
                        <button
                            className={`ab-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <button className="ab-btn ab-btn--primary" onClick={handleAddBatch}>
                        <Plus size={18} /> New Batch
                    </button>
                </div>
            </div>

            {/* Batch Table */}
            <div className="ab-table-container">
                <table className="ab-table">
                    <thead>
                        <tr>
                            <th>Batch ID</th>
                            <th>Batch Name</th>
                            <th>Type</th>
                            <th>Items</th>
                            <th>Created Date</th>
                            <th>Status</th>
                            <th>Vendor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map((batch) => (
                            <tr key={batch.id}>
                                <td className="ab-td-id">{batch.id}</td>
                                <td className="ab-td-name">
                                    <div className="ab-name-wrapper">
                                        <Package size={16} className="ab-pkg-icon" />
                                        <span>{batch.name}</span>
                                    </div>
                                </td>
                                <td><span className="ab-type-tag">{batch.batch_type}</span></td>
                                <td>{batch.items_count} Units</td>
                                <td>{batch.date}</td>
                                <td>
                                    <span className={`ab-status-label ab-status-label--${batch.status}`}>
                                        {batch.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td>{batch.vendor || '-'}</td>
                                <td>
                                    <div className="ab-action-row">
                                        <button className="ab-action-icon" title="Edit" onClick={() => handleEditBatch(batch)}>
                                            <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
                                        </button>
                                        <button className="ab-action-icon" title="Delete" onClick={() => handleDeleteBatch(batch.id)}>
                                            <AlertCircle size={16} />
                                        </button>
                                        <button className="ab-action-icon"><MoreVertical size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Asset Batch Modal */}
            {showModal && (
                <div className="ab-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ab-modal" onClick={e => e.stopPropagation()}>
                        <div className="ab-modal-header">
                            <h3>{editMode ? 'Edit Batch' : 'Create New Batch'}</h3>
                            <button className="ab-modal-close" onClick={() => setShowModal(false)}>
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="ab-modal-form">
                            {error && (
                                <div className="ab-error-alert animate-shake">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="ab-form-row">
                                <div className="ab-form-group">
                                    <label>Batch Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Q1 Laptop Procurement"
                                    />
                                </div>
                                <div className="ab-form-group">
                                    <label>Batch Type *</label>
                                    <select
                                        value={formData.batch_type}
                                        onChange={e => setFormData({ ...formData, batch_type: e.target.value })}
                                    >
                                        <option value="purchase">Purchase</option>
                                        <option value="upgrade">Upgrade</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ab-form-row">
                                <div className="ab-form-group">
                                    <label>Item Count *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.items_count}
                                        onChange={e => setFormData({ ...formData, items_count: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="ab-form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="ab-form-row">
                                <div className="ab-form-group">
                                    <label>Status *</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="ab-form-group">
                                    <label>Vendor</label>
                                    <input
                                        type="text"
                                        value={formData.vendor}
                                        onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                        placeholder="Dell Technologies"
                                    />
                                </div>
                            </div>
                            <div className="ab-modal-actions">
                                <button type="button" className="ab-btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                                <button type="submit" className="ab-btn ab-btn--primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editMode ? 'Update Batch' : 'Create Batch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
