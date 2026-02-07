'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Star, Edit2, Trash2, Settings, X, AlertCircle, Check, ChevronDown, Filter, Copy, Eye, EyeOff } from 'lucide-react';
import './Rating.css';

// --- MOCK SERVICE IMPLEMENTATION ---

let mockScales = [
    { id: '1', name: 'Standard 5-Point', min_value: 1, max_value: 5, description: 'Standard rating scale from 1 (Poor) to 5 (Excellent).', is_active: true },
    { id: '2', name: 'eNPS Scale', min_value: 0, max_value: 10, description: 'Employee Net Promoter Score scale.', is_active: true },
    { id: '3', name: '3-Point Simple', min_value: 1, max_value: 3, description: 'Below, Meets, Exceeds expectations.', is_active: false },
];

let mockCategories = [
    { id: 'c1', name: 'Core Values', rating_scale: '1', min_score: 3, max_score: 5, description: 'Alignment with company core values and culture.', color_code: '#D4AF37' },
    { id: 'c2', name: 'Technical Skills', rating_scale: '1', min_score: 1, max_score: 5, description: 'Proficiency in required technical areas for the role.', color_code: '#3b82f6' },
    { id: 'c3', name: 'Leadership', rating_scale: '2', min_score: 8, max_score: 10, description: 'Ability to lead, mentor, and inspire others.', color_code: '#10b981' },
];

const getRatingScales = async () => new Promise(r => setTimeout(() => r([...mockScales]), 500));
const createRatingScale = async (data) => new Promise(r => {
    const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockScales.push(newItem);
    setTimeout(() => r(newItem), 500);
});
const updateRatingScale = async (id, data) => new Promise(r => {
    mockScales = mockScales.map(s => s.id === id ? { ...s, ...data } : s);
    setTimeout(() => r(data), 500);
});
const deleteRatingScale = async (id) => new Promise(r => {
    mockScales = mockScales.filter(s => s.id !== id);
    setTimeout(() => r(true), 500);
});

const getRatingCategories = async () => new Promise(r => setTimeout(() => r([...mockCategories]), 500));
const createRatingCategory = async (data) => new Promise(r => {
    const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockCategories.push(newItem);
    setTimeout(() => r(newItem), 500);
});
const updateRatingCategory = async (id, data) => new Promise(r => {
    mockCategories = mockCategories.map(c => c.id === id ? { ...c, ...data } : c);
    setTimeout(() => r(data), 500);
});
const deleteRatingCategory = async (id) => new Promise(r => {
    mockCategories = mockCategories.filter(c => c.id !== id);
    setTimeout(() => r(true), 500);
});

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => (
    <div className={`toast toast--${type}`}>
        <div className="toast__icon">
            {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        </div>
        <p className="toast__message">{message}</p>
        <button className="toast__close" onClick={onClose}>
            <X size={16} />
        </button>
    </div>
);

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="empty-state">
        <div className="empty-state__icon">
            <Icon size={48} />
        </div>
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__description">{description}</p>
        {action && (
            <button className="btn btn-primary" onClick={action.onClick}>
                <Plus size={18} />
                {action.label}
            </button>
        )}
    </div>
);

