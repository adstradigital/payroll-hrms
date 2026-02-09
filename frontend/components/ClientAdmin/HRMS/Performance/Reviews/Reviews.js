'use client';

import { createPortal } from 'react-dom';
import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { Search, Plus, Star, Calendar, TrendingUp, User, Filter, 
    Download, MoreVertical, ChevronDown, Eye, Edit, Trash2, Clock,
    CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { 
    getPerformanceReviews, 
    getPerformanceReview,
    updatePerformanceReview,
    getReviewPeriods
} from '../services/performanceService';
import { getAllEmployees } from '../../../../../api/api_clientadmin';
import './Reviews.css';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedReviews, setSelectedReviews] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownAnchor, setDropdownAnchor] = useState(null);
    const [editingReview, setEditingReview] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await getPerformanceReviews();
            const data = response?.results || response || [];
            
            const mappedReviews = data.map(r => ({
                id: r.id,
                employee: r.employee?.full_name || r.employee_name || 'Unknown',
                reviewer: r.reviewer?.full_name || r.reviewer_name || 'Not Assigned',
                department: r.department_name || r.employee?.department?.name || 'Unassigned',
                period: r.review_period?.name || r.review_period_name || 'N/A',
                rating: r.overall_rating || r.rating || null,
                status: r.status,
                date: r.created_at?.split('T')[0] || r.date,
                progress: r.goal_completion_score || 0
            }));

            setReviews(mappedReviews);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const completed = reviews.filter(r => r.status === 'completed').length;
        const pending = reviews.filter(r => r.status === 'pending').length;
        const inProgress = reviews.filter(r => r.status === 'in_progress').length;
        const ratedReviews = reviews.filter(r => r.rating);
        const avgRating = ratedReviews.length > 0 
            ? ratedReviews.reduce((acc, r) => acc + r.rating, 0) / ratedReviews.length 
            : 0;

        return { completed, pending, inProgress, avgRating: avgRating.toFixed(1) };
    }, [reviews]);

    const filteredReviews = useMemo(() => {
        let filtered = reviews.filter(review => {
            const matchesSearch = review.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.reviewer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
            const matchesDepartment = filterDepartment === 'all' || review.department === filterDepartment;
            return matchesSearch && matchesStatus && matchesDepartment;
        });

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'rating':
                    comparison = (a.rating || 0) - (b.rating || 0);
                    break;
                case 'employee':
                    comparison = a.employee.localeCompare(b.employee);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [reviews, searchTerm, filterStatus, filterDepartment, sortBy, sortOrder]);

    const departments = [...new Set(reviews.map(r => r.department))];

    const getStatusBadge = (status) => {
        const badges = {
            completed: { class: 'badge-success', icon: CheckCircle, label: 'Completed' },
            in_progress: { class: 'badge-warning', icon: TrendingUp, label: 'In Progress' },
            pending: { class: 'badge-secondary', icon: Clock, label: 'Pending' },
        };
        return badges[status] || badges.pending;
    };

    const toggleReviewSelection = (id) => {
        setSelectedReviews(prev =>
            prev.includes(id) ? prev.filter(reviewId => reviewId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedReviews.length === filteredReviews.length) {
            setSelectedReviews([]);
        } else {
            setSelectedReviews(filteredReviews.map(r => r.id));
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleEditClick = (review) => {
        setEditingReview(review);
        setActiveDropdown(null);
    };

    const closeEditModal = () => {
        setEditingReview(null);
    };

    return (
        <div className="reviews-container">
            <div className="reviews-header">
                <div>
                    <h1 className="reviews-title">Performance Reviews</h1>
                    <p className="reviews-subtitle">Manage and track employee performance reviews</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card stat-card--primary">
                        <div className="stat-card__icon"><Star size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.avgRating}</div>
                            <div className="stat-card__label">Avg Rating</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--success">
                        <div className="stat-card__icon"><TrendingUp size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.completed}</div>
                            <div className="stat-card__label">Completed</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--warning">
                        <div className="stat-card__icon"><Clock size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.inProgress}</div>
                            <div className="stat-card__label">In Progress</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--secondary">
                        <div className="stat-card__icon"><Calendar size={20} /></div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.pending}</div>
                            <div className="stat-card__label">Pending</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="reviews-toolbar">
                <div className="reviews-toolbar__left">
                    <div className="reviews-search">
                        <Search size={18} className="reviews-search__icon" />
                        <input
                            type="text"
                            placeholder="Search by employee..."
                            className="reviews-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className={`btn btn-outline ${showFilters ? 'btn-outline--active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={18} /> Filters
                    </button>
                </div>
                <div className="reviews-toolbar__right">
                    <button className="btn btn-primary" onClick={() => setActiveDropdown('create_modal')}>
                        <Plus size={18} /> New Review
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-group">
                        <label className="filter-label">Status</label>
                        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Department</label>
                        <select className="filter-select" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="date">Date</option>
                            <option value="rating">Rating</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>
                    <button className="btn btn-text" onClick={() => { setFilterStatus('all'); setFilterDepartment('all'); setSortBy('date'); setSortOrder('desc'); }}>Clear All</button>
                </div>
            )}

            {selectedReviews.length > 0 && (
                <div className="selection-bar">
                    <span className="selection-bar__count">{selectedReviews.length} selected</span>
                    <div className="selection-bar__actions">
                        <button className="btn btn-sm btn-outline">Export Selected</button>
                        <button className="btn btn-sm btn-outline btn-outline--danger"><Trash2 size={16} /> Delete</button>
                    </div>
                </div>
            )}

            <div className="reviews-table-container">
                <table className="reviews-table">
                    <thead>
                        <tr>
                            <th className="th-checkbox">
                                <input type="checkbox" checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0} onChange={toggleSelectAll} className="checkbox" />
                            </th>
                            <th onClick={() => handleSort('employee')} className="th-sortable">
                                <div className="th-content">Employee {sortBy === 'employee' && <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}</div>
                            </th>
                            <th>Reviewer</th>
                            <th>Department</th>
                            <th>Period</th>
                            <th onClick={() => handleSort('rating')} className="th-sortable">
                                <div className="th-content">Rating {sortBy === 'rating' && <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}</div>
                            </th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th onClick={() => handleSort('date')} className="th-sortable">
                                <div className="th-content">Due Date {sortBy === 'date' && <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}</div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.map(review => {
                            const statusBadge = getStatusBadge(review.status);
                            return (
                                <tr key={review.id} className={selectedReviews.includes(review.id) ? 'tr-selected' : ''}>
                                    <td>
                                        <input type="checkbox" checked={selectedReviews.includes(review.id)} onChange={() => toggleReviewSelection(review.id)} className="checkbox" />
                                    </td>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">{review.employee.split(' ').map(n => n[0]).join('')}</div>
                                            <div className="employee-info"><div className="employee-name">{review.employee}</div></div>
                                        </div>
                                    </td>
                                    <td className="text-secondary">{review.reviewer}</td>
                                    <td><span className="department-badge">{review.department}</span></td>
                                    <td className="text-secondary">{review.period}</td>
                                    <td>
                                        {review.rating ? (
                                            <div className="rating-cell">
                                                <div className="stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < Math.floor(review.rating) ? 'star--filled' : 'star--empty'} />
                                                    ))}
                                                </div>
                                                <span className="rating-value">{review.rating}</span>
                                            </div>
                                        ) : <span className="text-muted">--</span>}
                                    </td>
                                    <td>
                                        <div className="progress-cell">
                                            <div className="progress-bar">
                                                <div className="progress-bar__fill" style={{ width: `${review.progress}%` }}></div>
                                            </div>
                                            <span className="progress-text">{review.progress}%</span>
                                        </div>
                                    </td>
                                    <td><span className={`badge ${statusBadge.class}`}><statusBadge.icon size={12} /> {statusBadge.label}</span></td>
                                    <td className="text-secondary">{review.date}</td>
                                    <td>
                                        <div className="dropdown">
                                            <button className="btn-icon" onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeDropdown === review.id) { setActiveDropdown(null); setDropdownAnchor(null); }
                                                else { setActiveDropdown(review.id); setDropdownAnchor(e.currentTarget); }
                                            }}>
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredReviews.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon"><Search size={48} /></div>
                    <h3 className="empty-state__title">No reviews found</h3>
                    <p className="empty-state__description">Try adjusting your search or filters</p>
                </div>
            )}

            <CreateReviewModal 
                isOpen={activeDropdown === 'create_modal'} 
                onClose={() => setActiveDropdown(null)}
                onSuccess={() => { setActiveDropdown(null); fetchReviews(); }}
            />

            {activeDropdown && activeDropdown !== 'create_modal' && dropdownAnchor && (
                <DropdownPortal
                    anchor={dropdownAnchor}
                    onClose={() => { setActiveDropdown(null); setDropdownAnchor(null); }}
                >
                    {(() => {
                        const review = reviews.find(r => r.id === activeDropdown);
                        if (!review) return null;
                        return (
                            <>
                                <button className="dropdown-item"><Eye size={16} /> View Details</button>
                                <button className="dropdown-item" onClick={() => handleEditClick(review)}><Edit size={16} /> Edit</button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item dropdown-item--danger"><Trash2 size={16} /> Delete</button>
                            </>
                        );
                    })()}
                </DropdownPortal>
            )}

            {editingReview && (
                <EditReviewModal
                    review={editingReview}
                    isOpen={!!editingReview}
                    onClose={closeEditModal}
                    onSuccess={() => { closeEditModal(); fetchReviews(); }}
                />
            )}
        </div>
    );
}

