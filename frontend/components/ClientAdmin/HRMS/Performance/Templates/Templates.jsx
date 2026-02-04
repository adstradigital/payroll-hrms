'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Edit2, Trash2, Copy, CheckCircle } from 'lucide-react';
import { 
    getPerformanceCriteria, createPerformanceCriteria, 
    updatePerformanceCriteria, deletePerformanceCriteria 
} from '../services/performanceService';
import './Templates.css';

export default function Templates() {
    const [criteria, setCriteria] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        weightage: 0,
        is_active: true
    });

    useEffect(() => {
        loadCriteria();
    }, []);

    const loadCriteria = async () => {
        setLoading(true);
        try {
            const data = await getPerformanceCriteria();
            setCriteria(data || []);
        } catch (error) {
            console.error('Failed to load criteria:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCriteria) {
                await updatePerformanceCriteria(editingCriteria.id, formData);
            } else {
                await createPerformanceCriteria(formData);
            }
            setShowModal(false);
            resetForm();
            loadCriteria();
        } catch (error) {
            console.error('Failed to save criteria:', error);
        }
    };

    const handleEdit = (item) => {
        setEditingCriteria(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            weightage: item.weightage,
            is_active: item.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this criteria?')) {
            try {
                await deletePerformanceCriteria(id);
                loadCriteria();
            } catch (error) {
                console.error('Failed to delete criteria:', error);
            }
        }
    };

    const handleDuplicate = (item) => {
        setEditingCriteria(null);
        setFormData({
            name: `${item.name} (Copy)`,
            description: item.description || '',
            weightage: item.weightage,
            is_active: true
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCriteria(null);
        setFormData({
            name: '',
            description: '',
            weightage: 0,
            is_active: true
        });
    };

    const totalWeightage = criteria
        .filter(c => c.is_active)
        .reduce((sum, c) => sum + parseFloat(c.weightage || 0), 0);

    const filteredCriteria = criteria.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="templates">
            <div className="templates-header">
                <div className="templates-header__info">
                    <h2>
                        <FileText size={20} />
                        Performance Criteria Templates
                    </h2>
                    <p>Define evaluation criteria and their weightage for performance reviews</p>
                </div>
                <div className="templates-header__actions">
                    <div className="weightage-indicator">
                        <span className="weightage-label">Total Weightage:</span>
                        <span className={`weightage-value ${totalWeightage === 100 ? 'valid' : 'invalid'}`}>
                            {totalWeightage.toFixed(1)}%
                        </span>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <Plus size={18} />
                        Add Criteria
                    </button>
                </div>
            </div>

            <div className="templates-toolbar">
                <div className="templates-search">
                    <Search size={18} className="templates-search__icon" />
                    <input
                        type="text"
                        placeholder="Search criteria..."
                        className="templates-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="templates-loading">Loading...</div>
            ) : (
                <div className="templates-list">
                    {filteredCriteria.map(item => (
                        <div key={item.id} className={`template-item ${!item.is_active ? 'inactive' : ''}`}>
                            <div className="template-item__handle">
                                <FileText size={18} />
                            </div>
                            
                            <div className="template-item__content">
                                <div className="template-item__header">
                                    <h4>{item.name}</h4>
                                    <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                        {item.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="template-item__description">{item.description}</p>
                            </div>

                            <div className="template-item__weightage">
                                <div className="weightage-circle">
                                    <span>{item.weightage}%</span>
                                </div>
                            </div>

                            <div className="template-item__actions">
                                <button className="btn-icon" onClick={() => handleDuplicate(item)} title="Duplicate">
                                    <Copy size={14} />
                                </button>
                                <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">
                                    <Edit2 size={14} />
                                </button>
                                <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(item.id)} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredCriteria.length === 0 && (
                        <div className="no-templates">
                            <FileText size={48} />
                            <p>No criteria templates found</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => { resetForm(); setShowModal(true); }}
                            >
                                Create First Criteria
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCriteria ? 'Edit Criteria' : 'Add Criteria'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Criteria Name</label>
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
                                <div className="form-group">
                                    <label>Weightage (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.weightage}
                                        onChange={(e) => setFormData({...formData, weightage: parseFloat(e.target.value)})}
                                        required
                                    />
                                    <span className="form-hint">
                                        Current total: {totalWeightage.toFixed(1)}% (should equal 100%)
                                    </span>
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
                                    {editingCriteria ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
