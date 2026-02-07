'use client';

import './ProgressPanel.css';
import { useState, useEffect, useCallback } from 'react';
import { 
    X, RefreshCw, Users, CheckCircle, UserCheck, Star, Gift, Clock,
    ArrowRight, Play, Eye, FileCheck, Lock
} from 'lucide-react';
import { getReviewPeriodProgress } from '../../services/performanceService';

export default function ProgressPanel({ period, onClose }) {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const loadProgress = useCallback(async () => {
        try {
            const data = await getReviewPeriodProgress(period.id);
            setProgress(data);
        } catch (error) {
            console.error('Failed to load progress:', error);
        } finally {
            setLoading(false);
        }
    }, [period.id]);

    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            loadProgress();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [autoRefresh, loadProgress]);

    const getStatusFlowClass = (status) => {
        if (!progress?.status_flow) return '';
        return progress.status_flow[status] ? 'status-step--active' : '';
    };

    const getCompletedSteps = () => {
        if (!progress?.status_flow) return 0;
        const flow = progress.status_flow;
        if (flow.closed) return 5;
        if (flow.completed) return 4;
        if (flow.reviewing) return 3;
        if (flow.active) return 2;
        if (flow.draft) return 1;
        return 0;
    };

    if (loading) {
        return (
            <div className="progress-panel-overlay" onClick={onClose}>
                <div className="progress-panel" onClick={(e) => e.stopPropagation()}>
                    <div className="progress-panel__loading">
                        <RefreshCw className="spin" size={32} />
                        <span>Loading progress...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="progress-panel-overlay" onClick={onClose}>
            <div className="progress-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="progress-panel__header">
                    <div className="progress-panel__title">
                        <h2>{period.name}</h2>
                        <span className="progress-panel__subtitle">Live Progress Dashboard</span>
                    </div>
                    <div className="progress-panel__controls">
                        <button 
                            className={`btn-refresh ${autoRefresh ? 'active' : ''}`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                        >
                            <RefreshCw size={16} className={autoRefresh ? 'spin-slow' : ''} />
                        </button>
                        <button 
                            className="btn-refresh"
                            onClick={loadProgress}
                            title="Refresh now"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button className="btn-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Status Flow */}
                <div className="status-flow">
                    <div className={`status-step ${getStatusFlowClass('draft')}`}>
                        <div className="status-step__icon">
                            <Clock size={18} />
                        </div>
                        <span>Draft</span>
                    </div>
                    <ArrowRight className="status-arrow" size={16} />
                    <div className={`status-step ${getStatusFlowClass('active')}`}>
                        <div className="status-step__icon">
                            <Play size={18} />
                        </div>
                        <span>Active</span>
                    </div>
                    <ArrowRight className="status-arrow" size={16} />
                    <div className={`status-step ${getStatusFlowClass('reviewing')}`}>
                        <div className="status-step__icon">
                            <Eye size={18} />
                        </div>
                        <span>Reviewing</span>
                    </div>
                    <ArrowRight className="status-arrow" size={16} />
                    <div className={`status-step ${getStatusFlowClass('completed')}`}>
                        <div className="status-step__icon">
                            <FileCheck size={18} />
                        </div>
                        <span>Completed</span>
                    </div>
                    <ArrowRight className="status-arrow" size={16} />
                    <div className={`status-step ${getStatusFlowClass('closed')}`}>
                        <div className="status-step__icon">
                            <Lock size={18} />
                        </div>
                        <span>Closed</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="main-progress">
                    <div className="main-progress__header">
                        <span>Overall Completion</span>
                        <span className="main-progress__percentage">
                            {progress?.completion_percentage || 0}%
                        </span>
                    </div>
                    <div className="main-progress__bar">
                        <div 
                            className="main-progress__fill"
                            style={{ width: `${progress?.completion_percentage || 0}%` }}
                        />
                    </div>
                    <div className="main-progress__stats">
                        <span>{progress?.completed || 0} of {progress?.total_reviews || 0} reviews completed</span>
                    </div>
                </div>

                {/* Progress Cards */}
                <div className="progress-cards">
                    <div className="progress-card">
                        <div className="progress-card__icon">
                            <Users size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.total_reviews || 0}</div>
                            <div className="progress-card__label">Total Reviews</div>
                        </div>
                    </div>

                    <div className="progress-card progress-card--info">
                        <div className="progress-card__icon">
                            <CheckCircle size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.self_completed || 0}</div>
                            <div className="progress-card__label">Self Reviews Done</div>
                        </div>
                    </div>

                    <div className="progress-card progress-card--warning">
                        <div className="progress-card__icon">
                            <UserCheck size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.manager_completed || 0}</div>
                            <div className="progress-card__label">Manager Reviews Done</div>
                        </div>
                    </div>

                    <div className="progress-card progress-card--success">
                        <div className="progress-card__icon">
                            <FileCheck size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.completed || 0}</div>
                            <div className="progress-card__label">Completed</div>
                        </div>
                    </div>

                    <div className="progress-card progress-card--star">
                        <div className="progress-card__icon">
                            <Star size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.avg_rating || '—'}</div>
                            <div className="progress-card__label">Avg Rating</div>
                        </div>
                    </div>

                    <div className="progress-card progress-card--bonus">
                        <div className="progress-card__icon">
                            <Gift size={24} />
                        </div>
                        <div className="progress-card__content">
                            <div className="progress-card__value">{progress?.bonus_ready || 0}</div>
                            <div className="progress-card__label">Bonus Ready</div>
                        </div>
                    </div>
                </div>

                {/* Pending indicator */}
                {progress?.pending > 0 && (
                    <div className="pending-indicator">
                        <Clock size={16} />
                        <span>{progress.pending} reviews still pending self-assessment</span>
                    </div>
                )}

                {/* Auto-refresh indicator */}
                {autoRefresh && (
                    <div className="auto-refresh-indicator">
                        <RefreshCw size={12} className="spin-slow" />
                        <span>Auto-refreshing every 30 seconds</span>
                    </div>
                )}
            </div>
        </div>
    );
}
