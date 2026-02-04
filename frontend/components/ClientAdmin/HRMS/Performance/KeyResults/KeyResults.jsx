'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Key, Edit2, Trash2, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { getGoals, updateGoalProgress, getReviewPeriods } from '../services/performanceService';
import './KeyResults.css';

export default function KeyResults() {
    const [keyResults, setKeyResults] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingProgress, setEditingProgress] = useState(null);
    const [progressValue, setProgressValue] = useState(0);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadKeyResults();
        }
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            const data = await getReviewPeriods();
            setPeriods(data || []);
            if (data && data.length > 0) {
                const activePeriod = data.find(p => p.status === 'active');
                setSelectedPeriod(activePeriod?.id || data[0].id);
            }
        } catch (error) {
            console.error('Failed to load periods:', error);
        }
    };

    const loadKeyResults = async () => {
        setLoading(true);
        try {
            const data = await getGoals({ review_period: selectedPeriod });
            setKeyResults(data || []);
        } catch (error) {
            console.error('Failed to load key results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProgressUpdate = async (id) => {
        try {
            await updateGoalProgress(id, progressValue);
            setEditingProgress(null);
            loadKeyResults();
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    const startEditProgress = (kr) => {
        setEditingProgress(kr.id);
        setProgressValue(kr.progress_percentage || 0);
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'var(--status-success)';
        if (progress >= 50) return 'var(--status-warning)';
        return 'var(--brand-primary)';
    };

    const filteredResults = keyResults.filter(kr =>
        kr.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="key-results">
            <div className="key-results-toolbar">
                <div className="key-results-filters">
                    <div className="key-results-search">
                        <Search size={18} className="key-results-search__icon" />
                        <input
                            type="text"
                            placeholder="Search key results..."
                            className="key-results-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="period-filter"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        {periods.map(period => (
                            <option key={period.id} value={period.id}>
                                {period.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="key-results-loading">Loading...</div>
            ) : (
                <div className="key-results-list">
                    {filteredResults.map(kr => (
                        <div key={kr.id} className="key-result-item">
                            <div className="key-result-item__icon">
                                <Key size={18} />
                            </div>
                            
                            <div className="key-result-item__content">
                                <h4 className="key-result-item__title">{kr.title}</h4>
                                <p className="key-result-item__objective">
                                    Related to: {kr.description?.substring(0, 50)}...
                                </p>
                            </div>

                            <div className="key-result-item__progress">
                                {editingProgress === kr.id ? (
                                    <div className="progress-edit">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={progressValue}
                                            onChange={(e) => setProgressValue(parseInt(e.target.value))}
                                        />
                                        <span className="progress-value">{progressValue}%</span>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleProgressUpdate(kr.id)}
                                        >
                                            <CheckCircle size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        className="progress-display"
                                        onClick={() => startEditProgress(kr)}
                                    >
                                        <div className="progress-ring">
                                            <svg viewBox="0 0 36 36">
                                                <path
                                                    className="progress-ring__bg"
                                                    d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path
                                                    className="progress-ring__fill"
                                                    strokeDasharray={`${kr.progress_percentage || 0}, 100`}
                                                    style={{ stroke: getProgressColor(kr.progress_percentage || 0) }}
                                                    d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                            <span className="progress-ring__text">
                                                {kr.progress_percentage || 0}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="key-result-item__meta">
                                <span className={`status-badge status-badge--${kr.status}`}>
                                    {kr.status === 'completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                    {kr.status?.replace('_', ' ')}
                                </span>
                                <span className="due-date">Due: {kr.target_date}</span>
                            </div>
                        </div>
                    ))}

                    {filteredResults.length === 0 && (
                        <div className="no-results">
                            <TrendingUp size={48} />
                            <p>No key results found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
