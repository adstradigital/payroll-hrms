'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Search, Plus, Gift, Edit2, Trash2, TrendingUp, 
    Filter, Download, Upload, BarChart3, Clock,
    ChevronDown, X, AlertCircle, CheckCircle2, LayoutGrid, List,
    Star, Play, Calculator
} from 'lucide-react';
import { 
    getBonusMappings, createBonusMapping, updateBonusMapping, deleteBonusMapping,
    getRatingScales, calculateBonus
} from '../services/performanceService';
import './BonusPoints.css';

// Toast component
const Toast = ({ message, type, onClose }) => (
    <div className="toast">
        {type === 'success' ? <CheckCircle2 size={20} color="#4ade80" /> : <AlertCircle size={20} color="#ef4444" />}
        <span>{message}</span>
        <button className="modal-close" onClick={onClose}>
            <X size={16} />
        </button>
    </div>
);

// Star display component
const StarRating = ({ rating, max = 5, size = 16, color = "#D4AF37" }) => {
    return (
        <div className="star-container">
            {[...Array(max)].map((_, i) => (
                <Star 
                    key={i} 
                    size={size} 
                    fill={i < Math.floor(rating) ? color : "none"} 
                    stroke={color}
                    strokeWidth={1.5}
                    className={i < Math.floor(rating) ? "text-gold" : "text-gray"}
                />
            ))}
            <span className="star-text">({rating})</span>
        </div>
    );
};

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
    const [showFilters, setShowFilters] = useState(true);
    
    // Test Calculator State
    const [showTestModal, setShowTestModal] = useState(false);
    const [testData, setTestData] = useState({ rating: 0, employee_level: '' });
    const [testResult, setTestResult] = useState(null);
    const [testLoading, setTestLoading] = useState(false);

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

    const handleTestCalculation = async (e) => {
        e.preventDefault();
        setTestLoading(true);
        setTestResult(null);
        try {
            const result = await calculateBonus(testData.rating, testData.employee_level);
            setTestResult(result);
        } catch (error) {
            console.error("Calculation failed:", error);
            showToast('Calculation failed', 'error');
        } finally {
            setTestLoading(false);
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
        <div className="bonus-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header & Stats */}
            <div className="bonus-header">
                <div style={{marginBottom: '1.5rem'}}>
                    <h1 className="bonus-title">Bonus Point Mappings</h1>
                    <p className="bonus-subtitle">Configure performance ratings and bonus structures for your organization.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card stat-card--secondary">
                        <div className="stat-card__icon"><List size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{statistics.total}</div>
                            <div className="stat-card__label">Total Mappings</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--success">
                        <div className="stat-card__icon"><CheckCircle2 size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{statistics.active}</div>
                            <div className="stat-card__label">Active Rules</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--primary">
                        <div className="stat-card__icon"><Gift size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{statistics.avgBonus.toFixed(1)}%</div>
                            <div className="stat-card__label">Avg Bonus</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--primary">
                        <div className="stat-card__icon"><TrendingUp size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{statistics.maxBonus}%</div>
                            <div className="stat-card__label">Max Bonus</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bonus-toolbar">
                <div className="bonus-toolbar__left">
                    <div className="bonus-search">
                        <Search size={18} className="bonus-search__icon" />
                        <input 
                            type="text" 
                            className="bonus-search__input" 
                            placeholder="Search mappings..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className={`btn btn-outline ${showFilters ? 'btn-outline--active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={18} /> Filters
                    </button>
                    <div className="bonus-view-toggle ml-2" style={{display: 'flex', gap: '0.5rem'}}>
                        <button className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                            <LayoutGrid size={18} />
                        </button>
                        <button className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                            <List size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="bonus-toolbar__right">
                    <button className="btn btn-outline" onClick={() => setShowTestModal(true)}>
                        <Calculator size={18} /> Test Calculator
                    </button>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} /> Export
                    </button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={18} /> Add Mapping
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-group">
                        <label className="filter-label">Level</label>
                        <select className="filter-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="all">All Levels</option>
                            <option value="Senior">Senior</option>
                            <option value="Mid">Mid</option>
                            <option value="Junior">Junior</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="name">Name</option>
                            <option value="bonus_percentage">Bonus %</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="empty-state">
                    <p>Loading data...</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'bonus-grid' : 'bonus-list'}>
                    {processedMappings.length > 0 ? processedMappings.map(mapping => (
                        <div key={mapping.id} className="bonus-card">
                            <div className="bonus-card-header">
                                <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                                    <div>
                                        <h4 className="bonus-card-title">{mapping.name}</h4>
                                        <span className={`badge ${mapping.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                            {mapping.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="bonus-percentage">
                                    {parseFloat(mapping.bonus_percentage)}%
                                </div>
                            </div>
                            
                            <div className="bonus-card-body">
                                <div className="bonus-info-row">
                                    <span className="bonus-info-label">Rating Trigger</span>
                                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                                        <span className="bonus-info-val mb-1">{parseFloat(mapping.min_rating)} - {parseFloat(mapping.max_rating)}</span>
                                        <StarRating rating={mapping.min_rating} max={5} size={12} />
                                    </div>
                                </div>
                                {mapping.applies_to_level && (
                                    <div className="bonus-info-row">
                                        <span className="bonus-info-label">Level</span>
                                        <span className="bonus-info-val">{mapping.applies_to_level}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bonus-card-actions">
                                <button className="btn-icon" onClick={() => handleEdit(mapping)}><Edit2 size={16} /></button>
                                <button className="btn-icon" onClick={() => handleDelete(mapping.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">
                            <div className="empty-state__icon"><Gift size={48} /></div>
                            <h3 className="empty-state__title">No mappings found</h3>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingMapping ? 'Edit Mapping' : 'New Mapping'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Mapping Name</label>
                                    <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Executive Bonus" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating Scale</label>
                                    <select className="form-select" value={formData.rating_scale} onChange={e => setFormData({...formData, rating_scale: e.target.value})}>
                                        <option value="">Select Scale...</option>
                                        {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                                    <div className="form-group">
                                        <label className="form-label">Min Rating</label>
                                        <input type="number" step="0.1" className="form-input" value={formData.min_rating} onChange={e => setFormData({...formData, min_rating: parseFloat(e.target.value)})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Rating</label>
                                        <input type="number" step="0.1" className="form-input" value={formData.max_rating} onChange={e => setFormData({...formData, max_rating: parseFloat(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bonus Percentage</label>
                                    <input type="number" step="0.5" className="form-input" value={formData.bonus_percentage} onChange={e => setFormData({...formData, bonus_percentage: parseFloat(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                                </div>
                                <div className="form-group" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                    <input 
                                        type="checkbox" 
                                        style={{width: '1rem', height: '1rem', accentColor: 'var(--rv-color-gold)'}}
                                        checked={formData.is_active} 
                                        onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                                    />
                                    <label style={{marginBottom: 0, color: 'white'}}>Is Active</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Mapping</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Calculator Modal */}
            {showTestModal && (
                <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
                    <div className="modal" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Calculator size={20} style={{marginRight: '8px', verticalAlign: 'middle'}}/>Test Calculator</h2>
                            <button className="modal-close" onClick={() => setShowTestModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleTestCalculation}>
                            <div className="modal-body">
                                <p className="text-sm text-gray-500 mb-4" style={{color: 'var(--rv-color-mist)'}}>Simulate a rating to see which bonus rule applies.</p>
                                <div className="form-group">
                                    <label className="form-label">Rating (0-5)</label>
                                    <input required type="number" step="0.1" min="0" max="5" className="form-input" 
                                        value={testData.rating} 
                                        onChange={e => setTestData({...testData, rating: parseFloat(e.target.value)})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employee Level (Optional)</label>
                                    <select className="form-select" 
                                        value={testData.employee_level} 
                                        onChange={e => setTestData({...testData, employee_level: e.target.value})}
                                    >
                                        <option value="">Any Level</option>
                                        <option value="Senior">Senior</option>
                                        <option value="Mid">Mid</option>
                                        <option value="Junior">Junior</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>

                                {testResult && (
                                    <div className="test-result-box">
                                        <div className="result-label">Result</div>
                                        <div className="result-value">
                                            {testResult.bonus_percentage}% Bonus
                                        </div>
                                        <div className="result-sub">
                                            Based on Rating: {testResult.rating}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowTestModal(false)}>Close</button>
                                <button type="submit" className="btn btn-primary" disabled={testLoading}>
                                    {testLoading ? 'Calculating...' : 'Calculate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
