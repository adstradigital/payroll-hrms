'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
    Search, Plus, Star, Calendar, TrendingUp, User, Filter, 
    Download, MoreVertical, ChevronDown, Eye, Edit, Trash2, Clock,
    CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { getReviews } from '../../../../../api/api_clientadmin';
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

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await getReviews();
            // Handle both paginated and non-paginated responses
            const data = response.data.results || response.data;
            
            // Transform data to match component structure if necessary
            // Assuming backend returns fields like: employee_name, reviewer_name, etc.
            // If backend fields match mock fields, no map is needed. 
            // Here I'll map them for safety based on typical Django DRF snake_case to JS convenience if needed, 
            // but for now I'll assume keys might need adjustment or are direct.
            // Let's assume standard backend response and map it to our UI model.
            
            const mappedReviews = data.map(r => ({
                id: r.id,
                employee: r.employee_name || r.employee?.user?.get_full_name || 'Unknown',
                reviewer: r.manager_name || r.manager?.user?.get_full_name || 'Unknown',
                department: r.employee?.department?.name || 'Unassigned',
                period: r.review_period?.name || 'N/A',
                rating: r.final_rating || null,
                status: r.status,
                date: r.due_date || r.created_at?.split('T')[0],
                progress: r.progress || 0 // Assuming backend calculates this or we derive it
            }));

            setReviews(mappedReviews);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
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

    // Filter and sort reviews
    const filteredReviews = useMemo(() => {
        let filtered = reviews.filter(review => {
            const matchesSearch = review.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                review.reviewer.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
            const matchesDepartment = filterDepartment === 'all' || review.department === filterDepartment;
            return matchesSearch && matchesStatus && matchesDepartment;
        });

        // Sort
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

    return (
        <div className="reviews-container">
            {/* Header with Stats */}
            <div className="reviews-header">
                <div>
                    <h1 className="reviews-title">Performance Reviews</h1>
                    <p className="reviews-subtitle">Manage and track employee performance reviews</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card stat-card--primary">
                        <div className="stat-card__icon">
                            <Star size={20} />
                        </div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.avgRating}</div>
                            <div className="stat-card__label">Avg Rating</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--success">
                        <div className="stat-card__icon">
                            <TrendingUp size={20} />
                        </div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.completed}</div>
                            <div className="stat-card__label">Completed</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--warning">
                        <div className="stat-card__icon">
                            <Clock size={20} />
                        </div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.inProgress}</div>
                            <div className="stat-card__label">In Progress</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card--secondary">
                        <div className="stat-card__icon">
                            <Calendar size={20} />
                        </div>
                        <div className="stat-card__content">
                            <div className="stat-card__value">{stats.pending}</div>
                            <div className="stat-card__label">Pending</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="reviews-toolbar">
                <div className="reviews-toolbar__left">
                    <div className="reviews-search">
                        <Search size={18} className="reviews-search__icon" />
                        <input
                            type="text"
                            placeholder="Search by employee or reviewer..."
                            className="reviews-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className={`btn btn-outline ${showFilters ? 'btn-outline--active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filters
                        {(filterStatus !== 'all' || filterDepartment !== 'all') && (
                            <span className="filter-badge">
                                {(filterStatus !== 'all' ? 1 : 0) + (filterDepartment !== 'all' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>
                <div className="reviews-toolbar__right">
                    <button className="btn btn-outline">
                        <Download size={18} />
                        Export
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setActiveDropdown('create_modal')}
                    >
                        <Plus size={18} />
                        New Review
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-group">
                        <label className="filter-label">Status</label>
                        <select
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Department</label>
                        <select
                            className="filter-select"
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date">Date</option>
                            <option value="rating">Rating</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>
                    <button
                        className="btn btn-text"
                        onClick={() => {
                            setFilterStatus('all');
                            setFilterDepartment('all');
                            setSortBy('date');
                            setSortOrder('desc');
                        }}
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Selection Actions */}
            {selectedReviews.length > 0 && (
                <div className="selection-bar">
                    <span className="selection-bar__count">
                        {selectedReviews.length} selected
                    </span>
                    <div className="selection-bar__actions">
                        <button className="btn btn-sm btn-outline">Export Selected</button>
                        <button className="btn btn-sm btn-outline btn-outline--danger">
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="reviews-table-container">
                <table className="reviews-table">
                    <thead>
                        <tr>
                            <th className="th-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
                                    onChange={toggleSelectAll}
                                    className="checkbox"
                                />
                            </th>
                            <th onClick={() => handleSort('employee')} className="th-sortable">
                                <div className="th-content">
                                    Employee
                                    {sortBy === 'employee' && (
                                        <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                    )}
                                </div>
                            </th>
                            <th>Reviewer</th>
                            <th>Department</th>
                            <th>Period</th>
                            <th onClick={() => handleSort('rating')} className="th-sortable">
                                <div className="th-content">
                                    Rating
                                    {sortBy === 'rating' && (
                                        <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                    )}
                                </div>
                            </th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th onClick={() => handleSort('date')} className="th-sortable">
                                <div className="th-content">
                                    Due Date
                                    {sortBy === 'date' && (
                                        <ChevronDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                    )}
                                </div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.map(review => {
                            const statusBadge = getStatusBadge(review.status);
                            return (
                                <tr
                                    key={review.id}
                                    className={selectedReviews.includes(review.id) ? 'tr-selected' : ''}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedReviews.includes(review.id)}
                                            onChange={() => toggleReviewSelection(review.id)}
                                            className="checkbox"
                                        />
                                    </td>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar">
                                                {review.employee.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="employee-info">
                                                <div className="employee-name">{review.employee}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-secondary">{review.reviewer}</td>
                                    <td>
                                        <span className="department-badge">{review.department}</span>
                                    </td>
                                    <td className="text-secondary">{review.period}</td>
                                    <td>
                                        {review.rating ? (
                                            <div className="rating-cell">
                                                <div className="stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            className={i < Math.floor(review.rating) ? 'star--filled' : 'star--empty'}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="rating-value">{review.rating}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted">--</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="progress-cell">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-bar__fill"
                                                    style={{ width: `${review.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">{review.progress}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusBadge.class}`}>
                                            <statusBadge.icon size={12} />
                                            {statusBadge.label}
                                        </span>
                                    </td>
                                    <td className="text-secondary">{review.date}</td>
                                    <td>
                                        <div className="dropdown">
                                            <button
                                                className="btn-icon"
                                                onClick={() => setActiveDropdown(activeDropdown === review.id ? null : review.id)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {activeDropdown === review.id && (
                                                <div className="dropdown-menu">
                                                    <button className="dropdown-item">
                                                        <Eye size={16} />
                                                        View Details
                                                    </button>
                                                    <button className="dropdown-item">
                                                        <Edit size={16} />
                                                        Edit
                                                    </button>
                                                    <div className="dropdown-divider"></div>
                                                    <button className="dropdown-item dropdown-item--danger">
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {filteredReviews.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <Search size={48} />
                    </div>
                    <h3 className="empty-state__title">No reviews found</h3>
                    <p className="empty-state__description">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {/* Create Review Modal */}
            <CreateReviewModal 
                isOpen={activeDropdown === 'create_modal'} 
                onClose={() => setActiveDropdown(null)}
                onSuccess={() => {
                    setActiveDropdown(null);
                    fetchReviews();
                }}
            />
        </div>
    );
}

// Create Review Modal Component
function CreateReviewModal({ isOpen, onClose, onSuccess }) {
    const [periods, setPeriods] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        review_period: '',
        employee_ids: []
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initial data fetch
    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            // Reset form
            setFormData({ review_period: '', employee_ids: [] });
            setError(null);
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        try {
            // Import dynamically or pass as props to avoid circular deps if needed, 
            // but importing directly here is fine as per project structure
            const { getReviewPeriods, getAllEmployees } = require('../../../../../api/api_clientadmin');
            
            const [periodsRes, employeesRes] = await Promise.all([
                getReviewPeriods(),
                getAllEmployees({ page_size: 1000 }) // Fetch all for selection
            ]);

            const periodList = periodsRes.data.results || periodsRes.data;
            const activePeriods = periodList.filter(p => p.is_active);
            setPeriods(activePeriods);
            
            // Set default period if available
            if (activePeriods.length > 0) {
                setFormData(prev => ({ ...prev, review_period: activePeriods[0].id }));
            }

            const empList = employeesRes.data.results || employeesRes.data;
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
            const { createReviews } = require('../../../../../api/api_clientadmin');
            
            // Map state keys to backend expected keys
            const payload = {
                review_period_id: formData.review_period,
                employee_ids: formData.employee_ids
            };
            
            await createReviews(payload);
            onSuccess();
        } catch (err) {
            console.error('Create failed:', err);
            setError(err.response?.data?.detail || 'Failed to create reviews. Please try again.');
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
                    <button className="modal-close" onClick={onClose}>
                        <XCircle size={24} />
                    </button>
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
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
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
                                <button 
                                    type="button" 
                                    className="btn-text" 
                                    style={{ fontSize: '0.75rem', padding: 0 }}
                                    onClick={toggleAllEmployees}
                                >
                                    {formData.employee_ids.length === employees.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="multi-select-container">
                                {employees.length === 0 ? (
                                    <p style={{ padding: '0.5rem', color: 'var(--rv-color-mist)', textAlign: 'center' }}>
                                        Loading employees...
                                    </p>
                                ) : (
                                    employees.map(emp => (
                                        <label key={emp.id} className="multi-select-option">
                                            <input 
                                                type="checkbox"
                                                checked={formData.employee_ids.includes(emp.id)}
                                                onChange={() => toggleEmployee(emp.id)}
                                            />
                                            <span style={{ color: 'white' }}>
                                                {emp.full_name || 'Unknown'} 
                                                <span style={{ color: 'var(--rv-color-mist)', marginLeft: '0.5rem' }}>
                                                    ({emp.employee_id})
                                                </span>
                                            </span>
                                            <span style={{ color: 'var(--rv-color-mist)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                                                {emp.department?.name}
                                            </span>
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
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Creating...' : 'Create Reviews'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
