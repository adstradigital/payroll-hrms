'use client';

import { useState } from 'react';
import { Search, Plus, Target, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import './Goals.css';

const mockGoals = [
    { id: 1, employee: 'John Doe', title: 'Complete React Certification', category: 'Learning', progress: 80, dueDate: '2026-02-28', status: 'on_track' },
    { id: 2, employee: 'Jane Smith', title: 'Lead 3 Design Projects', category: 'Performance', progress: 66, dueDate: '2026-03-31', status: 'on_track' },
    { id: 3, employee: 'Mike Johnson', title: 'Increase Sales by 20%', category: 'Sales', progress: 45, dueDate: '2026-03-01', status: 'at_risk' },
    { id: 4, employee: 'Sarah Wilson', title: 'Onboard 10 New Employees', category: 'HR', progress: 100, dueDate: '2026-01-31', status: 'completed' },
];

export default function Goals() {
    const [goals, setGoals] = useState(mockGoals);
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status) => {
        const badges = {
            on_track: { class: 'badge-success', label: 'On Track' },
            at_risk: { class: 'badge-warning', label: 'At Risk' },
            completed: { class: 'badge-info', label: 'Completed' },
        };
        return badges[status] || { class: '', label: status };
    };

    return (
        <div className="goals">
            <div className="goals-toolbar">
                <div className="goals-search">
                    <Search size={18} className="goals-search__icon" />
                    <input
                        type="text"
                        placeholder="Search goals..."
                        className="goals-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    Add Goal
                </button>
            </div>

            <div className="goals-grid">
                {goals.map(goal => {
                    const badge = getStatusBadge(goal.status);
                    return (
                        <div key={goal.id} className="goal-card">
                            <div className="goal-card__header">
                                <div className="goal-card__icon">
                                    <Target size={18} />
                                </div>
                                <span className={`badge ${badge.class}`}>{badge.label}</span>
                            </div>

                            <h3 className="goal-card__title">{goal.title}</h3>
                            <p className="goal-card__employee">{goal.employee}</p>

                            <div className="goal-card__progress">
                                <div className="progress-bar">
                                    <div className="progress-bar__fill" style={{ width: `${goal.progress}%` }}></div>
                                </div>
                                <span className="progress-text">{goal.progress}%</span>
                            </div>

                            <div className="goal-card__footer">
                                <span className="goal-card__category">{goal.category}</span>
                                <span className="goal-card__due">Due: {goal.dueDate}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
