'use client';

import './Period.css';
import { useState, useEffect } from 'react';
import { 
    Search, Plus, Calendar, Edit2, Trash2, 
    Play, StopCircle, CheckCircle, Clock, XCircle,
    TrendingUp, AlertCircle, Copy, CalendarDays, ListFilter, RotateCcw, Eye
} from 'lucide-react';

import { 
    getReviewPeriods, 
    createReviewPeriod, 
    updateReviewPeriod, 
    deleteReviewPeriod, 
    activateReviewPeriod, 
    closeReviewPeriod,
    reopenReviewPeriod 
} from '../services/performanceService';

import ProgressPanel from './ProgressPanel/ProgressPanel';

// --- COMPONENT ---

export default function ReviewPeriods() {
    const [periods, setPeriods] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // table, timeline
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showProgressPanel, setShowProgressPanel] = useState(false);
    const [progressPeriod, setProgressPeriod] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        review_type: 'quarterly',
        start_date: '',
        end_date: '',
        submission_deadline: '',
        description: '',
        enable_self_assessment: true,
        enable_manager_review: true,
        enable_peer_review: false,
        auto_reminders: true,
        reminder_days: 3
    });

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        setLoading(true);
        try {
            const data = await getReviewPeriods();
            setPeriods(data || []);
        } catch (error) {
            console.error('Failed to load periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPeriod) {
                await updateReviewPeriod(editingPeriod.id, formData);
            } else {
                await createReviewPeriod(formData);
            }
            setShowModal(false);
            resetForm();
            loadPeriods();
        } catch (error) {
            console.error('Failed to save period:', error);
            alert('Failed to save period. Please try again.');
        }
    };

    const handleEdit = (period) => {
        setEditingPeriod(period);
        setFormData({
            name: period.name,
            review_type: period.review_type,
            start_date: period.start_date,
            end_date: period.end_date,
            submission_deadline: period.submission_deadline,
            description: period.description || '',
            enable_self_assessment: period.enable_self_assessment ?? true,
            enable_manager_review: period.enable_manager_review ?? true,
            enable_peer_review: period.enable_peer_review ?? false,
            auto_reminders: period.auto_reminders ?? true,
            reminder_days: period.reminder_days || 3
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this period?')) {
            try {
                await deleteReviewPeriod(id);
                loadPeriods();
            } catch (error) {
                console.error('Failed to delete period:', error);
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await activateReviewPeriod(id);
            loadPeriods();
        } catch (error) {
            console.error('Failed to activate period:', error);
        }
    };

    const handleClose = async (id) => {
        if (confirm('Are you sure you want to close this period?')) {
            try {
                await closeReviewPeriod(id);
                loadPeriods();
            } catch (error) {
                console.error('Failed to close period:', error);
            }
        }
    };

    const handleReopen = async (id) => {
        if (confirm('Are you sure you want to reopen this period?')) {
            try {
                await reopenReviewPeriod(id);
                loadPeriods();
            } catch (error) {
                console.error('Failed to reopen period:', error);
                alert(error.message || 'Failed to reopen period');
            }
        }
    };

    const handleDuplicate = (period) => {
        setEditingPeriod(null);
        setFormData({
            name: `${period.name} (Copy)`,
            review_type: period.review_type,
            start_date: '',
            end_date: '',
            submission_deadline: '',
            description: period.description || '',
            enable_self_assessment: period.enable_self_assessment ?? true,
            enable_manager_review: period.enable_manager_review ?? true,
            enable_peer_review: period.enable_peer_review ?? false,
            auto_reminders: period.auto_reminders ?? true,
            reminder_days: period.reminder_days || 3
        });
        setShowModal(true);
    };

    const handleBulkDelete = async () => {
        if (confirm(`Delete ${selectedPeriods.length} selected period(s)?`)) {
            try {
                await Promise.all(selectedPeriods.map(id => deleteReviewPeriod(id)));
                setSelectedPeriods([]);
                loadPeriods();
            } catch (error) {
                console.error('Failed to delete periods:', error);
            }
        }
    };

    const handleBulkActivate = async () => {
        try {
            await Promise.all(selectedPeriods.map(id => activateReviewPeriod(id)));
            setSelectedPeriods([]);
            loadPeriods();
        } catch (error) {
            console.error('Failed to activate periods:', error);
        }
    };

    const toggleSelectPeriod = (id) => {
        setSelectedPeriods(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPeriods.length === filteredPeriods.length) {
            setSelectedPeriods([]);
        } else {
            setSelectedPeriods(filteredPeriods.map(p => p.id));
        }
    };

    const resetForm = () => {
        setEditingPeriod(null);
        setFormData({
            name: '',
            review_type: 'quarterly',
            start_date: '',
            end_date: '',
            submission_deadline: '',
            description: '',
            enable_self_assessment: true,
            enable_manager_review: true,
            enable_peer_review: false,
            auto_reminders: true,
            reminder_days: 3
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { class: 'badge-secondary', icon: Clock, label: 'Draft' },
            active: { class: 'badge-success', icon: Play, label: 'Active' },
            completed: { class: 'badge-info', icon: CheckCircle, label: 'Completed' },
            cancelled: { class: 'badge-danger', icon: XCircle, label: 'Cancelled' }
        };
        return badges[status] || badges.draft;
    };

    const getTypeLabel = (type) => {
        const types = {
            annual: 'Annual Review',
            quarterly: 'Quarterly Review',
            half_yearly: 'Half Yearly',
            probation: 'Probation'
        };
        return types[type] || type;
    };

    const calculateProgress = (period) => {
        const total = period.total_reviews || 0;
        const completed = period.completed_reviews || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return 0;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Calculate dashboard statistics
    const stats = {
        total: periods.length,
        active: periods.filter(p => p.status === 'active').length,
        draft: periods.filter(p => p.status === 'draft').length,
        completed: periods.filter(p => p.status === 'completed').length,
        avgCompletion: periods.length > 0 
            ? Math.round(periods.reduce((acc, p) => acc + calculateProgress(p), 0) / periods.length)
            : 0
    };

    const filteredPeriods = periods.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesType = filterType === 'all' || p.review_type === filterType;
        return matchesSearch && matchesStatus && matchesType;
    });

    const renderDashboard = () => (
        <div className="period-dashboard">
            <div className="dashboard-card">
                <div className="dashboard-card__icon">
                    <Calendar size={24} />
                </div>
                <div className="dashboard-card__content">
                    <div className="dashboard-card__value">{stats.total}</div>
                    <div className="dashboard-card__label">Total Periods</div>
                </div>
            </div>
            <div className="dashboard-card">
                <div className="dashboard-card__icon dashboard-card__icon--success">
                    <Play size={24} />
                </div>
                <div className="dashboard-card__content">
                    <div className="dashboard-card__value">{stats.active}</div>
                    <div className="dashboard-card__label">Active Periods</div>
                </div>
            </div>
            <div className="dashboard-card">
                <div className="dashboard-card__icon dashboard-card__icon--warning">
                    <Clock size={24} />
                </div>
                <div className="dashboard-card__content">
                    <div className="dashboard-card__value">{stats.draft}</div>
                    <div className="dashboard-card__label">Draft Periods</div>
                </div>
            </div>
            <div className="dashboard-card">
                <div className="dashboard-card__icon dashboard-card__icon--info">
                    <TrendingUp size={24} />
                </div>
                <div className="dashboard-card__content">
                    <div className="dashboard-card__value">{stats.avgCompletion}%</div>
                    <div className="dashboard-card__label">Avg Completion</div>
                </div>
            </div>
        </div>
    );

    const renderTimelineView = () => (
        <div className="period-timeline">
            {filteredPeriods.map(period => {
                const progress = calculateProgress(period);
                const daysLeft = getDaysRemaining(period.submission_deadline);
                const badge = getStatusBadge(period.status);
                
                return (
                    <div key={period.id} className="timeline-card">
                        <div className="timeline-card__header">
                            <div>
                                <h3 className="timeline-card__title">{period.name}</h3>
                                <span className="timeline-card__type">{getTypeLabel(period.review_type)}</span>
                            </div>
                            <span className={`badge ${badge.class}`}>
                                <badge.icon size={12} />
                                {badge.label}
                            </span>
                        </div>
                        
                        <div className="timeline-card__dates">
                            <div className="timeline-date">
                                <CalendarDays size={14} />
                                <span>{period.start_date || 'N/A'} - {period.end_date || 'N/A'}</span>
                            </div>
                            {period.submission_deadline && (
                                <div className={`timeline-date ${daysLeft <= 7 && period.status === 'active' ? 'timeline-date--urgent' : ''}`}>
                                    <AlertCircle size={14} />
                                    <span>Deadline: {period.submission_deadline}</span>
                                    {daysLeft >= 0 && daysLeft <= 7 && period.status === 'active' && (
                                        <span className="timeline-date__warning">({daysLeft} days left)</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {period.status === 'active' && (
                            <div className="timeline-card__progress">
                                <div className="progress-header">
                                    <span>Review Progress</span>
                                    <span className="progress-percentage">{progress}%</span>
                                </div>
                                <div className="table-progress-bar">
                                    <div 
                                        className="table-progress-bar__fill" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="progress-stats">
                                    <span>{period.completed_reviews || 0} completed</span>
                                    <span>{period.total_reviews || 0} total</span>
                                </div>
                            </div>
                        )}

                        <div className="timeline-card__actions">
                            <button className="btn-icon btn-icon--primary" onClick={() => { setProgressPeriod(period); setShowProgressPanel(true); }} title="View Progress">
                                <Eye size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleEdit(period)} title="Edit">
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => handleDuplicate(period)} title="Duplicate">
                                <Copy size={16} />
                            </button>
                            {period.status === 'draft' && (
                                <button className="btn-icon btn-icon--success" onClick={() => handleActivate(period.id)} title="Activate">
                                    <Play size={16} />
                                </button>
                            )}
                            {period.status === 'active' && (
                                <button className="btn-icon btn-icon--warning" onClick={() => handleClose(period.id)} title="Close">
                                    <StopCircle size={16} />
                                </button>
                            )}
                            {period.status === 'completed' && (
                                <button className="btn-icon btn-icon--info" onClick={() => handleReopen(period.id)} title="Reopen">
                                    <RotateCcw size={16} />
                                </button>
                            )}
                            <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(period.id)} title="Delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderTableView = () => (
        <div className="period-table-container">
            <table className="period-table">
                <thead>
                    <tr>
                        <th className="checkbox-col">
                            <input 
                                type="checkbox"
                                checked={selectedPeriods.length === filteredPeriods.length && filteredPeriods.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Deadline</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPeriods.map(period => {
                        const badge = getStatusBadge(period.status);
                        const progress = calculateProgress(period);
                        const daysLeft = getDaysRemaining(period.submission_deadline);
                        
                        return (
                            <tr key={period.id} className={selectedPeriods.includes(period.id) ? 'selected' : ''}>
                                <td className="checkbox-col">
                                    <input 
                                        type="checkbox"
                                        checked={selectedPeriods.includes(period.id)}
                                        onChange={() => toggleSelectPeriod(period.id)}
                                    />
                                </td>
                                <td className="period-name">
                                    <div className="period-name-wrapper">
                                        <span>{period.name}</span>
                                        {daysLeft >= 0 && daysLeft <= 7 && period.status === 'active' && (
                                            <span className="period-badge-urgent">
                                                {daysLeft} days left
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>{getTypeLabel(period.review_type)}</td>
                                <td className="mono-text">{period.start_date}</td>
                                <td className="mono-text">{period.end_date}</td>
                                <td className="mono-text">{period.submission_deadline}</td>
                                <td>
                                    {period.status === 'active' || period.status === 'completed' ? (
                                        <div className="table-progress">
                                            <div className="table-progress-bar">
                                                <div 
                                                    className="table-progress-bar__fill"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="table-progress-text">{progress}%</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${badge.class}`}>
                                        <badge.icon size={12} />
                                        {badge.label}
                                    </span>
                                </td>
                                <td>
                                    <div className="period-actions">
                                        <button 
                                            className="btn-icon btn-icon--primary"
                                            onClick={() => { setProgressPeriod(period); setShowProgressPanel(true); }}
                                            title="View Progress"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {period.status === 'draft' && (
                                            <button 
                                                className="btn-icon btn-icon--success"
                                                onClick={() => handleActivate(period.id)}
                                                title="Activate"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}
                                        {period.status === 'active' && (
                                            <button 
                                                className="btn-icon btn-icon--warning"
                                                onClick={() => handleClose(period.id)}
                                                title="Close"
                                            >
                                                <StopCircle size={16} />
                                            </button>
                                        )}
                                        {period.status === 'completed' && (
                                            <button 
                                                className="btn-icon btn-icon--info"
                                                onClick={() => handleReopen(period.id)}
                                                title="Reopen"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        )}
                                        <button 
                                            className="btn-icon"
                                            onClick={() => handleEdit(period)}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon"
                                            onClick={() => handleDuplicate(period)}
                                            title="Duplicate"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon btn-icon--danger"
                                            onClick={() => handleDelete(period.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="period-container">
            {renderDashboard()}

            <div className="period-toolbar">
                <div className="period-search">
                    <Search size={18} className="period-search__icon" />
                    <input
                        type="text"
                        placeholder="Search periods..."
                        className="period-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="period-filters">
                    <select 
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select 
                        className="filter-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="annual">Annual</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half Yearly</option>
                        <option value="probation">Probation</option>
                    </select>
                </div>

                <div className="period-view-toggle">
                    <button 
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table View"
                    >
                        <ListFilter size={18} />
                    </button>
                    <button 
                        className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                        onClick={() => setViewMode('timeline')}
                        title="Timeline View"
                    >
                        <CalendarDays size={18} />
                    </button>
                </div>
            </div>

            <div className="period-actions-bar">
                {selectedPeriods.length > 0 ? (
                    <div className="bulk-actions">
                        <span className="bulk-actions__count">
                            {selectedPeriods.length} selected
                        </span>
                        <button 
                            className="btn btn-sm btn-success"
                            onClick={handleBulkActivate}
                        >
                            <Play size={14} />
                            Activate
                        </button>
                        <button 
                            className="btn btn-sm btn-danger"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                ) : <div></div>}
                
                <button 
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Create Period
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    Loading review periods...
                </div>
            ) : filteredPeriods.length === 0 ? (
                <div className="empty-state">
                    <Calendar size={48} className="empty-state-icon" />
                    <h3>No Review Periods Found</h3>
                    <p>Create your first review period to get started</p>
                    <button 
                        className="btn btn-primary"
                        style={{margin: '0 auto'}}
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <Plus size={18} />
                        Create Period
                    </button>
                </div>
            ) : (
                viewMode === 'table' ? renderTableView() : renderTimelineView()
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPeriod ? 'Edit Period' : 'Add Period'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-section">
                                    <h3 className="form-section-title">Basic Information</h3>
                                    <div className="form-group">
                                        <label>Period Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                            placeholder="e.g., Q1 2024 Performance Review"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Review Type *</label>
                                        <select
                                            value={formData.review_type}
                                            onChange={(e) => setFormData({...formData, review_type: e.target.value})}
                                        >
                                            <option value="annual">Annual Review</option>
                                            <option value="quarterly">Quarterly Review</option>
                                            <option value="half_yearly">Half Yearly Review</option>
                                            <option value="probation">Probation Review</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Timeline</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Date *</label>
                                            <input
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date *</label>
                                            <input
                                                type="date"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Submission Deadline *</label>
                                        <input
                                            type="date"
                                            value={formData.submission_deadline}
                                            onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})}
                                            required
                                        />
                                        <small className="form-hint">Final date for all reviews to be submitted</small>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Review Settings</h3>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_self_assessment}
                                            onChange={(e) => setFormData({...formData, enable_self_assessment: e.target.checked})}
                                        />
                                        <span>Enable Self Assessment</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_manager_review}
                                            onChange={(e) => setFormData({...formData, enable_manager_review: e.target.checked})}
                                        />
                                        <span>Enable Manager Review</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.enable_peer_review}
                                            onChange={(e) => setFormData({...formData, enable_peer_review: e.target.checked})}
                                        />
                                        <span>Enable Peer Review (360°)</span>
                                    </label>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Notifications</h3>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_reminders}
                                            onChange={(e) => setFormData({...formData, auto_reminders: e.target.checked})}
                                        />
                                        <span>Send Automatic Reminders</span>
                                    </label>
                                    {formData.auto_reminders && (
                                        <div className="form-group" style={{ marginTop: '1rem' }}>
                                            <label>Reminder Frequency (days before deadline)</label>
                                            <input
                                                type="number"
                                                value={formData.reminder_days}
                                                onChange={(e) => setFormData({...formData, reminder_days: parseInt(e.target.value)})}
                                                min="1"
                                                max="30"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Description</h3>
                                    <div className="form-group">
                                        <label>Additional Notes</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows={4}
                                            placeholder="Add any additional information or instructions for this review period..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPeriod ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Progress Panel */}
            {showProgressPanel && progressPeriod && (
                <ProgressPanel 
                    period={progressPeriod} 
                    onClose={() => { setShowProgressPanel(false); setProgressPeriod(null); }}
                />
            )}
        </div>
    );
}
