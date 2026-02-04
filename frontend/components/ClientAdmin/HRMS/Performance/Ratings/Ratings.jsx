'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Star, Edit2, Trash2, Settings } from 'lucide-react';
import { 
    getRatingScales, createRatingScale, updateRatingScale, deleteRatingScale,
    getRatingCategories, createRatingCategory, updateRatingCategory, deleteRatingCategory
} from '../services/performanceService';
import './Ratings.css';

export default function Ratings() {
    const [activeTab, setActiveTab] = useState('scales');
    const [scales, setScales] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
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
                const data = await getRatingCategories();
                setCategories(data || []);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScaleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRatingScale(editingItem.id, formData);
            } else {
                await createRatingScale(formData);
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save scale:', error);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRatingCategory(editingItem.id, categoryFormData);
            } else {
                await createRatingCategory(categoryFormData);
            }
            setShowModal(false);
            resetCategoryForm();
            loadData();
        } catch (error) {
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
        setShowModal(true);
    };

    const handleDeleteScale = async (id) => {
        if (confirm('Are you sure you want to delete this rating scale?')) {
            try {
                await deleteRatingScale(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete scale:', error);
            }
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteRatingCategory(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
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
    };

    return (
        <div className="ratings">
            <div className="ratings-tabs">
                <button
                    className={`ratings-tab ${activeTab === 'scales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scales')}
                >
                    <Star size={16} />
                    Rating Scales
                </button>
                <button
                    className={`ratings-tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    <Settings size={16} />
                    Rating Categories
                </button>
            </div>

            <div className="ratings-toolbar">
                <h3>{activeTab === 'scales' ? 'Rating Scales' : 'Rating Categories'}</h3>
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

            {loading ? (
                <div className="ratings-loading">Loading...</div>
            ) : activeTab === 'scales' ? (
                <div className="ratings-grid">
                    {scales.map(scale => (
                        <div key={scale.id} className="rating-card">
                            <div className="rating-card__header">
                                <div className="rating-card__icon">
                                    <Star size={18} />
                                </div>
                                <span className={`badge ${scale.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                    {scale.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <h4 className="rating-card__name">{scale.name}</h4>
                            <p className="rating-card__range">
                                Range: {scale.min_value} - {scale.max_value}
                            </p>
                            <p className="rating-card__description">{scale.description}</p>
                            <div className="rating-card__actions">
                                <button className="btn-icon" onClick={() => handleEditScale(scale)}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-icon btn-icon--danger" onClick={() => handleDeleteScale(scale.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="categories-list">
                    {categories.map(category => (
                        <div key={category.id} className="category-item">
                            <div 
                                className="category-color" 
                                style={{ backgroundColor: category.color_code }}
                            ></div>
                            <div className="category-info">
                                <h4>{category.name}</h4>
                                <span>Score: {category.min_score} - {category.max_score}</span>
                            </div>
                            <p className="category-description">{category.description}</p>
                            <div className="category-actions">
                                <button className="btn-icon" onClick={() => handleEditCategory(category)}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-icon btn-icon--danger" onClick={() => handleDeleteCategory(category.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {editingItem ? 'Edit' : 'Add'} {activeTab === 'scales' ? 'Rating Scale' : 'Category'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        {activeTab === 'scales' ? (
                            <form onSubmit={handleScaleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Scale Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Min Value</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.min_value}
                                                onChange={(e) => setFormData({...formData, min_value: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Value</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.max_value}
                                                onChange={(e) => setFormData({...formData, max_value: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group form-group--checkbox">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        />
                                        <label htmlFor="is_active">Active</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingItem ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCategorySubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Category Name</label>
                                        <input
                                            type="text"
                                            value={categoryFormData.name}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Rating Scale</label>
                                        <select
                                            value={categoryFormData.rating_scale}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, rating_scale: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Scale</option>
                                            {scales.map(scale => (
                                                <option key={scale.id} value={scale.id}>{scale.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Min Score</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={categoryFormData.min_score}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, min_score: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Score</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={categoryFormData.max_score}
                                                onChange={(e) => setCategoryFormData({...categoryFormData, max_score: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={categoryFormData.color_code}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, color_code: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={categoryFormData.description}
                                            onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingItem ? 'Update' : 'Create'}
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
