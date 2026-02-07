'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Search, Plus, Gift, Edit2, Trash2, TrendingUp, 
    Filter, Download, Upload, BarChart3, Clock,
    ChevronDown, X, AlertCircle, CheckCircle2, LayoutGrid, List
} from 'lucide-react';
import { 
    getBonusMappings, createBonusMapping, updateBonusMapping, deleteBonusMapping,
    getRatingScales
} from '../services/performanceService';
import './BonusPoints.css';

// Toast component
const Toast = ({ message, type, onClose }) => (
    <div className="bonus-toast">
        {type === 'success' ? <CheckCircle2 size={20} color="#4ade80" /> : <AlertCircle size={20} color="#ef4444" />}
        <span>{message}</span>
        <button onClick={onClose}>
            <X size={16} />
        </button>
    </div>
);

// Custom Hook for LocalStorage
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

export default function BonusPoints() {
    // State management
    const [mappings, setMappings] = useState([]);
    const [scales, setScales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMapping, setEditingMapping] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [toast, setToast] = useState(null);
    const [viewMode, setViewMode] = useLocalStorage('bonusViewMode', 'grid');
    const [selectedMappings, setSelectedMappings] = useState(new Set());
    
    // File input ref for import (currently front-end only / future backend)
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: '',
        rating_scale: '',
        min_rating: 0,
        max_rating: 5,
        bonus_percentage: 0,
        applies_to_level: '',
        is_active: true,
        effective_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mappingsRes, scalesRes] = await Promise.all([
                getBonusMappings(),
                getRatingScales()
            ]);
            // Backend returns array directly for list endpoints based on service logic
            setMappings(mappingsRes || []);
            setScales(scalesRes || []);
        } catch (error) {
            console.error("Failed to load bonus data:", error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const processedMappings = useMemo(() => {
        let filtered = mappings.filter(mapping => {
            const matchesSearch = mapping.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || 
                                 (filterStatus === 'active' && mapping.is_active) ||
                                 (filterStatus === 'inactive' && !mapping.is_active);
            const matchesLevel = filterLevel === 'all' || !mapping.applies_to_level || mapping.applies_to_level === filterLevel;
            return matchesSearch && matchesStatus && matchesLevel;
        });

        filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            if (sortBy === 'bonus_percentage') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [mappings, searchQuery, filterStatus, filterLevel, sortBy, sortOrder]);

    const statistics = useMemo(() => {
        const active = mappings.filter(m => m.is_active).length;
        const avgBonus = mappings.length > 0
            ? mappings.reduce((sum, m) => sum + parseFloat(m.bonus_percentage), 0) / mappings.length
            : 0;
        const maxBonus = mappings.length > 0
            ? Math.max(...mappings.map(m => parseFloat(m.bonus_percentage)))
            : 0;
        return { total: mappings.length, active, avgBonus, maxBonus };
    }, [mappings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare payload
            const payload = {
                ...formData,
                min_rating: parseFloat(formData.min_rating),
                max_rating: parseFloat(formData.max_rating),
                bonus_percentage: parseFloat(formData.bonus_percentage)
            };

            if (editingMapping) {
                const updated = await updateBonusMapping(editingMapping.id, payload);
                setMappings(prev => prev.map(m => m.id === updated.id ? updated : m));
                showToast('Bonus mapping updated');
            } else {
                const created = await createBonusMapping(payload);
                setMappings(prev => [...prev, created]);
                showToast('Bonus mapping created');
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error(error);
            showToast('Failed to save mapping', 'error');
        }
    };

    const resetForm = () => {
        setEditingMapping(null);
        setFormData({
            name: '', rating_scale: '', min_rating: 0, max_rating: 5,
            bonus_percentage: 0, applies_to_level: '', is_active: true,
            effective_date: new Date().toISOString().split('T')[0], notes: ''
        });
    };

    const handleEdit = (mapping) => {
        setEditingMapping(mapping);
        setFormData({ 
            ...mapping,
            // Ensure proper format for inputs
            effective_date: mapping.effective_date ? new Date(mapping.effective_date).toISOString().split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this mapping?')) {
            try {
                await deleteBonusMapping(id);
                setMappings(prev => prev.filter(m => m.id !== id));
                showToast('Mapping deleted');
            } catch (error) {
                showToast('Failed to delete mapping', 'error');
            }
        }
    }

    const toggleSelection = (id) => {
        setSelectedMappings(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };
    
    // Future Import/Export implementation could use backend or file parsing here
    const handleImport = async (e) => {
         // Placeholder for future backend import endpoint implementation
         showToast('Import functionality not yet connected to backend', 'error');
    };

    const handleExport = () => {
        // Simple client-side export of current data
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mappings, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "bonus_mappings.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    return (
        <div className="bonus-points-wrapper">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="bonus-container">
                {/* Header */}
                <div className="bonus-header-section">
                    <div className="bonus-title-group">
                        <h2><Gift size={28} color="#D4AF37" /> Bonus Point Mappings</h2>
                        <p>Configure performance ratings and bonus structures for your organization.</p>
                    </div>
                    <div className="header-actions">
                        <button className="bonus-btn bonus-btn-outline" onClick={handleExport} style={{marginRight: '0.5rem'}}>
                            <Download size={18} /> Export
                        </button>
                        <button className="bonus-btn bonus-btn-gold" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={18} /> Add Mapping
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="bonus-stats-grid">
                    <div className="bonus-stat-card">
                        <span className="bonus-stat-label">Total Mappings</span>
                        <span className="bonus-stat-value">{statistics.total}</span>
                    </div>
                    <div className="bonus-stat-card">
                        <span className="bonus-stat-label">Active Rules</span>
                        <span className="bonus-stat-value green">{statistics.active}</span>
                    </div>
                    <div className="bonus-stat-card">
                        <span className="bonus-stat-label">Avg Bonus</span>
                        <span className="bonus-stat-value gold">{statistics.avgBonus.toFixed(1)}%</span>
                    </div>
                    <div className="bonus-stat-card">
                        <span className="bonus-stat-label">Max Bonus</span>
                        <span className="bonus-stat-value gold">{statistics.maxBonus}%</span>
                    </div>
                </div>

                {/* Filters & Toolbar */}
                <div className="bonus-filters-bar">
                    <div className="bonus-search-wrapper">
                        <Search size={18} />
                        <input 
                            type="text" 
                            className="bonus-search-input" 
                            placeholder="Search mappings..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="bonus-control-group">
                        <select className="bonus-custom-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="all">All Levels</option>
                            <option value="Senior">Senior</option>
                            <option value="Mid">Mid</option>
                            <option value="Junior">Junior</option>
                            <option value="Manager">Manager</option>
                        </select>
                        
                        <select className="bonus-custom-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="name">Name</option>
                            <option value="bonus_percentage">Bonus %</option>
                        </select>

                        <div className="bonus-view-toggle">
                            <button className={`bonus-btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                                <LayoutGrid size={18} />
                            </button>
                            <button className={`bonus-btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bonus-empty-state">
                        <p>Loading data...</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'bonus-grid-view' : 'bonus-list-view'}>
                        {processedMappings.length > 0 ? processedMappings.map(mapping => (
                            <div key={mapping.id} className={`bonus-card ${selectedMappings.has(mapping.id) ? 'selected' : ''}`}>
                                <div className="bonus-card-header">
                                    <div className="bonus-card-title-group">
                                        <input 
                                            type="checkbox" 
                                            className="bonus-custom-checkbox"
                                            checked={selectedMappings.has(mapping.id)}
                                            onChange={() => toggleSelection(mapping.id)}
                                        />
                                        <div>
                                            <h4 className="bonus-card-title">{mapping.name}</h4>
                                            <span className={`bonus-status-badge ${mapping.is_active ? 'bonus-status-active' : 'bonus-status-inactive'}`}>
                                                {mapping.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Action Dot Menu could go here */}
                                </div>
                                
                                <div className="bonus-card-body">
                                    <div className="bonus-percentage-display">
                                        {parseFloat(mapping.bonus_percentage)}%
                                        <TrendingUp size={24} color="#D4AF37" />
                                    </div>
                                    
                                    <div className="bonus-info-row">
                                        <span className="bonus-info-label">Rating Range</span>
                                        <span className="bonus-info-val">{parseFloat(mapping.min_rating)} - {parseFloat(mapping.max_rating)}</span>
                                    </div>
                                    {mapping.applies_to_level && (
                                        <div className="bonus-info-row">
                                            <span className="bonus-info-label">Level</span>
                                            <span className="bonus-info-val">{mapping.applies_to_level}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bonus-card-actions">
                                    <button className="bonus-btn-icon" onClick={() => handleEdit(mapping)}><Edit2 size={16} /></button>
                                    <button className="bonus-btn-icon" onClick={() => handleDelete(mapping.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        )) : (
                            <div className="bonus-empty-state">
                                <p>No mappings found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="bonus-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="bonus-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="bonus-modal-header">
                            <h2>{editingMapping ? 'Edit Mapping' : 'New Mapping'}</h2>
                            <button className="bonus-btn-icon" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="bonus-modal-body">
                                <div className="bonus-form-group">
                                    <label>Mapping Name</label>
                                    <input required type="text" className="bonus-form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Executive Bonus" />
                                </div>
                                <div className="bonus-form-group">
                                    <label>Rating Scale</label>
                                    <select className="bonus-form-input" value={formData.rating_scale} onChange={e => setFormData({...formData, rating_scale: e.target.value})}>
                                        <option value="">Select Scale...</option>
                                        {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                                    <div className="bonus-form-group">
                                        <label>Min Rating</label>
                                        <input type="number" step="0.1" className="bonus-form-input" value={formData.min_rating} onChange={e => setFormData({...formData, min_rating: parseFloat(e.target.value)})} />
                                    </div>
                                    <div className="bonus-form-group">
                                        <label>Max Rating</label>
                                        <input type="number" step="0.1" className="bonus-form-input" value={formData.max_rating} onChange={e => setFormData({...formData, max_rating: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="bonus-form-group">
                                    <label>Bonus Percentage</label>
                                    <input type="number" step="0.5" className="bonus-form-input" value={formData.bonus_percentage} onChange={e => setFormData({...formData, bonus_percentage: parseFloat(e.target.value)})} />
                                </div>
                                <div className="bonus-form-group">
                                    <label>Notes</label>
                                    <textarea className="bonus-form-input" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                                </div>
                                <div className="bonus-form-group" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                    <input 
                                        type="checkbox" 
                                        className="bonus-custom-checkbox" 
                                        style={{width: '1rem', height: '1rem'}}
                                        checked={formData.is_active} 
                                        onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                                    />
                                    <label style={{marginBottom: 0}}>Is Active</label>
                                </div>
                            </div>
                            <div className="bonus-modal-footer">
                                <button type="button" className="bonus-btn bonus-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="bonus-btn bonus-btn-gold">Save Mapping</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
