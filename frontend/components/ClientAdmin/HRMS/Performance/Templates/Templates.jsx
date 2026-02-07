'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, FileText, Edit2, Trash2, Copy, CheckCircle, X,
    GripVertical, Download, LayoutGrid, List, Filter, MoreHorizontal,
    AlertCircle, Check, ChevronDown
} from 'lucide-react';
import { 
    getPerformanceCriteria, createPerformanceCriteria, 
    updatePerformanceCriteria, deletePerformanceCriteria 
} from '../services/performanceService';
import './Templates.css';

// Color palette for criteria
const CRITERIA_COLORS = [
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', 
    '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#d946ef'
];

export default function Templates() {
    const [criteria, setCriteria] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        weightage: 0,
        is_active: true,
        color: CRITERIA_COLORS[0]
    });

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    useEffect(() => {
        loadCriteria();
    }, []);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const loadCriteria = async () => {
        setLoading(true);
        try {
            const data = await getPerformanceCriteria();
            // Assign colors to criteria that don't have one
            const dataWithColors = (data || []).map((item, idx) => ({
                ...item,
                color: item.color || CRITERIA_COLORS[idx % CRITERIA_COLORS.length]
            }));
            setCriteria(dataWithColors);
        } catch (error) {
            console.error('Failed to load criteria:', error);
            showToast('Failed to load criteria', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCriteria) {
                await updatePerformanceCriteria(editingCriteria.id, formData);
                showToast('Criteria updated successfully');
            } else {
                await createPerformanceCriteria(formData);
                showToast('Criteria created successfully');
            }
            setShowModal(false);
            resetForm();
            loadCriteria();
        } catch (error) {
            console.error('Failed to save criteria:', error);
            showToast('Failed to save criteria', 'error');
        }
    };

    const handleEdit = (item) => {
        setEditingCriteria(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            weightage: item.weightage,
            is_active: item.is_active,
            color: item.color || CRITERIA_COLORS[0]
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await deletePerformanceCriteria(id);
            showToast('Criteria deleted successfully');
            loadCriteria();
        } catch (error) {
            console.error('Failed to delete criteria:', error);
            showToast('Failed to delete criteria', 'error');
        }
        setShowDeleteConfirm(null);
    };

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selectedItems.map(id => deletePerformanceCriteria(id)));
            showToast(`${selectedItems.length} criteria deleted`);
            setSelectedItems([]);
            loadCriteria();
        } catch (error) {
            showToast('Failed to delete some criteria', 'error');
        }
    };

    const handleBulkToggleActive = async (active) => {
        try {
            await Promise.all(selectedItems.map(id => 
                updatePerformanceCriteria(id, { is_active: active })
            ));
            showToast(`${selectedItems.length} criteria ${active ? 'activated' : 'deactivated'}`);
            setSelectedItems([]);
            loadCriteria();
        } catch (error) {
            showToast('Failed to update criteria', 'error');
        }
    };

    const handleDuplicate = (item) => {
        setEditingCriteria(null);
        setFormData({
            name: `${item.name} (Copy)`,
            description: item.description || '',
            weightage: item.weightage,
            is_active: true,
            color: CRITERIA_COLORS[(criteria.length) % CRITERIA_COLORS.length]
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCriteria(null);
        setFormData({
            name: '',
            description: '',
            weightage: 0,
            is_active: true,
            color: CRITERIA_COLORS[criteria.length % CRITERIA_COLORS.length]
        });
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Description', 'Weightage (%)', 'Status'];
        const rows = criteria.map(c => [
            c.name,
            c.description || '',
            c.weightage,
            c.is_active ? 'Active' : 'Inactive'
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'performance_criteria.csv';
        link.click();
        showToast('Exported to CSV');
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === filteredCriteria.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredCriteria.map(c => c.id));
        }
    };

    // Drag handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, item) => {
        e.preventDefault();
        if (draggedItem && item.id !== draggedItem.id) {
            setDragOverItem(item);
        }
    };

    const handleDragEnd = () => {
        if (draggedItem && dragOverItem) {
            const newCriteria = [...criteria];
            const dragIndex = newCriteria.findIndex(c => c.id === draggedItem.id);
            const dropIndex = newCriteria.findIndex(c => c.id === dragOverItem.id);
            
            const [removed] = newCriteria.splice(dragIndex, 1);
            newCriteria.splice(dropIndex, 0, removed);
            
            setCriteria(newCriteria);
            showToast('Order updated');
        }
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const totalWeightage = criteria
        .filter(c => c.is_active)
        .reduce((sum, c) => sum + parseFloat(c.weightage || 0), 0);

    const filteredCriteria = criteria.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = criteria.filter(c => c.is_active).length;
    const inactiveCount = criteria.filter(c => !c.is_active).length;

    return (
        <div className="templates">
            {/* Header */}
            <div className="templates-header">
                <div className="templates-header__info">
                    <h1 className="templates-title">Performance Criteria</h1>
                    <p className="templates-subtitle">
                        Define evaluation criteria and their weightage for performance reviews
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="templates-stats-bar">
                <div className="stat-item">
                    <span className="stat-value">{criteria.length}</span>
                    <span className="stat-label">Total Criteria</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-value stat-value--success">{activeCount}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-value stat-value--muted">{inactiveCount}</span>
                    <span className="stat-label">Inactive</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item stat-item--weight">
                    <div className="weightage-display">
                        <span className={`stat-value ${totalWeightage === 100 ? 'stat-value--success' : 'stat-value--danger'}`}>
                            {totalWeightage.toFixed(0)}%
                        </span>
                        <div className="weightage-bar">
                            <div 
                                className={`weightage-bar__fill ${totalWeightage === 100 ? 'valid' : 'invalid'}`}
                                style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                            />
                        </div>
                    </div>
                    <span className="stat-label">Total Weightage</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="templates-toolbar">
                <div className="templates-toolbar__left">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search criteria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-box__clear" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="templates-toolbar__right">
                    <div className="view-toggle">
                        <button 
                            className={`view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <List size={16} />
                        </button>
                        <button 
                            className={`view-toggle__btn ${viewMode === 'card' ? 'active' : ''}`}
                            onClick={() => setViewMode('card')}
                            title="Card view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={16} />
                        Export
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <Plus size={16} />
                        Add Criteria
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.length > 0 && (
                <div className="bulk-actions-bar">
                    <div className="bulk-actions-bar__info">
                        <CheckCircle size={16} />
                        <span>{selectedItems.length} selected</span>
                    </div>
                    <div className="bulk-actions-bar__actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkToggleActive(true)}>
                            Activate
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkToggleActive(false)}>
                            Deactivate
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                    <button className="bulk-actions-bar__close" onClick={() => setSelectedItems([])}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="templates-loading">
                    <div className="spinner" />
                    <p>Loading criteria...</p>
                </div>
            ) : (
                <>
                    {/* Select All Header */}
                    {filteredCriteria.length > 0 && (
                        <div className="templates-list-header">
                            <label className="checkbox-wrapper">
                                <input 
                                    type="checkbox"
                                    checked={selectedItems.length === filteredCriteria.length && filteredCriteria.length > 0}
                                    onChange={handleSelectAll}
                                />
                                <span className="checkbox-label">Select All</span>
                            </label>
                        </div>
                    )}

                    <div className={`templates-${viewMode}`}>
                        {filteredCriteria.map((item, index) => (
                            <div 
                                key={item.id} 
                                className={`template-item ${!item.is_active ? 'inactive' : ''} ${selectedItems.includes(item.id) ? 'selected' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''} ${dragOverItem?.id === item.id ? 'drag-over' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragOver={(e) => handleDragOver(e, item)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="template-item__checkbox">
                                    <input 
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => handleSelectItem(item.id)}
                                    />
                                </div>

                                <div className="template-item__drag-handle">
                                    <GripVertical size={16} />
                                </div>

                                <div 
                                    className="template-item__color-bar"
                                    style={{ backgroundColor: item.color }}
                                />

                                <div className="template-item__content">
                                    <div className="template-item__header">
                                        <h4>{item.name}</h4>
                                        <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="template-item__description">
                                        {item.description || 'No description provided'}
                                    </p>
                                </div>

                                <div className="template-item__weightage">
                                    <div className="weightage-circle" style={{ borderColor: item.color }}>
                                        <span style={{ color: item.color }}>{item.weightage}%</span>
                                    </div>
                                </div>

                                <div className="template-item__actions">
                                    <button className="btn-icon" onClick={() => handleDuplicate(item)} title="Duplicate">
                                        <Copy size={14} />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        className="btn-icon btn-icon--danger" 
                                        onClick={() => setShowDeleteConfirm(item.id)} 
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredCriteria.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state__icon">
                                    <FileText size={48} />
                                </div>
                                <h3 className="empty-state__title">No criteria found</h3>
                                <p className="empty-state__description">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms'
                                        : 'Create your first performance criteria to get started'
                                    }
                                </p>
                                {!searchTerm && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => { resetForm(); setShowModal(true); }}
                                    >
                                        <Plus size={16} />
                                        Create First Criteria
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCriteria ? 'Edit Criteria' : 'Add Criteria'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Criteria Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g., Quality of Work"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                        placeholder="Describe how this criteria should be evaluated..."
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Weightage (%) <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.weightage}
                                            onChange={(e) => setFormData({...formData, weightage: parseFloat(e.target.value) || 0})}
                                            required
                                        />
                                        <span className="form-hint">
                                            Current total: {totalWeightage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-picker">
                                            {CRITERIA_COLORS.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`color-picker__swatch ${formData.color === color ? 'active' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setFormData({...formData, color})}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group form-group--checkbox">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    />
                                    <label htmlFor="is_active">Active (included in weightage calculation)</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCriteria ? 'Update Criteria' : 'Create Criteria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Delete Criteria</h2>
                            <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-message">
                                <AlertCircle size={48} className="confirm-icon" />
                                <p>Are you sure you want to delete this criteria? This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span className="toast__message">{toast.message}</span>
                        <button className="toast__close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