function EditReviewModal({ review, isOpen, onClose, onSuccess }) {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({ reviewer_id: '', status: '' });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isAutoReviewer, setIsAutoReviewer] = useState(false);
    const [reportingManagerId, setReportingManagerId] = useState(null);

    useEffect(() => {
        if (isOpen && review) {
            loadData();
            setFormData({ reviewer_id: '', status: review.status || 'pending' });
            setIsAutoReviewer(false);
            setReportingManagerId(null);
        }
    }, [isOpen, review]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [empRes, reviewDetail] = await Promise.all([
                getAllEmployees({ page_size: 1000 }),
                getPerformanceReview(review.id)
            ]);
            
            const empList = empRes.data?.results || empRes.data || [];
            setEmployees(empList);
            
            if (reviewDetail) {
                let reviewerId = typeof reviewDetail.reviewer === 'object' ? reviewDetail.reviewer.id : reviewDetail.reviewer;
                
                let managerUserId = null;

                // Find reporting manager's USER ID
                if (reviewDetail.employee) {
                    const subjectUserId = typeof reviewDetail.employee === 'object' ? reviewDetail.employee.id : reviewDetail.employee;
                    // Find employee record by User ID
                    const subjectEmployee = empList.find(e => e.user === subjectUserId); 
                    
                    if (subjectEmployee?.reporting_manager) {
                        // subjectEmployee.reporting_manager is an Employee UUID
                        const managerEmployee = empList.find(e => e.id === subjectEmployee.reporting_manager);
                        if (managerEmployee) {
                            managerUserId = managerEmployee.user; // User ID
                        }
                    }
                }
                setReportingManagerId(managerUserId);

                // Determine effective reviewer and auto-toggle state
                let effectiveReviewerId = reviewerId;
                let auto = false;

                if (managerUserId) {
                    // If no reviewer set, or current reviewer IS the manager -> Auto
                    if (!effectiveReviewerId || effectiveReviewerId === managerUserId) {
                        effectiveReviewerId = managerUserId;
                        auto = true;
                    }
                }

                setFormData({ 
                    reviewer_id: effectiveReviewerId || '', 
                    status: reviewDetail.status 
                });
                setIsAutoReviewer(auto);
            }
        } catch (err) {
            console.error("Failed to load edit data:", err);
            setError("Failed to load review details.");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoToggle = (e) => {
        const checked = e.target.checked;
        setIsAutoReviewer(checked);
        if (checked && reportingManagerId) {
            setFormData(prev => ({ ...prev, reviewer_id: reportingManagerId }));
        } else if (!checked) {
             // When switching to manual, keep current ID but allow edit
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await updatePerformanceReview(review.id, {
                reviewer_id: formData.reviewer_id || null, 
                status: formData.status
            });
            onSuccess();
        } catch (err) {
            console.error("Update failed:", err);
            setError("Failed to update review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Review</h2>
                    <button className="modal-close" onClick={onClose}><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        {loading ? <div className="loading-spinner">Loading...</div> : (
                            <>
                                <div className="form-group">
                                    <label>Employee</label>
                                    <input type="text" value={review.employee} disabled className="form-input disabled" />
                                </div>
                                <div className="form-group">
                                    <label>Period</label>
                                    <input type="text" value={review.period} disabled className="form-input disabled" />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ margin: 0 }}>Reviewer</label>
                                        {reportingManagerId && (
                                            <div className="form-check" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <input 
                                                    type="checkbox" 
                                                    id="manualOverride" 
                                                    checked={!isAutoReviewer} 
                                                    onChange={(e) => {
                                                        const isManual = e.target.checked;
                                                        setIsAutoReviewer(!isManual);
                                                        if (!isManual && reportingManagerId) {
                                                            setFormData(prev => ({ ...prev, reviewer_id: reportingManagerId }));
                                                        } else if (isManual) {
                                                            setFormData(prev => ({ ...prev, reviewer_id: '' }));
                                                        }
                                                    }}
                                                    style={{ width: 'auto', margin: 0 }}
                                                />
                                                <label htmlFor="manualOverride" style={{ margin: 0, cursor: 'pointer' }}>
                                                    Manual override
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isAutoReviewer && reportingManagerId ? (
                                        <div style={{ 
                                            padding: '0.75rem', 
                                            background: 'rgba(255, 255, 255, 0.05)', 
                                            borderRadius: '6px', 
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--rv-text-primary)'
                                        }}>
                                            <CheckCircle size={16} color="var(--rv-color-success)" />
                                            <span>
                                                Reviewer: <strong>{employees.find(e => e.user === reportingManagerId)?.first_name} {employees.find(e => e.user === reportingManagerId)?.last_name}</strong> <span style={{opacity: 0.7, fontSize: '0.9em'}}>(Auto from reporting manager)</span>
                                            </span>
                                        </div>
                                    ) : (
                                        <select 
                                            value={formData.reviewer_id} 
                                            onChange={e => setFormData({...formData, reviewer_id: e.target.value})}
                                            className="form-select"
                                        >
                                            <option value="">-- No Reviewer --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.user}>
                                                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="form-select">
                                        <option value="pending">Pending</option>
                                        <option value="self_submitted">Self Assessment Submitted</option>
                                        <option value="under_review">Under Manager Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || loading}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreateReviewModal({ isOpen, onClose, onSuccess }) {
    const [periods, setPeriods] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        review_period: '',
        employee_ids: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            setFormData({ review_period: '', employee_ids: [] });
            setError(null);
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        try {
            const { getReviewPeriods } = require('../services/performanceService');
            const { getAllEmployees } = require('../../../../../api/api_clientadmin');
            
            const [periodsRes, employeesRes] = await Promise.all([
                getReviewPeriods(),
                getAllEmployees({ page_size: 1000 }) 
            ]);

            const periodList = periodsRes?.results || periodsRes || [];
            const activePeriods = periodList.filter(p => p.is_active);
            setPeriods(activePeriods);
            
            if (activePeriods.length > 0) {
                setFormData(prev => ({ ...prev, review_period: activePeriods[0].id }));
            }

            const empList = employeesRes.data?.results || employeesRes.data || [];
            setEmployees(empList);

        } catch (err) {
            console.error('Failed to load form data:', err);
            setError('Failed to load necessary data (periods/employees).');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.review_period || formData.employee_ids.length === 0) {
            setError('Please select a review period and at least one employee.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { bulkCreateReviews } = require('../services/performanceService');
            await bulkCreateReviews(formData.review_period, formData.employee_ids);
            onSuccess();
        } catch (err) {
            console.error('Create failed:', err);
            setError(err.message || 'Failed to create reviews. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleEmployee = (empId) => {
        setFormData(prev => {
            const current = prev.employee_ids;
            if (current.includes(empId)) {
                return { ...prev, employee_ids: current.filter(id => id !== empId) };
            } else {
                return { ...prev, employee_ids: [...current, empId] };
            }
        });
    };

    const toggleAllEmployees = () => {
        if (formData.employee_ids.length === employees.length) {
            setFormData(prev => ({ ...prev, employee_ids: [] }));
        } else {
            setFormData(prev => ({ ...prev, employee_ids: employees.map(e => e.id) }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Start New Review</h2>
                    <button className="modal-close" onClick={onClose}><XCircle size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                color: 'var(--rv-color-danger)', 
                                padding: '0.75rem', 
                                borderRadius: '0.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Review Period</label>
                            <select 
                                className="form-select"
                                value={formData.review_period}
                                onChange={e => setFormData({...formData, review_period: e.target.value})}
                                required
                            >
                                <option value="" disabled>Select a period</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {periods.length === 0 && (
                                <small style={{ color: 'var(--rv-color-warning)', marginTop: '0.5rem', display: 'block' }}>
                                    No active review periods found. Please activate one first.
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="form-label">Select Employees</label>
                                <button type="button" className="btn-text" style={{ fontSize: '0.75rem', padding: 0 }} onClick={toggleAllEmployees}>
                                    {formData.employee_ids.length === employees.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="multi-select-container">
                                {employees.length === 0 ? (
                                    <p style={{ padding: '0.5rem', color: 'var(--rv-color-mist)', textAlign: 'center' }}>Loading employees...</p>
                                ) : (
                                    employees.map(emp => (
                                        <label key={emp.id} className="multi-select-option">
                                            <input type="checkbox" checked={formData.employee_ids.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} />
                                            <span style={{ color: 'white' }}>
                                                {emp.full_name || 'Unknown'} 
                                                <span style={{ color: 'var(--rv-color-mist)', marginLeft: '0.5rem' }}>({emp.employee_id})</span>
                                            </span>
                                            <span style={{ color: 'var(--rv-color-mist)', fontSize: '0.75rem', marginLeft: 'auto' }}>{emp.department?.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <small style={{ color: 'var(--rv-color-mist)', marginTop: '0.5rem', display: 'block' }}>
                                Selected: {formData.employee_ids.length} employees
                            </small>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Reviews'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DropdownPortal({ anchor, onClose, children }) {
    const [style, setStyle] = useState({});
    const menuRef = useRef(null);

    useLayoutEffect(() => {
        if (anchor) {
            const updatePosition = () => {
                const rect = anchor.getBoundingClientRect();
                const menuWidth = 160; 
                setStyle({
                    position: 'fixed',
                    top: `${rect.bottom + 5}px`,
                    left: `${rect.right - menuWidth}px`,
                    right: 'auto',
                    zIndex: 1000,
                    margin: 0
                });
            };
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [anchor]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && !anchor.contains(event.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [anchor, onClose]);

    return createPortal(
        <div ref={menuRef} className="dropdown-menu" style={style} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>,
        document.body
    );
}
