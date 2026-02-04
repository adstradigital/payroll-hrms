'use client';

import { useState, useEffect } from 'react';
import { 
    Search, Plus, Target, Edit2, Trash2, CheckCircle, Clock, 
    Calendar, TrendingUp, X, ChevronDown, MoreVertical, 
    LayoutTemplate, Grid, Printer, Users
} from 'lucide-react';
import { getGoals, createGoal, updateGoal, deleteGoal, getReviewPeriods } from '../services/performanceService';
import './Objectives.css';

export default function Objectives() {
    // State
    const [objectives, setObjectives] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingObjective, setEditingObjective] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [draggedItem, setDraggedItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_date: '',
        status: 'not_started',
        progress_percentage: 0,
        review_period: ''
    });

    // Load periods on mount
    useEffect(() => {
        loadPeriods();
    }, []);

    // Load objectives when period changes
    useEffect(() => {
        if (selectedPeriod) {
            loadObjectives();
        }
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            const data = await getReviewPeriods();
            setPeriods(data?.results || data || []);
            if (data && data.length > 0) {
                const activePeriod = data.find(p => p.status === 'active');
                setSelectedPeriod(activePeriod?.id || data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to load periods:', error);
            setLoading(false);
        }
    };

    const loadObjectives = async () => {
        setLoading(true);
        try {
            const data = await getGoals({ review_period: selectedPeriod });
            setObjectives(data?.results || data || []);
        } catch (error) {
            console.error('Failed to load objectives:', error);
            setObjectives([]);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleEdit = (objective) => {
        setEditingObjective(objective);
        setFormData({ ...objective });
        setShowModal(true);
        setActiveMenu(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this objective permanently?')) {
            try {
                await deleteGoal(id);
                loadObjectives();
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        }
        setActiveMenu(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...formData, 
                review_period: selectedPeriod,
                progress_percentage: formData.status === 'completed' ? 100 : formData.progress_percentage
            };
            
            if (editingObjective) {
                await updateGoal(editingObjective.id, payload);
            } else {
                await createGoal(payload);
            }
            
            setShowModal(false);
            resetForm();
            loadObjectives();
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Kanban Handlers
    const handleDragStart = (e, objective) => {
        setDraggedItem(objective);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, status) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== status) {
            const updatedItem = { 
                ...draggedItem, 
                status: status,
                progress_percentage: status === 'completed' ? 100 : (status === 'not_started' ? 0 : draggedItem.progress_percentage)
            };
            try {
                await updateGoal(draggedItem.id, updatedItem);
                loadObjectives();
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
        setDraggedItem(null);
    };

    const resetForm = () => {
        setEditingObjective(null);
        setFormData({
            title: '',
            description: '',
            target_date: '',
            status: 'not_started',
            progress_percentage: 0,
            review_period: ''
        });
    };

    const filteredObjectives = objectives.filter(o => 
        o.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status Helpers
    const getStatusClass = (status) => {
        switch(status) {
            case 'completed': return 'status-badge--success';
            case 'in_progress': return 'status-badge--warning';
            case 'cancelled': return 'status-badge--danger';
            default: return 'status-badge--secondary';
        }
    };

    const getStatusLabel = (status) => {
        return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'completed': return <CheckCircle size={12} />;
            case 'in_progress': return <TrendingUp size={12} />;
            default: return <Clock size={12} />;
        }
    };

    const statusColumns = ['not_started', 'in_progress', 'completed', 'cancelled'];

    return (
        <div className="objectives-page">
            {/* Decorative Background */}
            <div className="objectives-glow objectives-glow--top"></div>
            <div className="objectives-glow objectives-glow--bottom"></div>

            {/* Header Section */}
            <div className="objectives-header">
                <div className="objectives-header__info">
                    <h1 className="objectives-header__title">Strategic Objectives</h1>
                    <p className="objectives-header__subtitle">Track and manage performance goals</p>
                </div>
                
                <div className="objectives-header__actions">
                    <button onClick={handlePrint} className="btn btn-secondary btn-icon-text">
                        <Printer size={18} />
                        <span className="btn-text-hide-mobile">Export</span>
                    </button>
                    
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                        <Plus size={20} />
                        <span>New Objective</span>
                    </button>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className="objectives-toolbar">
                {/* Period Selector */}
                <div className="objectives-toolbar__select-wrapper">
                    <Calendar size={18} className="objectives-toolbar__select-icon" />
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="objectives-toolbar__select"
                    >
                        {periods.map(period => (
                            <option key={period.id} value={period.id}>{period.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="objectives-toolbar__select-arrow" />
                </div>

                {/* Search Bar */}
                <div className="objectives-toolbar__search">
                    <Search size={18} className="objectives-toolbar__search-icon" />
                    <input
                        type="text"
                        placeholder="Search by keyword..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="objectives-toolbar__search-input"
                    />
                </div>

                {/* View Toggle */}
                <div className="objectives-toolbar__view-toggle">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'view-toggle-btn--active' : ''}`}
                    >
                        <Grid size={16} /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`view-toggle-btn ${viewMode === 'board' ? 'view-toggle-btn--active' : ''}`}
                    >
                        <LayoutTemplate size={16} /> Board
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="objectives-loading">
                    <Target size={48} className="objectives-loading__icon" />
                    <p>Loading objectives...</p>
                </div>
            ) : filteredObjectives.length === 0 ? (
                <div className="objectives-empty">
                    <div className="objectives-empty__icon">
                        <Target size={32} />
                    </div>
                    <h3>No objectives found</h3>
                    <p>Try adjusting your filters or create a new one.</p>
                </div>
            ) : (
                <>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="objectives-grid">
                            {filteredObjectives.map(obj => (
                                <div key={obj.id} className="objective-card">
                                    {/* Card Header */}
                                    <div className="objective-card__header">
                                        <span className={`status-badge ${getStatusClass(obj.status)}`}>
                                            {getStatusIcon(obj.status)}
                                            {getStatusLabel(obj.status)}
                                        </span>
                                        
                                        <div className="objective-card__menu">
                                            <button 
                                                onClick={() => setActiveMenu(activeMenu === obj.id ? null : obj.id)}
                                                className="objective-card__menu-btn"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            
                                            {activeMenu === obj.id && (
                                                <>
                                                    <div className="objective-card__menu-backdrop" onClick={() => setActiveMenu(null)} />
                                                    <div className="objective-card__dropdown">
                                                        <button onClick={() => handleEdit(obj)} className="objective-card__dropdown-item">
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(obj.id)} className="objective-card__dropdown-item objective-card__dropdown-item--danger">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <h3 className="objective-card__title">{obj.title}</h3>
                                    <p className="objective-card__description">{obj.description}</p>

                                    {/* Progress */}
                                    <div className="objective-card__progress">
                                        <div className="objective-card__progress-header">
                                            <span>Progress</span>
                                            <span className="objective-card__progress-value">{obj.progress_percentage || 0}%</span>
                                        </div>
                                        <div className="objective-card__progress-bar">
                                            <div 
                                                className="objective-card__progress-fill"
                                                style={{ width: `${obj.progress_percentage || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="objective-card__footer">
                                        <div className="objective-card__date">
                                            <Calendar size={12} />
                                            <span>Due {obj.target_date ? new Date(obj.target_date).toLocaleDateString() : 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* KANBAN BOARD VIEW */}
                    {viewMode === 'board' && (
                        <div className="objectives-board">
                            {statusColumns.map(status => (
                                <div 
                                    key={status} 
                                    className="objectives-board__column"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, status)}
                                >
                                    {/* Column Header */}
                                    <div className="objectives-board__column-header">
                                        <span className="objectives-board__column-title">
                                            {getStatusLabel(status)}
                                        </span>
                                        <span className="objectives-board__column-count">
                                            {filteredObjectives.filter(o => o.status === status).length}
                                        </span>
                                    </div>

                                    {/* Column Content */}
                                    <div className="objectives-board__column-content">
                                        {filteredObjectives
                                            .filter(o => o.status === status)
                                            .map(obj => (
                                                <div 
                                                    key={obj.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, obj)}
                                                    className="objectives-board__card"
                                                >
                                                    <div className="objectives-board__card-header">
                                                        <h4 className="objectives-board__card-title">{obj.title}</h4>
                                                        <button 
                                                            onClick={() => handleEdit(obj)}
                                                            className="objectives-board__card-edit"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="objectives-board__card-footer">
                                                        <span className="objectives-board__card-date">
                                                            {obj.target_date ? new Date(obj.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        {filteredObjectives.filter(o => o.status === status).length === 0 && (
                                            <div className="objectives-board__empty-drop">
                                                Drop items here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-backdrop" onClick={() => setShowModal(false)} />
                    <div className="modal objectives-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingObjective ? <Edit2 size={18} /> : <Plus size={18} />}
                                {editingObjective ? 'Edit Objective' : 'New Objective'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="form-input"
                                    placeholder="e.g., Q1 Revenue Growth"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="form-textarea"
                                    placeholder="Describe the objective goals..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.target_date}
                                        onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="form-select"
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {formData.status === 'in_progress' && (
                                <div className="form-group">
                                    <div className="form-label-row">
                                        <label className="form-label">Progress</label>
                                        <span className="form-label-value">{formData.progress_percentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.progress_percentage}
                                        onChange={(e) => setFormData({...formData, progress_percentage: parseInt(e.target.value)})}
                                        className="form-range"
                                    />
                                </div>
                            )}

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingObjective ? 'Save Changes' : 'Create Objective'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
