'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Filter, TrendingUp, TrendingDown, Clock, Target,
  CheckCircle, AlertCircle, Calendar, BarChart3, Download,
  RefreshCw, ChevronDown, Edit3, Save, X, Award, Zap, Activity
} from 'lucide-react';
import { 
  getReviewPeriods, 
  getGoals, 
  updateGoalProgress 
} from '../../../../../api/api_clientadmin';
import './KeyResults.css';

// --- COMPONENT ---

export default function KeyResultsTracking() {
  // ==================== STATE MANAGEMENT ====================
  const [reviewPeriods, setReviewPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [editingGoal, setEditingGoal] = useState(null);
  const [tempProgress, setTempProgress] = useState(0);
  const [toast, setToast] = useState(null);

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    fetchReviewPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchGoals();
    }
  }, [selectedPeriod]);

  useEffect(() => {
    filterAndSortGoals();
  }, [goals, searchTerm, statusFilter, sortBy]);

  const fetchReviewPeriods = async () => {
    try {
      const response = await getReviewPeriods();
      // Handle both paginated and non-paginated responses
      const periods = response.data.results || response.data;
      setReviewPeriods(periods);
      
      // Auto-select active period or first available
      const activePeriod = periods.find(p => p.is_active) || periods[0];
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      }
    } catch (error) {
      console.error('Fetch Review Periods Error:', error);
      showToast('Failed to load review periods', 'error');
    }
  };

  const fetchGoals = async () => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    try {
      const response = await getGoals({ review_period: selectedPeriod });
      // Handle both paginated and non-paginated responses
      const data = response.data.results || response.data;
      setGoals(data);
    } catch (error) {
      console.error('Fetch Goals Error:', error);
      showToast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTERING & SORTING ====================
  const filterAndSortGoals = useCallback(() => {
    if (!goals) return;
    
    let filtered = [...goals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(goal =>
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => goal.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress_percentage - a.progress_percentage;
        case 'dueDate':
          return new Date(a.due_date) - new Date(b.due_date);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredGoals(filtered);
  }, [goals, searchTerm, statusFilter, sortBy]);

  // ==================== PROGRESS UPDATE ====================
  const handleProgressUpdate = async (goalId, newProgress) => {
    setUpdating(goalId);
    
    // Determine status based on progress (optimistic calculation, backend should also handle this)
    let newStatus = 'not_started';
    if (newProgress > 0 && newProgress < 100) newStatus = 'in_progress';
    if (newProgress === 100) newStatus = 'completed';

    try {
      await updateGoalProgress(goalId, newProgress);

      // Update local state
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId
            ? { ...goal, progress_percentage: newProgress, status: newStatus }
            : goal
        )
      );

      showToast('Progress updated successfully', 'success');
      setEditingGoal(null);
    } catch (error) {
      console.error('Update Progress Error:', error);
      showToast('Failed to update progress', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const startEdit = (goal) => {
    setEditingGoal(goal.id);
    setTempProgress(goal.progress_percentage);
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setTempProgress(0);
  };

  const saveEdit = (goalId) => {
    handleProgressUpdate(goalId, tempProgress);
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getStatusConfig = (status) => {
    const configs = {
      not_started: {
        label: 'Not Started',
        color: 'status-text-gray',
        bgColor: 'status-bg-gray',
        icon: AlertCircle,
        progressColor: 'stroke-gray'
      },
      in_progress: {
        label: 'In Progress',
        color: 'status-text-gold',
        bgColor: 'status-bg-gold',
        icon: Activity,
        progressColor: 'stroke-gold'
      },
      completed: {
        label: 'Completed',
        color: 'status-text-green',
        bgColor: 'status-bg-green',
        icon: CheckCircle,
        progressColor: 'stroke-green'
      }
    };
    return configs[status] || configs.not_started;
  };

  const getDaysRemaining = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Overdue', color: 'text-danger', urgent: true };
    if (days === 0) return { text: 'Due today', color: 'text-warning', urgent: true };
    if (days <= 7) return { text: `${days}d left`, color: 'text-warning', urgent: true };
    return { text: `${days}d left`, color: 'text-mist', urgent: false };
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==================== STATISTICS ====================
  const statistics = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const inProgress = goals.filter(g => g.status === 'in_progress').length;
    const notStarted = goals.filter(g => g.status === 'not_started').length;
    const avgProgress = total > 0 
      ? goals.reduce((sum, g) => sum + g.progress_percentage, 0) / total 
      : 0;
    const overdue = goals.filter(g => new Date(g.due_date) < new Date() && g.status !== 'completed').length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      avgProgress: Math.round(avgProgress),
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [goals]);

  // ==================== RENDER COMPONENTS ====================
  const CircularProgress = ({ percentage, size = 80, strokeWidth = 8, status = 'in_progress' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const statusConfig = getStatusConfig(status);

    return (
      <div 
        className="circular-progress-container"
        style={{ width: size, height: size }}
      >
        {/* Track Circle */}
        <svg width={size} height={size} className="circular-progress-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className="circular-progress-track"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${statusConfig.progressColor} circular-progress-value`}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage Text */}
        <div className="circular-progress-label">
          <span className="circular-progress-text">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  const GoalCard = ({ goal }) => {
    const statusConfig = getStatusConfig(goal.status);
    const StatusIcon = statusConfig.icon;
    const daysInfo = getDaysRemaining(goal.due_date);
    const isEditing = editingGoal === goal.id;
    const isUpdating = updating === goal.id;

    return (
      <div className="goal-card fade-in">
        {/* Header with Status Badge */}
        <div className="goal-card-header">
          <div className="goal-info">
            <h3 className="goal-title">
              {goal.title}
            </h3>
            <p className="goal-description">{goal.description}</p>
          </div>
          <div className={`status-pill ${statusConfig.bgColor} ${statusConfig.color}`}>
            <StatusIcon size={12} />
            {statusConfig.label}
          </div>
        </div>

        {/* Progress Section */}
        <div className="goal-progress-section">
          {/* Circular Progress */}
          <div 
            className="progress-circle-wrapper"
            onClick={() => !isEditing && startEdit(goal)}
          >
            <CircularProgress 
              percentage={goal.progress_percentage} 
              status={goal.status}
              size={80}
            />
          </div>

          {/* Progress Details */}
          <div className="progress-content">
            {isEditing ? (
              <div className="edit-mode-container">
                <div>
                  <label className="edit-label">
                    Update Progress: {tempProgress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempProgress}
                    onChange={(e) => setTempProgress(parseInt(e.target.value))}
                    className="slider-input"
                  />
                  <div className="slider-labels">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="edit-actions">
                  <button
                    onClick={() => saveEdit(goal.id)}
                    disabled={isUpdating}
                    className="btn btn-save"
                  >
                    {isUpdating ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isUpdating}
                    className="btn btn-cancel"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-mode-container">
                {/* Progress Bar */}
                <div>
                  <div className="progress-bar-header">
                    <span className="progress-label">Progress</span>
                    <button
                      onClick={() => startEdit(goal)}
                      className="btn-text-action"
                    >
                      <Edit3 size={12} />
                      Update
                    </button>
                  </div>
                  <div className="progress-track">
                    <div 
                        className={`progress-fill ${goal.status === 'completed' ? 'bg-green' : goal.status === 'in_progress' ? 'bg-gold' : 'bg-gray'}`}
                        style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="goal-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className={`meta-item ${daysInfo.color}`}>
                    {daysInfo.urgent && <Clock size={14} />}
                    {daysInfo.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with metrics */}
        <div className="goal-footer">
          <div className="footer-info">
            <div className="footer-tag">
              <Target size={12} />
              <span>Key Result</span>
            </div>
            {goal.objective_title && (
              <div className="footer-tag">
                <Award size={12} />
                <span className="truncate">{goal.objective_title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color = "gold", trend }) => (
    <div className="kr-stat-card">
      <div className="kr-stat-card-header">
        <div className={`stat-icon icon-${color}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`stat-trend ${trend > 0 ? 'text-green' : 'text-danger'}`}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {subValue && (
          <p className="stat-sub">{subValue}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="key-results-enhanced">
      {/* Main Content */}
      <div className="key-results-container">
        {/* Header */}
        <div className="header-section">
          <div>
            <h1 className="page-title">
              <Target size={32} className="text-gold" />
              Key Results Tracking
            </h1>
            <p className="text-gray-600 mt-1">Monitor and update your goal progress in real-time</p>
          </div>

          <div className="header-controls">
             <select
               value={selectedPeriod || ''}
               onChange={(e) => setSelectedPeriod(e.target.value)}
               className="custom-select"
             >
               <option value="">Select Period</option>
               {reviewPeriods.map(period => (
                 <option key={period.id} value={period.id}>
                   {period.name} {period.is_active && '(Active)'}
                 </option>
               ))}
             </select>
             <button onClick={fetchGoals} className="icon-btn" title="Refresh">
               <RefreshCw size={20} />
             </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
            <div className="loading-container">
                <RefreshCw className="spin text-gold mb-4" size={40} />
                <p className="loading-text">Loading your goals...</p>
            </div>
        ) : (
            <>
                {/* Stats */}
                <div className="stats-grid">
                    <StatCard icon={Target} label="Total Goals" value={statistics.total} color="blue" />
                    <StatCard 
                        icon={CheckCircle} 
                        label="Completed" 
                        value={statistics.completed} 
                        subValue={`${statistics.completionRate}% completion`} 
                        color="green" 
                        trend={statistics.completionRate >= 50 ? 5 : -2}
                    />
                    <StatCard 
                        icon={Activity} 
                        label="In Progress" 
                        value={statistics.inProgress} 
                        subValue={`${statistics.avgProgress}% avg progress`} 
                        color="gold" 
                    />
                    <StatCard 
                        icon={AlertCircle} 
                        label="Overdue" 
                        value={statistics.overdue} 
                        color="red" 
                    />
                </div>

                {/* Filter Bar */}
                <div className="filter-section">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search goals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="custom-select"
                    >
                        <option value="all">All Status</option>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="custom-select"
                    >
                        <option value="dueDate">Sort by Due Date</option>
                        <option value="progress">Sort by Progress</option>
                        <option value="title">Sort by Title</option>
                        <option value="status">Sort by Status</option>
                    </select>

                    <div className="view-toggle">
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            Grid
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            List
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(searchTerm || statusFilter !== 'all') && (
                    <div className="active-filters">
                        <span className="text-gray-600">Active Filters:</span>
                        {searchTerm && (
                            <div className="filter-chip">
                                Search: {searchTerm}
                                <span className="filter-chip-remove" onClick={() => setSearchTerm('')}><X size={12} /></span>
                            </div>
                        )}
                        {statusFilter !== 'all' && (
                            <div className="filter-chip">
                                Status: {statusFilter.replace('_', ' ')}
                                <span className="filter-chip-remove" onClick={() => setStatusFilter('all')}><X size={12} /></span>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Grid */}
                <div className="goals-section">
                    <div className="goals-header">
                        <h2 className="section-title">
                            {filteredGoals.length} {filteredGoals.length === 1 ? 'Goal' : 'Goals'}
                        </h2>
                        <button className="export-btn">
                            <Download size={16} /> Export Report
                        </button>
                    </div>

                    {filteredGoals.length === 0 ? (
                        <div className="no-results">
                            <div className="no-results-icon"><Target size={48} /></div>
                            <h3 className="no-results-title">No goals found</h3>
                            <p className="text-gray-600">
                                {searchTerm || statusFilter !== 'all' 
                                    ? "Try adjusting your filters" 
                                    : "No goals have been created for this period yet."}
                            </p>
                        </div>
                    ) : (
                        <div className={`goals-grid ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                            {filteredGoals.map(goal => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </div>
            </>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
          <div className={`toast-container ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{toast.message}</span>
          </div>
      )}
    </div>
  );
}