// Confirmation Modal Component
const ConfirmDialog = ({ title, message, onConfirm, onCancel, isOpen }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// Scale Card Component
const ScaleCard = ({ scale, onEdit, onDelete, onDuplicate, onToggleActive }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`rating-card ${!scale.is_active ? 'rating-card--inactive' : ''}`}>
            <div className="rating-card__header">
                <div className="rating-card__icon">
                    <Star size={18} fill={scale.is_active ? 'currentColor' : 'none'} />
                </div>
                <div className="rating-card__badges">
                    <span className={`badge ${scale.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {scale.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            
            <h4 className="rating-card__name">{scale.name}</h4>
            
            <div className="rating-card__range">
                <div className="range-indicator">
                    <span className="range-indicator__label">Min</span>
                    <span className="range-indicator__value">{scale.min_value}</span>
                </div>
                <div className="range-indicator__divider"></div>
                <div className="range-indicator">
                    <span className="range-indicator__label">Max</span>
                    <span className="range-indicator__value">{scale.max_value}</span>
                </div>
            </div>

            {scale.description && (
                <div className="rating-card__description-wrapper">
                    <p className={`rating-card__description ${isExpanded ? 'expanded' : ''}`}>
                        {scale.description}
                    </p>
                    {scale.description.length > 100 && (
                        <button 
                            className="rating-card__expand"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            )}

            <div className="rating-card__actions">
                <button 
                    className="btn-icon" 
                    onClick={() => onToggleActive(scale)}
                    title={scale.is_active ? 'Deactivate' : 'Activate'}
                >
                    {scale.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button 
                    className="btn-icon" 
                    onClick={() => onDuplicate(scale)}
                    title="Duplicate"
                >
                    <Copy size={14} />
                </button>
                <button 
                    className="btn-icon" 
                    onClick={() => onEdit(scale)}
                    title="Edit"
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    className="btn-icon btn-icon--danger" 
                    onClick={() => onDelete(scale)}
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

// Category Item Component
const CategoryItem = ({ category, scales, onEdit, onDelete, onDuplicate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scaleName = scales.find(s => s.id === category.rating_scale)?.name || 'Unknown Scale';

    return (
        <div className="category-item">
            <div 
                className="category-color" 
                style={{ backgroundColor: category.color_code }}
            >
                <div className="category-color__overlay"></div>
            </div>
            
            <div className="category-content">
                <div className="category-header">
                    <div className="category-info">
                        <h4>{category.name}</h4>
                        <span className="category-scale-badge">{scaleName}</span>
                    </div>
                    <div className="category-score">
                        <span className="category-score__range">
                            {category.min_score} - {category.max_score}
                        </span>
                    </div>
                </div>

                {category.description && (
                    <div className="category-description-wrapper">
                        <p className={`category-description ${isExpanded ? 'expanded' : ''}`}>
                            {category.description}
                        </p>
                        {category.description.length > 100 && (
                            <button 
                                className="category-expand"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </div>
                )}

                <div className="category-actions">
                    <button 
                        className="btn-icon" 
                        onClick={() => onDuplicate(category)}
                        title="Duplicate"
                    >
                        <Copy size={14} />
                    </button>
                    <button 
                        className="btn-icon" 
                        onClick={() => onEdit(category)}
                        title="Edit"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        className="btn-icon btn-icon--danger" 
                        onClick={() => onDelete(category)}
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Ratings() {
    const [activeTab, setActiveTab] = useState('scales');
    const [scales, setScales] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all');
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, item: null });
    
    const [formData, setFormData] = useState({
        name: '',
        min_value: 0,
        max_value: 5,
        description: '',
        is_active: true
    });
    
    const [categoryFormData, setCategoryFormData] = useState({
        rating_scale: '',
        name: '',
        min_score: 0,
        max_score: 5,
        description: '',
        color_code: '#10b981'
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'scales') {
                const data = await getRatingScales();
                setScales(data || []);
            } else {
                const [categoriesData, scalesData] = await Promise.all([
                    getRatingCategories(),
                    getRatingScales()
                ]);
                setCategories(categoriesData || []);
                setScales(scalesData || []);
            }
        } catch (error) {
            showToast('Failed to load data', 'error');
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const validateScaleForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (formData.min_value >= formData.max_value) {
            errors.range = 'Max value must be greater than min value';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateCategoryForm = () => {
        const errors = {};
        if (!categoryFormData.name.trim()) errors.name = 'Name is required';
        if (!categoryFormData.rating_scale) errors.rating_scale = 'Rating scale is required';
        if (categoryFormData.min_score >= categoryFormData.max_score) {
            errors.range = 'Max score must be greater than min score';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleScaleSubmit = async (e) => {
        e.preventDefault();
        if (!validateScaleForm()) return;

        try {
            if (editingItem) {
                await updateRatingScale(editingItem.id, formData);
                showToast('Rating scale updated successfully');
            } else {
                await createRatingScale(formData);
                showToast('Rating scale created successfully');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            showToast('Failed to save rating scale', 'error');
            console.error('Failed to save scale:', error);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!validateCategoryForm()) return;

        try {
            if (editingItem) {
                await updateRatingCategory(editingItem.id, categoryFormData);
                showToast('Category updated successfully');
            } else {
                await createRatingCategory(categoryFormData);
                showToast('Category created successfully');
            }
            setShowModal(false);
            resetCategoryForm();
            loadData();
        } catch (error) {
            showToast('Failed to save category', 'error');
            console.error('Failed to save category:', error);
        }
    };

    const handleEditScale = (scale) => {
        setEditingItem(scale);
        setFormData({
            name: scale.name,
            min_value: scale.min_value,
            max_value: scale.max_value,
            description: scale.description || '',
            is_active: scale.is_active
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEditCategory = (category) => {
        setEditingItem(category);
        setCategoryFormData({
            rating_scale: category.rating_scale,
            name: category.name,
            min_score: category.min_score,
            max_score: category.max_score,
            description: category.description || '',
            color_code: category.color_code
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDuplicateScale = (scale) => {
        setEditingItem(null);
        setFormData({
            name: `${scale.name} (Copy)`,
            min_value: scale.min_value,
            max_value: scale.max_value,
            description: scale.description || '',
            is_active: scale.is_active
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDuplicateCategory = (category) => {
        setEditingItem(null);
        setCategoryFormData({
            rating_scale: category.rating_scale,
            name: `${category.name} (Copy)`,
            min_score: category.min_score,
            max_score: category.max_score,
            description: category.description || '',
            color_code: category.color_code
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleToggleScaleActive = async (scale) => {
        try {
            await updateRatingScale(scale.id, { ...scale, is_active: !scale.is_active });
            showToast(`Scale ${!scale.is_active ? 'activated' : 'deactivated'} successfully`);
            loadData();
        } catch (error) {
            showToast('Failed to update scale status', 'error');
            console.error('Failed to toggle scale:', error);
        }
    };

    const handleDeleteScale = (scale) => {
        setConfirmDialog({
            isOpen: true,
            item: scale,
            type: 'scale'
        });
    };

    const handleDeleteCategory = (category) => {
        setConfirmDialog({
            isOpen: true,
            item: category,
            type: 'category'
        });
    };

    const confirmDelete = async () => {
        const { item, type } = confirmDialog;
        try {
            if (type === 'scale') {
                await deleteRatingScale(item.id);
                showToast('Rating scale deleted successfully');
            } else {
                await deleteRatingCategory(item.id);
                showToast('Category deleted successfully');
            }
            loadData();
        } catch (error) {
            showToast(`Failed to delete ${type}`, 'error');
            console.error(`Failed to delete ${type}:`, error);
        } finally {
            setConfirmDialog({ isOpen: false, item: null });
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            min_value: 0,
            max_value: 5,
            description: '',
            is_active: true
        });
        setFormErrors({});
    };

    const resetCategoryForm = () => {
        setEditingItem(null);
        setCategoryFormData({
            rating_scale: '',
            name: '',
            min_score: 0,
            max_score: 5,
            description: '',
            color_code: '#10b981'
        });
        setFormErrors({});
    };

    // Filtered and searched data
    const filteredScales = useMemo(() => {
        return scales.filter(scale => {
            const matchesSearch = scale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 scale.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterActive === 'all' || 
                                 (filterActive === 'active' && scale.is_active) ||
                                 (filterActive === 'inactive' && !scale.is_active);
            return matchesSearch && matchesFilter;
        });
    }, [scales, searchTerm, filterActive]);

    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   category.description?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [categories, searchTerm]);

    const activeScales = scales.filter(s => s.is_active);

    return (
        <div className="ratings">


            {/* Toast Notifications */}
            {toast && (
                <div className="toast-container">
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={`Delete ${confirmDialog.type === 'scale' ? 'Rating Scale' : 'Category'}`}
                message={`Are you sure you want to delete "${confirmDialog.item?.name}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, item: null })}
            />

            {/* Header */}
            <div className="ratings-header">
                <div className="ratings-header__content">
                    <h1 className="ratings-header__title">Performance Ratings</h1>
                    <p className="ratings-header__subtitle">
                        Manage rating scales and categories for employee performance evaluations
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="ratings-tabs">
                <button
                    className={`ratings-tab ${activeTab === 'scales' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('scales');
                        setSearchTerm('');
                        setFilterActive('all');
                    }}
                >
                    <Star size={16} />
                    <span>Rating Scales</span>
                    <span className="ratings-tab__count">{scales.length}</span>
                </button>
                <button
                    className={`ratings-tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('categories');
                        setSearchTerm('');
                    }}
                >
                    <Settings size={16} />
                    <span>Rating Categories</span>
                    <span className="ratings-tab__count">{categories.length}</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="ratings-toolbar">
                <div className="ratings-toolbar__left">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                className="search-box__clear"
                                onClick={() => setSearchTerm('')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {activeTab === 'scales' && (
                        <div className="filter-dropdown">
                            <Filter size={16} />
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value)}
                            >
                                <option value="all">All Scales</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                            <ChevronDown size={14} />
                        </div>
                    )}
                </div>

                <button 
                    className="btn btn-primary"
                    onClick={() => { 
                        activeTab === 'scales' ? resetForm() : resetCategoryForm(); 
                        setShowModal(true); 
                    }}
                >
                    <Plus size={18} />
                    Add {activeTab === 'scales' ? 'Scale' : 'Category'}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="ratings-loading">
                    <div className="spinner"></div>
                    <p>Loading {activeTab}...</p>
                </div>
            ) : activeTab === 'scales' ? (
                filteredScales.length > 0 ? (
                    <div className="ratings-grid">
                        {filteredScales.map(scale => (
                            <ScaleCard
                                key={scale.id}
                                scale={scale}
                                onEdit={handleEditScale}
                                onDelete={handleDeleteScale}
                                onDuplicate={handleDuplicateScale}
                                onToggleActive={handleToggleScaleActive}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Star}
                        title={searchTerm ? 'No scales found' : 'No rating scales yet'}
                        description={searchTerm ? 'Try adjusting your search or filters' : 'Create your first rating scale to get started'}
                        action={!searchTerm && {
                            label: 'Create Rating Scale',
                            onClick: () => {
                                resetForm();
                                setShowModal(true);
                            }
                        }}
                    />
                )
            ) : (
                filteredCategories.length > 0 ? (
                    <div className="categories-list">
                        {filteredCategories.map(category => (
                            <CategoryItem
                                key={category.id}
                                category={category}
                                scales={scales}
                                onEdit={handleEditCategory}
                                onDelete={handleDeleteCategory}
                                onDuplicate={handleDuplicateCategory}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Settings}
                        title={searchTerm ? 'No categories found' : 'No rating categories yet'}
                        description={searchTerm ? 'Try adjusting your search' : 'Create your first rating category to get started'}
                        action={!searchTerm && activeScales.length > 0 && {
                            label: 'Create Category',
                            onClick: () => {
                                resetCategoryForm();
                                setShowModal(true);
                            }
                        }}
                    />
                )
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {editingItem ? 'Edit' : 'Create'} {activeTab === 'scales' ? 'Rating Scale' : 'Category'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        
                        {activeTab === 'scales' ? (
                            <form onSubmit={handleScaleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Scale Name <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className={formErrors.name ? 'error' : ''}
                                            placeholder="e.g., 1-5 Performance Scale"
                                        />
                                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Min Value <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.min_value}
                                                onChange={(e) => setFormData({...formData, min_value: parseFloat(e.target.value) || 0})}
                                                className={formErrors.range ? 'error' : ''}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Value <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.max_value}
                                                onChange={(e) => setFormData({...formData, max_value: parseFloat(e.target.value) || 0})}
                                                className={formErrors.range ? 'error' : ''}
                                            />
                                        </div>
                                    </div>
                                    {formErrors.range && <span className="error-message">{formErrors.range}</span>}
                                    
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows={3}
                                            placeholder="Describe what this scale measures and how it should be used..."
                                        />
                                    </div>
                                    
                                    <div className="form-group form-group--checkbox">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        />
                                        <label htmlFor="is_active">Active (available for use in evaluations)</label>
                                    </div>
                                </div>
                                
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <Check size={16} />
                                        {editingItem ? 'Update Scale' : 'Create Scale'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCategorySubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Category Name <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={categoryFormData.name}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                            className={formErrors.name ? 'error' : ''}
                                            placeholder="e.g., Excellent, Good, Needs Improvement"
                                        />
                                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Rating Scale <span className="required">*</span></label>
                                        <select
                                            value={categoryFormData.rating_scale}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, rating_scale: e.target.value})}
                                            className={formErrors.rating_scale ? 'error' : ''}
                                        >
                                            <option value="">Select a rating scale</option>
                                            {activeScales.map(scale => (
                                                <option key={scale.id} value={scale.id}>
                                                    {scale.name} ({scale.min_value} - {scale.max_value})
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.rating_scale && <span className="error-message">{formErrors.rating_scale}</span>}
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Min Score <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={categoryFormData.min_score}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, min_score: parseFloat(e.target.value) || 0})}
                                                className={formErrors.range ? 'error' : ''}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Score <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={categoryFormData.max_score}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, max_score: parseFloat(e.target.value) || 0})}
                                                className={formErrors.range ? 'error' : ''}
                                            />
                                        </div>
                                    </div>
                                    {formErrors.range && <span className="error-message">{formErrors.range}</span>}
                                    
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-picker-wrapper">
                                            <input
                                                type="color"
                                                value={categoryFormData.color_code}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, color_code: e.target.value})}
                                            />
                                            <input
                                                type="text"
                                                value={categoryFormData.color_code}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, color_code: e.target.value})}
                                                placeholder="#10b981"
                                                className="color-input-text"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={categoryFormData.description}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                                            rows={3}
                                            placeholder="Describe what this category represents..."
                                        />
                                    </div>
                                </div>
                                
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <Check size={16} />
                                        {editingItem ? 'Update Category' : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
