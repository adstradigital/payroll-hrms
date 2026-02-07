'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Target, Edit2, Trash2, CheckCircle, Clock, 
    Calendar, TrendingUp, X, ChevronDown, MoreVertical, 
    LayoutTemplate, Grid, Printer, Users, GripVertical, Check, 
    ChevronLeft, ChevronRight, RotateCcw, Zap, Star, 
    MessageSquare, Paperclip, Eye, Filter, SortAsc,
    Activity, Award, Sparkles, Timer, Flag, AlertCircle,
    GitBranch, Hash, Maximize2, Minimize2, Copy, Share2,
    BarChart3, PieChart, TrendingDown, DollarSign, Layers
} from 'lucide-react';
import { getGoals, createGoal, updateGoal, deleteGoal, getReviewPeriods, claimGoal } from '../services/performanceService';
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
    const [viewMode, setViewMode] = useState('board');
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [showFilters, setShowFilters] = useState(false);
    
    // Drag state for smooth sizing
    const [dragWidth, setDragWidth] = useState(0);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    // Ref for direct DOM manipulation during drag
    const dragPreviewRef = useRef(null);

    // Dynamic Pipeline State
    const [columns, setColumns] = useState([
        { id: 'not_started', title: 'Not Started', color: '#64748b', icon: 'Clock' },
        { id: 'in_progress', title: 'In Progress', color: '#D4AF37', icon: 'Activity' },
        { id: 'completed', title: 'Completed', color: '#10b981', icon: 'CheckCircle' },
        { id: 'cancelled', title: 'Cancelled', color: '#ef4444', icon: 'X' }
    ]);
    const [editingColumnId, setEditingColumnId] = useState(null);
    const [tempColumnTitle, setTempColumnTitle] = useState('');
    
    // Quick Create State
    const [quickCreateColumn, setQuickCreateColumn] = useState(null);
    const [quickTitle, setQuickTitle] = useState('');
    
    const emptyImage = typeof Image !== 'undefined' ? new Image() : null;
    if (emptyImage) emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_date: '',
        status: 'not_started',
        progress_percentage: 0,
        review_period: '',
        priority: 'medium',
        tags: [],
        estimated_hours: 0
    });

    // Analytics State
    const [analytics, setAnalytics] = useState({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        avgCompletionTime: 0,
        productivityScore: 0
    });

    // Load periods on mount
    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadObjectives();
        }
    }, [selectedPeriod]);

    useEffect(() => {
        calculateAnalytics();
    }, [objectives]);

    const calculateAnalytics = () => {
        const total = objectives.length;
        const completed = objectives.filter(o => o.status === 'completed').length;
        const inProgress = objectives.filter(o => o.status === 'in_progress').length;
        const overdue = objectives.filter(o => {
            if (!o.target_date) return false;
            return new Date(o.target_date) < new Date() && o.status !== 'completed';
        }).length;
        
        const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

        setAnalytics({
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            overdueTasks: overdue,
            avgCompletionTime: 0,
            productivityScore
        });
    };

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

    const loadObjectives = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getGoals({ review_period: selectedPeriod });
            setObjectives(data?.results || data || []);
        } catch (error) {
            console.error('Failed to load objectives:', error);
            if (showLoading) setObjectives([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleClaim = async (id) => {
        try {
            await claimGoal(id);
            loadObjectives(); 
        } catch (error) {
            console.error('Failed to claim goal:', error);
            alert('Failed to claim goal');
        }
    };

    const handleEdit = (objective) => {
        setEditingObjective(objective);
        setFormData({ 
            ...objective,
            priority: objective.priority || 'medium',
            tags: objective.tags || [],
            estimated_hours: objective.estimated_hours || 0
        });
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
        
        if (!formData.title.trim()) {
            alert('Title is required');
            return;
        }
        if (!formData.target_date) {
            alert('Due Date is required');
            return;
        }

        try {
            const payload = { 
                ...formData, 
                review_period: selectedPeriod,
                progress_percentage: formData.status === 'completed' ? 100 : formData.progress_percentage
            };
            
            if (formData.assignToMe === false) {
                payload.employee_id = null;
            } else {
                delete payload.employee;
                if (payload.assignToMe !== undefined) delete payload.assignToMe;
            }

            if (editingObjective) {
                if (formData.assignToMe === false) {
                   payload.employee_id = null;
                }
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

    // --- DRAG AND DROP LOGIC START ---

    const handleTaskDragStart = (e, objective) => {
        setDraggedItem(objective);
        const rect = e.currentTarget.getBoundingClientRect();
        
        setDragWidth(rect.width);
        
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        setDragOffset({ x: offsetX, y: offsetY });
        
        e.dataTransfer.effectAllowed = 'move';
        if (e.dataTransfer.setDragImage && emptyImage) {
            e.dataTransfer.setDragImage(emptyImage, 0, 0);
        }
        e.stopPropagation();
    };

    const handleTaskDrag = (e) => {
        if (e.clientX === 0 && e.clientY === 0) return;
        
        if (dragPreviewRef.current) {
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            dragPreviewRef.current.style.left = `${x}px`;
            dragPreviewRef.current.style.top = `${y}px`;
        }
    };

    const handleTaskDragEnd = () => {
        setDraggedItem(null);
    };

    const handleColumnDragStart = (e, index) => {
        setDraggedColumn(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleBoardDrop = async (e, targetColumnId, targetColumnIndex) => {
        e.preventDefault();

        if (draggedColumn !== null && typeof draggedColumn === 'number') {
            if (draggedColumn !== targetColumnIndex) {
                const newColumns = [...columns];
                const [movedColumn] = newColumns.splice(draggedColumn, 1);
                newColumns.splice(targetColumnIndex, 0, movedColumn);
                setColumns(newColumns);
            }
            setDraggedColumn(null);
            return;
        }

        if (draggedItem !== null) {
            if (draggedItem.status !== targetColumnId) {
                const newProgress = targetColumnId === 'completed' ? 100 : (targetColumnId === 'not_started' ? 0 : draggedItem.progress_percentage);
                
                // Optimistic update
                setObjectives(prev => prev.map(o => o.id === draggedItem.id ? {
                    ...o,
                    status: targetColumnId,
                    progress_percentage: newProgress
                } : o));

                try {
                    // Send only the fields needed for the update
                    await updateGoal(draggedItem.id, {
                        title: draggedItem.title,
                        description: draggedItem.description || 'No description',
                        target_date: draggedItem.target_date,
                        status: targetColumnId,
                        progress_percentage: newProgress
                    });
                    loadObjectives(false);
                } catch (error) {
                    console.error('Failed to update status:', error);
                    loadObjectives(false);
                }
            }
            setDraggedItem(null);
        }
    };

    // --- DRAG AND DROP LOGIC END ---

    const DEFAULT_COLUMNS = [
        { id: 'not_started', title: 'Not Started', color: '#64748b', icon: 'Clock' },
        { id: 'in_progress', title: 'In Progress', color: '#D4AF37', icon: 'Activity' },
        { id: 'completed', title: 'Completed', color: '#10b981', icon: 'CheckCircle' },
        { id: 'cancelled', title: 'Cancelled', color: '#ef4444', icon: 'X' }
    ];

    const handleAddColumn = () => {
        const newId = `stage_${Math.random().toString(36).substr(2, 6)}`;
        setColumns([...columns, { id: newId, title: 'New Phase', color: '#D4AF37', icon: 'Layers' }]);
        setEditingColumnId(newId);
        setTempColumnTitle('New Phase');
    };

    const handleResetColumns = () => {
        if (window.confirm('Reset columns to default? Custom columns will be removed.')) {
            setColumns(DEFAULT_COLUMNS);
        }
    };

    const handleStartEditColumn = (col) => {
        setEditingColumnId(col.id);
        setTempColumnTitle(col.title);
    };

    const handleSaveColumn = (id) => {
        if (!tempColumnTitle.trim()) return;
        setColumns(prev => prev.map(col => col.id === id ? { ...col, title: tempColumnTitle } : col));
        setEditingColumnId(null);
    };

    const handleDeleteColumn = (id) => {
        const hasItems = objectives.some(o => o.status === id);
        if (hasItems) {
            alert("Cannot delete a pipeline stage that contains objectives. Please move or delete the objectives first.");
            return;
        }
        if (window.confirm("Remove this stage from your pipeline?")) {
            setColumns(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleProgressChange = (e, objective) => {
        e.stopPropagation();
        const newProgress = parseInt(e.target.value);
        setObjectives(prev => prev.map(o => o.id === objective.id ? { ...o, progress_percentage: newProgress } : o));
    };

    const handleProgressCommit = async (e, objective) => {
        e.stopPropagation();
        const newProgress = parseInt(e.target.value);
        let newStatus = objective.status;

        if (newProgress === 100) newStatus = 'completed';
        else if (newProgress === 0) newStatus = 'not_started';
        else newStatus = 'in_progress';

        try {
            // Send only the fields needed for the update
            await updateGoal(objective.id, { 
                title: objective.title,
                description: objective.description || 'No description',
                target_date: objective.target_date,
                progress_percentage: newProgress,
                status: newStatus
            });
            loadObjectives();
        } catch (error) {
            console.error('Failed to update progress:', error);
            loadObjectives();
        }
    };

    const resetForm = () => {
        setEditingObjective(null);
        setFormData({
            title: '',
            description: '',
            target_date: '',
            status: 'not_started',
            progress_percentage: 0,
            review_period: '',
            priority: 'medium',
            tags: [],
            estimated_hours: 0
        });
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleQuickCreate = async (columnId) => {
        if (!quickTitle.trim()) return;
        
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);

        try {
            await createGoal({
                title: quickTitle,
                description: '',
                status: columnId,
                review_period: selectedPeriod,
                progress_percentage: columnId === 'completed' ? 100 : 0,
                target_date: defaultDate.toISOString().split('T')[0],
                priority: 'medium'
            });
            setQuickCreateColumn(null);
            setQuickTitle('');
            loadObjectives();
        } catch (error) {
            console.error('Quick create failed:', error);
            alert('Failed to create task');
        }
    };

    const filteredObjectives = objectives.filter(o => {
        const matchesSearch = o.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = selectedPriority === 'all' || o.priority === selectedPriority;
        return matchesSearch && matchesPriority;
    });

    const getStatusClass = (status) => {
        switch(status) {
            case 'completed': return 'status-badge--success';
            case 'in_progress': return 'status-badge--warning';
            case 'cancelled': return 'status-badge--danger';
            default: return 'status-badge--secondary';
        }
    };

    const getStatusLabel = (status) => {
        const col = columns.find(c => c.id === status);
        if (col) return col.title;
        return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'completed': return <CheckCircle size={12} />;
            case 'in_progress': return <Activity size={12} />;
            default: return <Clock size={12} />;
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#D4AF37';
            case 'low': return '#64748b';
            default: return '#94a3b8';
        }
    };

    const getPriorityIcon = (priority) => {
        switch(priority) {
            case 'critical': return <Zap size={12} />;
            case 'high': return <Flag size={12} />;
            case 'medium': return <AlertCircle size={12} />;
            case 'low': return <ChevronDown size={12} />;
            default: return null;
        }
    };

    return (
        <div className={`objectives-enhanced ${focusMode ? 'focus-mode' : ''}`}>
            {/* Drag Preview */}
            <div 
                ref={dragPreviewRef}
                className="drag-preview"
                style={{ 
                    display: draggedItem && !draggedColumn ? 'block' : 'none',
                    width: dragWidth > 0 ? `${dragWidth}px` : '308px'
                }}
            >
                {draggedItem && (
                    <div className="kanban-card">
                        <div className="kanban-card__header">
                            {draggedItem.priority && draggedItem.priority !== 'medium' && (
                                <div 
                                    className="priority-indicator"
                                    style={{ background: getPriorityColor(draggedItem.priority) }}
                                    title={draggedItem.priority}
                                />
                            )}
                            <h4>{draggedItem.title}</h4>
                        </div>

                        {draggedItem.description && (
                            <p className="kanban-card__description">{draggedItem.description}</p>
                        )}

                        <div className="kanban-card__progress">
                            <div className="progress-label">
                                <span>Progress</span>
                                <span>{draggedItem.progress_percentage || 0}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={draggedItem.progress_percentage || 0}
                                disabled
                                className="progress-slider"
                                style={{ pointerEvents: 'none' }}
                            />
                        </div>

                        <div className="kanban-card__footer">
                            <span className="card-date">
                                {draggedItem.target_date ? new Date(draggedItem.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                            </span>
                            
                            {!draggedItem.employee && (
                                <div className="btn-claim-small">
                                    <Zap size={10} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Animated Background */}
            <div className="objectives-bg">
                <div className="objectives-bg__gradient objectives-bg__gradient--1"></div>
                <div className="objectives-bg__gradient objectives-bg__gradient--2"></div>
                <div className="objectives-bg__gradient objectives-bg__gradient--3"></div>
                <div className="objectives-bg__grid"></div>
            </div>

            {/* Command Bar */}
            <div className="command-bar">
                <div className="command-bar__brand">
                    <div className="command-bar__logo">
                        <Target size={24} />
                    </div>
                    <div className="command-bar__title">
                        <h1>Momentum</h1>
                        <p>Strategic Execution Platform</p>
                    </div>
                </div>
                
                <div className="command-bar__actions">
                    <button 
                        onClick={() => setShowInsights(!showInsights)} 
                        className={`command-btn ${showInsights ? 'command-btn--active' : ''}`}
                    >
                        <BarChart3 size={18} />
                        <span>Insights</span>
                    </button>
                    
                    <button 
                        onClick={() => setFocusMode(!focusMode)} 
                        className="command-btn focus-toggle-btn"
                    >
                        {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        <span>{focusMode ? 'Exit' : 'Focus'}</span>
                    </button>
                    
                    <div className="command-divider"></div>
                    
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="command-btn command-btn--primary">
                        <Plus size={20} />
                        <span>New Objective</span>
                    </button>
                </div>
            </div>

            {/* Insights Panel */}
            {showInsights && (
                <div className="insights-panel">
                    <div className="insights-grid">
                        <div className="insight-card">
                            <div className="insight-card__icon" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
                                <Target size={20} />
                            </div>
                            <div className="insight-card__content">
                                <div className="insight-card__label">Total Objectives</div>
                                <div className="insight-card__value">{analytics.totalTasks}</div>
                            </div>
                        </div>

                        <div className="insight-card">
                            <div className="insight-card__icon" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                                <CheckCircle size={20} />
                            </div>
                            <div className="insight-card__content">
                                <div className="insight-card__label">Completed</div>
                                <div className="insight-card__value">{analytics.completedTasks}</div>
                            </div>
                        </div>

                        <div className="insight-card">
                            <div className="insight-card__icon" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
                                <Activity size={20} />
                            </div>
                            <div className="insight-card__content">
                                <div className="insight-card__label">In Progress</div>
                                <div className="insight-card__value">{analytics.inProgressTasks}</div>
                            </div>
                        </div>

                        <div className="insight-card">
                            <div className="insight-card__icon" style={{background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'}}>
                                <Sparkles size={20} />
                            </div>
                            <div className="insight-card__content">
                                <div className="insight-card__label">Productivity Score</div>
                                <div className="insight-card__value">{analytics.productivityScore}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            <div className="control-panel">
                <div className="control-panel__left">
                    <div className="period-selector">
                        <Calendar size={16} />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="period-selector__select"
                        >
                            {periods.map(period => (
                                <option key={period.id} value={period.id}>{period.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} />
                    </div>

                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search objectives..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="control-panel__right">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`control-btn ${showFilters ? 'control-btn--active' : ''}`}
                    >
                        <Filter size={16} />
                    </button>

                    <div className="view-switcher">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-switcher__btn ${viewMode === 'grid' ? 'view-switcher__btn--active' : ''}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`view-switcher__btn ${viewMode === 'board' ? 'view-switcher__btn--active' : ''}`}
                        >
                            <LayoutTemplate size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Dropdown */}
            {showFilters && (
                <div className="filters-dropdown">
                    <div className="filter-group">
                        <label>Priority</label>
                        <div className="filter-pills">
                            {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => setSelectedPriority(priority)}
                                    className={`filter-pill ${selectedPriority === priority ? 'filter-pill--active' : ''}`}
                                >
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <div className="filter-pills">
                            {[
                                { value: 'date', label: 'Due Date' },
                                { value: 'priority', label: 'Priority' },
                                { value: 'progress', label: 'Progress' }
                            ].map(sort => (
                                <button
                                    key={sort.value}
                                    onClick={() => setSortBy(sort.value)}
                                    className={`filter-pill ${sortBy === sort.value ? 'filter-pill--active' : ''}`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner">
                        <Target size={48} />
                    </div>
                    <p>Loading objectives...</p>
                </div>
            ) : filteredObjectives.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <Target size={64} />
                    </div>
                    <h3>No objectives found</h3>
                    <p>Create your first objective to start tracking your goals</p>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
                        <Plus size={16} />
                        Create Objective
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' && (
                        <div className="objectives-grid-enhanced">
                            {filteredObjectives.map((obj, index) => (
                                <div 
                                    key={obj.id} 
                                    className="objective-card-enhanced"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="objective-card-enhanced__header">
                                        <div className="objective-card-enhanced__badges">
                                            <span className={`status-badge ${getStatusClass(obj.status)}`}>
                                                {getStatusIcon(obj.status)}
                                                {getStatusLabel(obj.status)}
                                            </span>
                                            {obj.priority && obj.priority !== 'medium' && (
                                                <span 
                                                    className="priority-badge"
                                                    style={{ 
                                                        background: getPriorityColor(obj.priority) + '20',
                                                        color: getPriorityColor(obj.priority),
                                                        borderColor: getPriorityColor(obj.priority)
                                                    }}
                                                >
                                                    {getPriorityIcon(obj.priority)}
                                                    {obj.priority}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="objective-card-enhanced__menu">
                                            <button 
                                                onClick={() => setActiveMenu(activeMenu === obj.id ? null : obj.id)}
                                                className="menu-trigger"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            
                                            {activeMenu === obj.id && (
                                                <>
                                                    <div className="menu-backdrop" onClick={() => setActiveMenu(null)} />
                                                    <div className="menu-dropdown">
                                                        <button onClick={() => handleEdit(obj)}>
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => navigator.clipboard.writeText(obj.title)}>
                                                            <Copy size={14} /> Copy Title
                                                        </button>
                                                        <button onClick={() => handleDelete(obj.id)} className="menu-item--danger">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="objective-card-enhanced__title" onClick={() => handleEdit(obj)}>
                                        {obj.title}
                                    </h3>
                                    
                                    {obj.description && (
                                        <p className="objective-card-enhanced__description">{obj.description}</p>
                                    )}

                                    <div className="objective-card-enhanced__progress">
                                        <div className="progress-header">
                                            <span>Progress</span>
                                            <span className="progress-value">{obj.progress_percentage || 0}%</span>
                                        </div>
                                        <div className="progress-track">
                                            <div 
                                                className="progress-fill"
                                                style={{ 
                                                    width: `${obj.progress_percentage || 0}%`,
                                                    background: obj.progress_percentage === 100 ? '#10b981' : '#3b82f6'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="objective-card-enhanced__footer">
                                        <div className="footer-meta">
                                            <div className="meta-item">
                                                <Calendar size={12} />
                                                <span>{obj.target_date ? new Date(obj.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Users size={12} />
                                                <span>{obj.employee ? (obj.employee.full_name || obj.employee.username) : 'Unassigned'}</span>
                                            </div>
                                        </div>

                                        {!obj.employee && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClaim(obj.id);
                                                }}
                                                className="btn-claim"
                                            >
                                                <Zap size={12} />
                                                Take
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'board' && (
                        <div className="kanban-board">
                            {columns.map((col, index) => (
                                <div
                                    key={col.id}
                                    draggable
                                    onDragStart={(e) => handleColumnDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleBoardDrop(e, col.id, index)}
                                    className={`kanban-column ${draggedColumn === index ? 'is-dragging' : ''}`}
                                    style={{ '--column-color': col.color }}
                                >
                                    <div className="kanban-column__header">
                                        <div className="column-drag-handle">
                                            <GripVertical size={14} />
                                        </div>

                                        {editingColumnId === col.id ? (
                                            <div className="column-edit">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={tempColumnTitle}
                                                    onChange={(e) => setTempColumnTitle(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveColumn(col.id)}
                                                    onBlur={() => handleSaveColumn(col.id)}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                />
                                                <button onClick={() => handleSaveColumn(col.id)}>
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="column-title-wrapper">
                                                    <span className="column-title">{col.title}</span>
                                                    <span className="column-count">
                                                        {filteredObjectives.filter(o => o.status === col.id).length}
                                                    </span>
                                                </div>
                                                <div className="column-actions">
                                                    <button 
                                                        onClick={() => handleStartEditColumn(col)}
                                                        className="column-action-btn"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteColumn(col.id)}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="column-action-btn column-action-btn--danger"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="kanban-column__content">
                                        {filteredObjectives
                                            .filter(o => o.status === col.id)
                                            .map(obj => (
                                                <div
                                                    key={obj.id}
                                                    draggable
                                                    onClick={(e) => {
                                                        if (!e.defaultPrevented && !e.target.closest('button') && !e.target.closest('input')) {
                                                            handleEdit(obj);
                                                        }
                                                    }}
                                                    onDragStart={(e) => handleTaskDragStart(e, obj)}
                                                    onDrag={(e) => handleTaskDrag(e)}
                                                    onDragEnd={handleTaskDragEnd}
                                                    className={`kanban-card ${draggedItem?.id === obj.id ? 'is-dragging-original' : ''}`}
                                                >
                                                    <div className="kanban-card__header">
                                                        {obj.priority && obj.priority !== 'medium' && (
                                                            <div 
                                                                className="priority-indicator"
                                                                style={{ background: getPriorityColor(obj.priority) }}
                                                                title={obj.priority}
                                                            />
                                                        )}
                                                        <h4>{obj.title}</h4>
                                                    </div>

                                                    {obj.description && (
                                                        <p className="kanban-card__description">{obj.description}</p>
                                                    )}

                                                    <div className="kanban-card__progress">
                                                        <div className="progress-label">
                                                            <span>Progress</span>
                                                            <span>{obj.progress_percentage || 0}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={obj.progress_percentage || 0}
                                                            onChange={(e) => handleProgressChange(e, obj)}
                                                            onMouseUp={(e) => handleProgressCommit(e, obj)}
                                                            onTouchEnd={(e) => handleProgressCommit(e, obj)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                            className="progress-slider"
                                                        />
                                                    </div>

                                                    <div className="kanban-card__footer">
                                                        <span className="card-date">
                                                            {obj.target_date ? new Date(obj.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                                                        </span>
                                                        
                                                        {!obj.employee && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleClaim(obj.id);
                                                                }}
                                                                className="btn-claim-small"
                                                            >
                                                                <Zap size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                        {filteredObjectives.filter(o => o.status === col.id).length === 0 && (
                                            <div className="kanban-empty">
                                                {draggedItem ? 'Drop here' : 'No items'}
                                            </div>
                                        )}
                                        
                                        {quickCreateColumn === col.id ? (
                                            <div className="quick-add-form">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Objective title..."
                                                    value={quickTitle}
                                                    onChange={(e) => setQuickTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleQuickCreate(col.id);
                                                        if (e.key === 'Escape') setQuickCreateColumn(null);
                                                    }}
                                                />
                                                <div className="quick-add-actions">
                                                    <button onClick={() => handleQuickCreate(col.id)} className="btn-add">
                                                        Add
                                                    </button>
                                                    <button onClick={() => setQuickCreateColumn(null)} className="btn-cancel">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setQuickCreateColumn(col.id)} className="quick-add-trigger">
                                                <Plus size={14} />
                                                Add Objective
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="kanban-controls">
                                <button onClick={handleAddColumn} className="kanban-control-btn" title="Add Column">
                                    <Plus size={20} />
                                </button>
                                <button onClick={handleResetColumns} className="kanban-control-btn" title="Reset to Default Columns">
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay-enhanced">
                    <div className="modal-backdrop" onClick={closeModal} />
                    <div className="modal-enhanced">
                        <div className="modal-header-enhanced">
                            <div className="modal-title-section">
                                <div className="modal-icon">
                                    {editingObjective ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <div>
                                    <h2>{editingObjective ? 'Edit Objective' : 'New Objective'}</h2>
                                    {editingObjective && (
                                        <span className="modal-id">ID: {editingObjective.id}</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions-section">
                                {editingObjective && (
                                    <button 
                                        onClick={() => handleDelete(editingObjective.id)}
                                        className="modal-action-btn delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button onClick={closeModal} className="modal-action-btn">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-content-enhanced">
                                <div className="modal-main-section">
                                    <div className="title-section">
                                        <input
                                            type="text"
                                            placeholder="Objective title..."
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="title-input"
                                        />
                                    </div>

                                    <div className="description-section">
                                        <label>
                                            <MessageSquare size={14} />
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Describe the objective, key deliverables, and success criteria..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="description-input"
                                            rows={6}
                                        />
                                    </div>
                                </div>

                                <div className="modal-sidebar-section">
                                    <div className="sidebar-group">
                                        <span className="sidebar-group__label">Status</span>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="sidebar-select"
                                        >
                                            {columns.map(col => (
                                                <option key={col.id} value={col.id}>{col.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sidebar-group">
                                        <span className="sidebar-group__label">Priority</span>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                            className="sidebar-select"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>

                                    <div className="sidebar-details-box">
                                        <div className="details-box__header">
                                            <Calendar size={14} />
                                            Details
                                        </div>
                                        <div className="detail-field">
                                            <label>Due Date</label>
                                            <input
                                                type="date"
                                                value={formData.target_date}
                                                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                                                className="date-input"
                                            />
                                        </div>
                                        
                                        {editingObjective && editingObjective.employee && (
                                            <div className="detail-field">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.assignToMe === false}
                                                        onChange={(e) => setFormData({...formData, assignToMe: !e.target.checked})}
                                                    />
                                                    Unassign from me
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sidebar-progress-box">
                                        <div className="progress-box__header">
                                            <span>Progress</span>
                                            <span className="progress-percentage">{formData.progress_percentage}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.progress_percentage}
                                            onChange={(e) => setFormData({...formData, progress_percentage: parseInt(e.target.value)})}
                                            className="progress-range"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-enhanced">
                                <button type="submit" className="btn-save">
                                    <CheckCircle size={18} />
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
