'use client';

import { 
    Users, Briefcase, UserCheck, UserX, 
    TrendingUp, Activity, Calendar, MoreHorizontal,
    PieChart, BarChart
} from 'lucide-react';
import './RecruitDashboard.css';

/**
 * Reusable Chart Component (similar to Performance Dashboard)
 */
const DashboardChart = ({ type = 'donut', data, size = 180 }) => {
    const center = size / 2;
    const radius = (size / 2) - 10;
    const innerRadius = type === 'donut' ? radius * 0.7 : 0;
    
    let currentAngle = -90;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="chart-container">
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
                        
                        // Handle full circle case
                        const pathData = angle === 360 
                            ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`
                            : [
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
                                stroke="var(--bg-secondary)"
                                strokeWidth="2"
                            />
                        );
                    })}
                    {type === 'donut' && (
                        <circle cx={center} cy={center} r={innerRadius} fill="var(--bg-secondary)" />
                    )}
                </svg>
                {type === 'donut' && (
                    <div className="chart-center">
                        <span className="chart-center__value">{total}</span>
                        <span className="chart-center__label">Total</span>
                    </div>
                )}
            </div>
            
            <div className="chart-legend">
                {data.map((item, idx) => (
                    <div key={idx} className="chart-legend__item">
                        <div className="chart-legend__dot" style={{ backgroundColor: item.color }}></div>
                        <span className="chart-legend__label">{item.label}</span>
                        <span className="chart-legend__value">{Math.round((item.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function RecruitDashboard() {
    // Mock Data
    const metrics = [
        { label: "Total Candidates", value: 124, trend: "+12% this month", icon: Users, color: "primary" },
        { label: "Active Jobs", value: 8, trend: "3 closing soon", icon: Briefcase, color: "warning" },
        { label: "Hired", value: 12, trend: "+4 vs last month", icon: UserCheck, color: "success" },
        { label: "Rejected", value: 45, trend: "36% rejection rate", icon: UserX, color: "danger" },
    ];

    const pipelineData = [
        { label: 'Screening', value: 45, color: '#3b82f6' },
        { label: 'Interview', value: 28, color: '#f59e0b' },
        { label: 'Offer', value: 12, color: '#10b981' },
    ];

    const sourceData = [
        { label: 'LinkedIn', value: 65, color: '#0a66c2' },
        { label: 'Website', value: 30, color: '#4f46e5' },
        { label: 'Referral', value: 15, color: '#10b981' },
        { label: 'Agency', value: 10, color: '#f43f5e' },
    ];

    const upcomingInterviews = [
        { id: 1, candidate: "Sarah Wilson", role: "Senior React Dev", time: "10:30 AM", type: "Technical Round", interviewer: "Alex Tech Lead" },
        { id: 2, candidate: "Mike Johnson", role: "Product Designer", time: "2:00 PM", type: "Portfolio Review", interviewer: "Sarah Design Lead" },
        { id: 3, candidate: "Emily Davis", role: "HR Manager", time: "4:00 PM", type: "Final HR Round", interviewer: "John HR Head" },
    ];

    return (
        <div className="recruit-dashboard">
            {/* Metrics Row */}
            <div className="rd-metrics">
                {metrics.map((m, i) => (
                    <div key={i} className={`rd-metric-card rd-metric-card--${m.color}`}>
                        <div className="rd-metric-card__icon">
                            <m.icon size={24} />
                        </div>
                        <div className="rd-metric-card__info">
                            <span className="rd-metric-card__value">{m.value}</span>
                            <span className="rd-metric-card__label">{m.label}</span>
                            <span className="rd-metric-card__trend">{m.trend}</span>
                        </div>
                        <div className="rd-metric-card__bg-icon">
                            <m.icon size={80} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rd-grid">
                {/* Visualizations Column */}
                <div className="rd-charts-col">
                    {/* Pipeline Status */}
                    <div className="rd-card">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">
                                <BarChart size={18} />
                                Pipeline Status
                            </h3>
                            <button className="rd-icon-btn"><MoreHorizontal size={16} /></button>
                        </div>
                        <div className="rd-card__content rd-card__content--center">
                            <DashboardChart data={pipelineData} type="donut" size={200} />
                        </div>
                    </div>

                    {/* Application Sources */}
                    <div className="rd-card">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">
                                <PieChart size={18} />
                                Application Sources
                            </h3>
                            <button className="rd-icon-btn"><MoreHorizontal size={16} /></button>
                        </div>
                        <div className="rd-card__content rd-card__content--center">
                            <DashboardChart data={sourceData} type="pie" size={200} />
                        </div>
                    </div>
                </div>

                {/* Activity Column */}
                <div className="rd-activity-col">
                    {/* Upcoming Interviews */}
                    <div className="rd-card rd-card--flex">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">
                                <Calendar size={18} />
                                Today's Interviews
                            </h3>
                            <span className="rd-badge">3 Scheduled</span>
                        </div>
                        <div className="rd-list">
                            {upcomingInterviews.map(interview => (
                                <div key={interview.id} className="rd-interview-item">
                                    <div className="rd-interview-time">
                                        <span>{interview.time}</span>
                                    </div>
                                    <div className="rd-interview-details">
                                        <h4 className="rd-candidate-name">{interview.candidate}</h4>
                                        <p className="rd-role-type">{interview.role} • {interview.type}</p>
                                        <p className="rd-interviewer">w/ {interview.interviewer}</p>
                                    </div>
                                    <button className="rd-btn-sm">Join</button>
                                </div>
                            ))}
                            {upcomingInterviews.length === 0 && (
                                <p className="rd-empty-state">No interviews scheduled for today.</p>
                            )}
                        </div>
                        <div className="rd-card__footer">
                            <button className="rd-link-btn">View Weekly Schedule</button>
                        </div>
                    </div>

                    {/* Recent Activity / Quick Actions - Simplified for now */}
                    <div className="rd-card">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">
                                <Activity size={18} />
                                Quick Actions
                            </h3>
                        </div>
                        <div className="rd-grid-actions">
                            <button className="rd-action-btn">
                                <Briefcase size={20} />
                                <span>Post Job</span>
                            </button>
                            <button className="rd-action-btn">
                                <Users size={20} />
                                <span>Add Candidate</span>
                            </button>
                            <button className="rd-action-btn">
                                <Calendar size={20} />
                                <span>Schedule</span>
                            </button>
                            <button className="rd-action-btn">
                                <TrendingUp size={20} />
                                <span>Reports</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
