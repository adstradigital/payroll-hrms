import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Target, Award, Calendar, ChevronRight,
    AlertCircle, CheckCircle2, Clock, BarChart3, Star,
    Search, Filter, Plus
} from 'lucide-react';
import { getPerformanceDashboard, getReviews, getGoals } from '../../../../../../api/api_clientadmin';
import './ProfilePerformance.css';

const ProfilePerformance = ({ employeeId }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [goals, setGoals] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            try {
                setLoading(true);
                // We use the employee parameter we added to the backend filters
                const [statsRes, reviewsRes, goalsRes] = await Promise.all([
                    getPerformanceDashboard({ employee: employeeId }),
                    getReviews({ employee: employeeId }),
                    getGoals({ employee: employeeId })
                ]);

                setStats(statsRes.data);
                setReviews(reviewsRes.data);
                setGoals(goalsRes.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching performance data:", err);
                setError("This module is currently being configured or has no records to display.");
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchPerformanceData();
        }
    }, [employeeId]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'status-completed';
            case 'in_progress': return 'status-in-progress';
            case 'not_started': return 'status-not-started';
            case 'overdue': return 'status-overdue';
            case 'pending': return 'status-not-started';
            case 'under_review': return 'status-in-progress';
            default: return '';
        }
    };

    const getRatingClass = (rating) => {
        if (!rating) return '';
        const r = parseFloat(rating);
        if (r >= 4.5) return 'rating-excellent';
        if (r >= 3.5) return 'rating-good';
        if (r >= 2.5) return 'rating-satisfactory';
        return 'rating-poor';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Loading performance data...</p>
            </div>
        );
    }

    if (error && (!reviews.length && !goals.length)) {
        return (
            <div className="empty-state">
                <BarChart3 size={48} />
                <h3>No Performance Data</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="performance-container">
            <div className="performance-header">
                <h2>Performance Overview</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => window.location.reload()}>
                        <Clock size={16} /> History
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">Average Rating</span>
                    <div className="stat-value rating">
                        {stats?.average_rating || stats?.average_team_rating || 'N/A'}
                        <Star size={20} fill="currentColor" style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                    </div>
                    <span className="stat-subtitle">Based on last {reviews.length} reviews</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Goal Completion</span>
                    <div className="stat-value completed">
                        {stats?.goal_completion_rate || 0}%
                    </div>
                    <span className="stat-subtitle">{stats?.completed_goals || 0} of {stats?.total_goals || 0} goals achieved</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Goals</span>
                    <div className="stat-value">
                        {(stats?.total_goals || 0) - (stats?.completed_goals || 0)}
                    </div>
                    <span className="stat-subtitle">{stats?.overdue_goals || 0} goals are overdue</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Latest Review</span>
                    <div className="stat-value">
                        {reviews[0]?.overall_rating || '---'}
                    </div>
                    <span className="stat-subtitle">{reviews[0]?.review_period_name || 'No recent reviews'}</span>
                </div>
            </div>

            {/* Active Goals Section */}
            <div className="performance-section">
                <div className="section-title">
                    <Target size={20} />
                    Active Objectives & Goals
                </div>
                {goals.length > 0 ? (
                    <div className="goals-list">
                        {goals.filter(g => g.status !== 'completed').map(goal => (
                            <div key={goal.id} className="goal-card">
                                <div className="goal-header">
                                    <div className="goal-title">{goal.title}</div>
                                    <span className={`goal-status ${getStatusColor(goal.status)}`}>
                                        {goal.status?.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="goal-progress">
                                    <div className="progress-info">
                                        <span>Progress</span>
                                        <span>{goal.progress_percentage}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${goal.progress_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="goal-footer">
                                    <span className="due-date">
                                        Due: {new Date(goal.target_date).toLocaleDateString()}
                                    </span>
                                    {goal.is_overdue && (
                                        <span className="overdue-tag">
                                            <AlertCircle size={12} /> Overdue
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Target size={32} />
                        <p>No active goals assigned at the moment.</p>
                    </div>
                )}
            </div>

            {/* Review History Section */}
            <div className="performance-section">
                <div className="section-title">
                    <Award size={20} />
                    Performance Review History
                </div>
                <div className="history-table-container">
                    {reviews.length > 0 ? (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Review Period</th>
                                    <th>Reviewer</th>
                                    <th>Final Rating</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(review => (
                                    <tr key={review.id}>
                                        <td>{review.review_period_name}</td>
                                        <td>{review.reviewer?.full_name || 'N/A'}</td>
                                        <td>
                                            <div className={`rating-badge ${getRatingClass(review.overall_rating)}`}>
                                                <Star size={14} fill="currentColor" />
                                                {review.overall_rating || 'N/A'}
                                            </div>
                                        </td>
                                        <td>{review.rating_category || 'N/A'}</td>
                                        <td>
                                            <span className={`goal-status ${getStatusColor(review.status)}`}>
                                                {review.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{review.reviewed_at ? new Date(review.reviewed_at).toLocaleDateString() : 'Pending'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <Award size={32} />
                            <p>No performance review records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePerformance;
