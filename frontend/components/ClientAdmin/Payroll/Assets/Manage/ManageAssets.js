'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Edit2, Trash2,
    MoreHorizontal, Download, Upload,
    ChevronLeft, ChevronRight, Laptop,
    Smartphone, Monitor, HardDrive, Box, AlertCircle
} from 'lucide-react';
import {
    getAssets, createAsset, updateAsset, deleteAsset
} from '@/api/api_clientadmin';
import './ManageAssets.css';

export default function ManageAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ total_count: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        asset_id: '',
        name: '',
        category: 'laptop',
        model: '',
        serial_number: '',
        status: 'available'
    });

    useEffect(() => {
        fetchAssets();
    }, [searchTerm, statusFilter]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined
            };
            const response = await getAssets(params);
            setAssets(response.data.results || response.data);
            setStats({ total_count: response.data.count || (response.data.length || 0) });
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAsset = () => {
        setEditMode(false);
        setFormData({
            asset_id: '',
            name: '',
            category: 'laptop',
            model: '',
            serial_number: '',
            status: 'available'
        });
        setError(null);
        setShowModal(true);
    };

    const handleEditAsset = (asset) => {
        setEditMode(true);
        setFormData({
            id: asset.id,
            asset_id: asset.asset_id,
            name: asset.name,
            category: asset.category,
            model: asset.model,
            serial_number: asset.serial_number,
            status: asset.status
        });
        setShowModal(true);
    };

    const handleDeleteAsset = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await deleteAsset(id);
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            if (editMode) {
                await updateAsset(formData.id, formData);
            } else {
                await createAsset(formData);
            }
            setShowModal(false);
            fetchAssets();
        } catch (err) {
            console.error('Error saving asset:', err);
            const errorMsg = err.response?.data?.asset_id ? 'Asset ID already exists' :
                (err.response?.data?.detail || err.message || 'Error saving asset');
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const getIcon = (category) => {
        if (!category) return <HardDrive size={18} />;
        switch (category.toLowerCase()) {
            case 'laptop': return <Laptop size={18} />;
            case 'mobile': return <Smartphone size={18} />;
            case 'monitor': return <Monitor size={18} />;
            case 'peripherals': return <Box size={18} />;
            default: return <HardDrive size={18} />;
        }
    };

    return (
        <div className="manage-assets">
            {/* Toolbar */}
            <div className="ma-toolbar">
                <div className="ma-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, ID or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ma-actions">
                    <div className="ma-filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="allocated">Allocated</option>
                            <option value="available">Available</option>
                            <option value="in-repair">In Repair</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>
                    <button className="ma-btn ma-btn--outline">
                        <Upload size={18} /> Import
                    </button>
                    <button className="ma-btn ma-btn--outline">
                        <Download size={18} /> Export
                    </button>
                    <button className="ma-btn ma-btn--primary" onClick={handleAddAsset}>
                        <Plus size={18} /> Add Asset
                    </button>
                </div>
            </div>

            {/* Assets Table */}
            <div className="ma-table-container">
                <table className="ma-table">
                    <thead>
                        <tr>
                            <th>Asset ID</th>
                            <th>Asset Name</th>
                            <th>Category</th>
                            <th>Model/Serial</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id}>
                                <td className="ma-td-id">{asset.asset_id}</td>
                                <td className="ma-td-name">
                                    <div className="ma-name-wrapper">
                                        <div className="ma-category-icon">{getIcon(asset.category)}</div>
                                        <span>{asset.name}</span>
                                    </div>
                                </td>
                                <td>{asset.category}</td>
                                <td className="ma-td-model">
                                    <div className="ma-model">{asset.model}</div>
                                    <div className="ma-serial">{asset.serial_number}</div>
                                </td>
                                <td>
                                    <span className={`ma-status-label ma-status-label--${asset.status}`}>
                                        {asset.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td className="ma-td-user">{asset.assigned_to_details ? asset.assigned_to_details.full_name : '-'}</td>
                                <td className="ma-td-actions">
                                    <div className="ma-action-row">
                                        <button className="ma-action-icon" title="Edit" onClick={() => handleEditAsset(asset)}><Edit2 size={16} /></button>
                                        <button className="ma-action-icon ma-action-icon--danger" title="Delete" onClick={() => handleDeleteAsset(asset.id)}><Trash2 size={16} /></button>
                                        <button className="ma-action-icon"><MoreHorizontal size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="ma-pagination">
                <p>Showing <strong>{assets.length}</strong> of <strong>{stats.total_count}</strong> assets</p>
                <div className="ma-page-controls">
                    <button className="ma-page-btn" disabled><ChevronLeft size={18} /></button>
                    <button className="ma-page-btn ma-page-btn--active">1</button>
                    <button className="ma-page-btn">2</button>
                    <button className="ma-page-btn">3</button>
                    <button className="ma-page-btn"><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* Asset Modal */}
            {showModal && (
                <div className="ma-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ma-modal" onClick={e => e.stopPropagation()}>
                        <div className="ma-modal-header">
                            <h3>{editMode ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <button className="ma-modal-close" onClick={() => setShowModal(false)}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleSave} className="ma-modal-form">
                            {error && (
                                <div className="ma-error-alert animate-shake">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="ma-form-row">
                                <div className="ma-form-group">
                                    <label>Asset ID *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.asset_id}
                                        onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                                        placeholder="AST-001"
                                    />
                                </div>
                                <div className="ma-form-group">
                                    <label>Asset Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="MacBook Pro"
                                    />
                                </div>
                            </div>
                            <div className="ma-form-row">
                                <div className="ma-form-group">
                                    <label>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="laptop">Laptop</option>
                                        <option value="monitor">Monitor</option>
                                        <option value="mobile">Mobile</option>
                                        <option value="tablet">Tablet</option>
                                        <option value="peripherals">Peripherals</option>
                                        <option value="audio">Audio</option>
                                        <option value="printer">Printer</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="ma-form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="available">Available</option>
                                        <option value="allocated">Allocated</option>
                                        <option value="in-repair">In Repair</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ma-form-row">
                                <div className="ma-form-group">
                                    <label>Model</label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="M2 Pro 2023"
                                    />
                                </div>
                                <div className="ma-form-group">
                                    <label>Serial Number</label>
                                    <input
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
                                        placeholder="SN-123456"
                                    />
                                </div>
                            </div>
                            <div className="ma-modal-actions">
                                <button type="button" className="ma-btn ma-btn--outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                                <button type="submit" className="ma-btn ma-btn--primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editMode ? 'Update Asset' : 'Save Asset')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
