'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    Plus, Search, Filter, Edit2, Trash2,
    MoreHorizontal, Download, Upload,
    ChevronLeft, ChevronRight, Laptop,
    Smartphone, Monitor, HardDrive, Box, AlertCircle, X, FileText
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
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedAssets(assets.map(a => a.id));
        } else {
            setSelectedAssets([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedAssets(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        const dataToExport = selectedAssets.length > 0
            ? assets.filter(a => selectedAssets.includes(a.id))
            : assets;

        if (dataToExport.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(a => ({
            'Asset ID': a.asset_id,
            'Name': a.name,
            'Category': a.category,
            'Model': a.model,
            'Serial Number': a.serial_number,
            'Status': a.status,
            'Assigned To': a.assigned_to_details?.full_name || '-'
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
        XLSX.writeFile(workbook, `Assets_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDownloadTemplate = () => {
        const headers = [['Asset ID', 'Name', 'Category', 'Model', 'Serial Number', 'Status']];
        const worksheet = XLSX.utils.aoa_to_sheet(headers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "Asset_Import_Template.xlsx");
    };

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setImportLoading(true);
            const reader = new FileReader();
            reader.onload = async (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert('No data found in file');
                    setImportLoading(false);
                    return;
                }

                let successCount = 0;
                let errorCount = 0;

                for (const row of data) {
                    try {
                        const payload = {
                            asset_id: row['Asset ID'],
                            name: row['Name'],
                            category: (row['Category'] || 'other').toLowerCase(),
                            model: row['Model'] || '',
                            serial_number: row['Serial Number'] || '',
                            status: (row['Status'] || 'available').toLowerCase()
                        };
                        await createAsset(payload);
                        successCount++;
                    } catch (err) {
                        console.error('Import error for row:', row, err);
                        errorCount++;
                    }
                }

                alert(`Import completed. Success: ${successCount}, Errors: ${errorCount}`);
                setShowImportModal(false);
                fetchAssets();
                setImportLoading(false);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Import process error:', error);
            alert('Error processing file');
            setImportLoading(false);
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
                    <button className="ma-btn ma-btn--outline" onClick={() => setShowImportModal(true)}>
                        <Upload size={18} /> Import
                    </button>
                    <button className="ma-btn ma-btn--outline" onClick={handleExport}>
                        <Download size={18} /> {selectedAssets.length > 0 ? `Export (${selectedAssets.length})` : 'Export All'}
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
                            <th className="ma-th-checkbox">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={assets.length > 0 && selectedAssets.length === assets.length}
                                />
                            </th>
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
                            <tr key={asset.id} className={selectedAssets.includes(asset.id) ? 'ma-tr-selected' : ''}>
                                <td className="ma-td-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedAssets.includes(asset.id)}
                                        onChange={() => handleSelectRow(asset.id)}
                                    />
                                </td>
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
            {/* Import Modal */}
            {showImportModal && (
                <div className="ma-modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="ma-modal ma-modal--small" onClick={e => e.stopPropagation()}>
                        <div className="ma-modal-header">
                            <h3>Import Assets</h3>
                            <button className="ma-modal-close" onClick={() => setShowImportModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ma-modal-content">
                            <div className="ma-import-options">
                                <div className="ma-import-step">
                                    <div className="ma-step-icon"><Download size={20} /></div>
                                    <div className="ma-step-info">
                                        <h4>1. Download Template</h4>
                                        <p>Use our template to format your asset data correctly.</p>
                                        <button className="ma-btn ma-btn--outline ma-btn--sm" onClick={handleDownloadTemplate}>
                                            <FileText size={16} /> Download Template
                                        </button>
                                    </div>
                                </div>
                                <div className="ma-import-step">
                                    <div className="ma-step-icon"><Upload size={20} /></div>
                                    <div className="ma-step-info">
                                        <h4>2. Upload File</h4>
                                        <p>Upload the completed .xlsx or .csv file here.</p>
                                        <input
                                            type="file"
                                            id="asset-import-file"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={handleImportFile}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            className="ma-btn ma-btn--primary ma-btn--sm"
                                            onClick={() => document.getElementById('asset-import-file').click()}
                                            disabled={importLoading}
                                        >
                                            {importLoading ? 'Processing...' : 'Choose File'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
