'use client';

import { useState, useEffect } from 'react';
import { 
    BarChart3, Users, Target, CheckCircle, Clock, TrendingUp, 
    AlertTriangle, Award, Calendar, ChevronRight, Plus, 
    Activity, ArrowUpRight
} from 'lucide-react';
import { getDashboardStats, getReviewPeriods } from '../services/performanceService';
import './Dashboard.css';

/**
 * SVG Donut/Pie Chart Component
 */
const FuturisticChart = ({ type = 'donut', data, size = 200 }) => {
    const center = size / 2;
    const radius = (size / 2) - 15;
    const innerRadius = type === 'donut' ? radius * 0.7 : 0;
    
    let currentAngle = -90;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="chart-container">
            <div className="chart-legend">
                {data.map((item, idx) => (
                    <div key={idx} className="chart-legend__item">
                        <div className="chart-legend__dot" style={{ backgroundColor: item.color }}></div>
                        <span className="chart-legend__label">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="chart-wrapper">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="chart-svg">
                    {data.map((item, idx) => {
                        if (item.value === 0) return null;
                        const angle = (item.value / total) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle = endAngle;

                        const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
                        const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
                        const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
                        const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = [
                            `M ${center} ${center}`,
                            `L ${x1} ${y1}`,
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            'Z'
                        ].join(' ');

                        return (
                            <path
                                key={idx}
                                d={pathData}
                                fill={item.color}
                                className="chart-segment"
                                stroke="var(--bg-primary)"
                                strokeWidth="2"
                            />
                        );
                    })}
                    {type === 'donut' && (
                        <circle cx={center} cy={center} r={innerRadius} fill="var(--bg-primary)" />
                    )}
                </svg>
                
                {type === 'donut' && (
                    <div className="chart-center">
                        <span className="chart-center__value">{total}</span>
                        <span className="chart-center__label">Total</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Dashboard() {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [stats, setStats] = useState({
        total_employees: 0,
        completed_reviews: 0,
        pending_reviews: 0,
        overdue_reviews: 0,
        completion_percentage: 0,
        average_rating: 0,
        total_goals: 0,
        goals_on_track: 0,
        goals_delayed: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadDashboardStats();
        }
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            const data = await getReviewPeriods();
            setPeriods(data || []);
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

    const loadDashboardStats = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats(selectedPeriod);
            setStats(data || stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get computed CSS variables for chart colors
    const getChartColors = () => {
        if (typeof window !== 'undefined') {
            const style = getComputedStyle(document.documentElement);
            return {
                primary: style.getPropertyValue('--brand-primary').trim() || '#f59e0b',
                secondary: style.getPropertyValue('--text-muted').trim() || '#525252',
                tertiary: style.getPropertyValue('--text-secondary').trim() || '#a3a3a3',
                danger: style.getPropertyValue('--color-danger').trim() || '#ef4444'
            };
        }
        return { primary: '#f59e0b', secondary: '#525252', tertiary: '#a3a3a3', danger: '#ef4444' };
    };

    const colors = getChartColors();

    const objectiveData = [
        { label: 'On Track', value: stats.goals_on_track || 4, color: colors.primary },
        { label: 'Delayed', value: stats.goals_delayed || 2, color: colors.secondary },
    ];

    const reviewData = [
        { label: 'Completed', value: stats.completed_reviews || 3, color: colors.primary },
        { label: 'Pending', value: stats.pending_reviews || 5, color: colors.tertiary },
    ];

    const activities = [
        { user: "System", action: "Dashboard initialized", time: "Just now", icon: <CheckCircle className="activity-icon--gold" size={14}/> },
        { user: "Admin", action: "Review period active", time: "Today", icon: <Activity className="activity-icon" size={14}/> },
        { user: "System", action: "Stats synchronized", time: "1h ago", icon: <Clock className="activity-icon" size={14}/> },
    ];

    const metricCards = [
        { label: "Total Employees", value: stats.total_employees, icon: Users, trend: "Active" },
        { label: "Total Goals", value: stats.total_goals || 0, icon: Target, trend: "This Period" },
        { label: "Completed Reviews", value: stats.completed_reviews, icon: CheckCircle, trend: `${stats.completion_percentage}%` },
        { label: "Avg. Rating", value: stats.average_rating?.toFixed(1) || "0.0", icon: Award, trend: "Out of 5" },
    ];

    if (loading) {
        return (
            <div className="perf-dashboard perf-dashboard--loading">
                <div className="loading-spinner"></div>
                <p>Loading performance data...</p>
            </div>
        );
    }

    return (
        <div className="perf-dashboard">
            {/* Header Section */}
            <div className="perf-header">
                <div className="perf-header__info">
                    <p className="perf-header__label">Performance Analytics</p>
                    <h2 className="perf-header__title">Executive Dashboard</h2>
                </div>
                <div className="perf-header__actions">
                    <select 
                        className="period-select"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        {periods.map(period => (
                            <option key={period.id} value={period.id}>{period.name}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary">
                        <Plus size={16} />
                        New Review
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                {metricCards.map((card, i) => (
                    <div key={i} className="metric-card">
                        <div className="metric-card__bg-icon">
                            <card.icon size={64} />
                        </div>
                        <div className="metric-card__header">
                            <div className="metric-card__icon">
                                <card.icon size={20} />
                            </div>
                            <span className="metric-card__trend">{card.trend}</span>
                        </div>
                        <p className="metric-card__label">{card.label}</p>
                        <p className="metric-card__value">{card.value}</p>
                        <div className="metric-card__accent"></div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Objective Status Card */}
                <div className="chart-card chart-card--large">
                    <div className="chart-card__header">
                        <div>
                            <h3 className="chart-card__title">Goals Overview</h3>
                            <p className="chart-card__subtitle">Real-time completion tracking</p>
                        </div>
                        <ChevronRight size={18} className="chart-card__arrow" />
                    </div>
                    <div className="chart-card__content">
                        <FuturisticChart data={objectiveData} type="donut" />
                        <div className="progress-bars">
                            {objectiveData.map((item, i) => (
                                <div key={i} className="progress-item">
                                    <div className="progress-item__header">
                                        <span className="progress-item__label">{item.label}</span>
                                        <span className="progress-item__value">
                                            {Math.round((item.value / (stats.total_goals || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="progress-item__bar">
                                        <div 
                                            className="progress-item__fill" 
                                            style={{ 
                                                backgroundColor: item.color, 
                                                width: `${(item.value / (stats.total_goals || 1)) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Side Cards */}
                <div className="side-cards">
                    {/* Alert Card */}
                    <div className="alert-card">
                        <div className="alert-card__header">
                            <AlertTriangle className="alert-card__icon" size={18} />
                            <h4 className="alert-card__title">System Alerts</h4>
                        </div>
                        <p className="alert-card__text">
                            {stats.overdue_reviews > 0 
                                ? `${stats.overdue_reviews} overdue reviews require attention.`
                                : 'No critical issues detected for this review period.'}
                        </p>
                        <div className="alert-card__bg-icon">
                            <AlertTriangle size={80} />
                        </div>
                    </div>

                    {/* Activity Card */}
                    <div className="activity-card">
                        <h4 className="activity-card__title">
                            <Activity size={16} className="activity-card__icon" /> 
                            Recent Activity
                        </h4>
                        <div className="activity-list">
                            {activities.map((act, i) => (
                                <div key={i} className="activity-item">
                                    <div className="activity-item__icon-wrapper">
                                        {act.icon}
                                    </div>
                                    <div className="activity-item__content">
                                        <p className="activity-item__text">
                                            <strong>{act.user}</strong> {act.action}
                                        </p>
                                        <p className="activity-item__time">{act.time}</p>
                                    </div>
                                    <ArrowUpRight size={12} className="activity-item__arrow" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="secondary-charts">
                <div className="chart-card">
                    <h3 className="chart-card__title">Review Status</h3>
                    <div className="chart-card__content chart-card__content--centered">
                        <FuturisticChart data={reviewData} type="pie" size={180} />
                    </div>
                </div>
                <div className="chart-card">
                    <h3 className="chart-card__title">Performance Distribution</h3>
                    <div className="chart-card__content chart-card__content--centered">
                        <FuturisticChart 
                            data={[
                                { label: 'Excellent', value: 3, color: colors.primary },
                                { label: 'Good', value: 4, color: colors.tertiary },
                                { label: 'Needs Work', value: 1, color: colors.danger }
                            ]} 
                            type="donut" 
                            size={180} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
