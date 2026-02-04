'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Gift, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { 
    getBonusMappings, createBonusMapping, updateBonusMapping, deleteBonusMapping,
    getRatingScales 
} from '../services/performanceService';
import './BonusPoints.css';

export default function BonusPoints() {
    const [mappings, setMappings] = useState([]);
    const [scales, setScales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMapping, setEditingMapping] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        rating_scale: '',
        min_rating: 0,
        max_rating: 5,
        bonus_percentage: 0,
        applies_to_level: '',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mappingsData, scalesData] = await Promise.all([
                getBonusMappings(),
                getRatingScales()
            ]);
            setMappings(mappingsData || []);
            setScales(scalesData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMapping) {
                await updateBonusMapping(editingMapping.id, formData);
            } else {
                await createBonusMapping(formData);
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save mapping:', error);
        }
    };

    const handleEdit = (mapping) => {
        setEditingMapping(mapping);
        setFormData({
            name: mapping.name,
            rating_scale: mapping.rating_scale,
            min_rating: mapping.min_rating,
            max_rating: mapping.max_rating,
            bonus_percentage: mapping.bonus_percentage,
            applies_to_level: mapping.applies_to_level || '',
            is_active: mapping.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this bonus mapping?')) {
            try {
                await deleteBonusMapping(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete mapping:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingMapping(null);
        setFormData({
            name: '',
            rating_scale: '',
            min_rating: 0,
            max_rating: 5,
            bonus_percentage: 0,
            applies_to_level: '',
            is_active: true
        });
    };

    const getBonusColor = (percentage) => {
        if (percentage >= 20) return '#10b981';
        if (percentage >= 10) return '#3b82f6';
        if (percentage >= 5) return '#f59e0b';
        return '#6b7280';
    };

    return (
        <div className="bonus-points">
            <div className="bonus-header">
                <div className="bonus-header__info">
                    <h2>
                        <Gift size={20} />
                        Bonus Point Mappings
                    </h2>
                    <p>Configure how performance ratings translate to bonus percentages</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Add Mapping
                </button>
            </div>

            {loading ? (
                <div className="bonus-loading">Loading...</div>
            ) : (
                <div className="bonus-grid">
                    {mappings.map(mapping => (
                        <div key={mapping.id} className="bonus-card">
                            <div className="bonus-card__header">
                                <h4>{mapping.name}</h4>
                                <span className={`badge ${mapping.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                    {mapping.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="bonus-card__body">
                                <div className="bonus-visual">
                                    <div 
                                        className="bonus-percentage"
                                        style={{ color: getBonusColor(mapping.bonus_percentage) }}
                                    >
                                        {mapping.bonus_percentage}%
                                    </div>
                                    <TrendingUp size={24} style={{ color: getBonusColor(mapping.bonus_percentage) }} />
                                </div>

                                <div className="bonus-details">
                                    <div className="bonus-detail">
                                        <span className="bonus-detail__label">Rating Range</span>
                                        <span className="bonus-detail__value">
                                            {mapping.min_rating} - {mapping.max_rating}
                                        </span>
                                    </div>
                                    {mapping.applies_to_level && (
                                        <div className="bonus-detail">
                                            <span className="bonus-detail__label">Level</span>
                                            <span className="bonus-detail__value">{mapping.applies_to_level}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bonus-card__footer">
                                <button className="btn-icon" onClick={() => handleEdit(mapping)}>
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(mapping.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {mappings.length === 0 && (
                        <div className="no-mappings">
                            <Gift size={48} />
                            <p>No bonus mappings configured</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => { resetForm(); setShowModal(true); }}
                            >
                                Create First Mapping
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingMapping ? 'Edit Bonus Mapping' : 'Add Bonus Mapping'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Mapping Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g., Excellent Performance Bonus"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Rating Scale</label>
                                    <select
                                        value={formData.rating_scale}
                                        onChange={(e) => setFormData({...formData, rating_scale: e.target.value})}
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
                                        <label>Min Rating</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.min_rating}
                                            onChange={(e) => setFormData({...formData, min_rating: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Rating</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.max_rating}
                                            onChange={(e) => setFormData({...formData, max_rating: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Bonus Percentage (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.bonus_percentage}
                                        onChange={(e) => setFormData({...formData, bonus_percentage: parseFloat(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Applies to Level (Optional)</label>
                                    <select
                                        value={formData.applies_to_level}
                                        onChange={(e) => setFormData({...formData, applies_to_level: e.target.value})}
                                    >
                                        <option value="">All Levels</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Mid">Mid</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Lead">Lead</option>
                                        <option value="Manager">Manager</option>
                                    </select>
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
                                    {editingMapping ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
