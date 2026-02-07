import React, { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    Coffee,
    Search,
    Calendar,
    MoreVertical,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

/**
 * Modern Attendance Dashboard
 * A high-fidelity UI for managing employee presence, overtime, and validations.
 */
export default function Dashboard() {
    // --- State Management ---
    const [stats, setStats] = useState({
        attendance_percentage: 85,
        on_time: 142,
        late_come: 12,
        total_employees: 160
    });
    const [analyticsData, setAnalyticsData] = useState([
        { label: 'Mon', percentage: 78 },
        { label: 'Tue', percentage: 82 },
        { label: 'Wed', percentage: 95 },
        { label: 'Thu', percentage: 88 },
        { label: 'Fri', percentage: 70 },
        { label: 'Sat', percentage: 45 },
        { label: 'Sun', percentage: 20 },
    ]);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('Week');
    const [offlineEmployees, setOfflineEmployees] = useState([
        { name: 'Sarah Connor', status: 'Offline', avatar: 'SC', dept: 'Engineering' },
        { name: 'John Doe', status: 'Offline', avatar: 'JD', dept: 'HR' },
        { name: 'Miles Dyson', status: 'Offline', avatar: 'MD', dept: 'Management' },
    ]);
    const [onBreak, setOnBreak] = useState([
        { name: 'Ellen Ripley', break_start: '12:45 PM', avatar: 'ER' },
        { name: 'Arthur Dallas', break_start: '01:15 PM', avatar: 'AD' }
    ]);
    const [toValidate, setToValidate] = useState([
        { id: 1, employee: { name: 'James Cameron', id: 'EMP001', avatar: 'JC' }, date: '2026-02-05', check_in: '08:55 AM', work_type: 'Office', pending: '0.00', work: '8.50' },
        { id: 2, employee: { name: 'Kathryn Bigelow', id: 'EMP002', avatar: 'KB' }, date: '2026-02-05', check_in: '09:15 AM', work_type: 'Remote', pending: '0.25', work: '7.75' },
        { id: 3, employee: { name: 'Christopher Nolan', id: 'EMP003', avatar: 'CN' }, date: '2026-02-05', check_in: '08:30 AM', work_type: 'Office', pending: '0.00', work: '9.00' },
    ]);
    const [deptOvertime, setDeptOvertime] = useState([
        { department: 'Engineering', overtime_hours: 45, color: '#6366f1' },
        { department: 'Sales', overtime_hours: 30, color: '#8b5cf6' },
        { department: 'HR', overtime_hours: 15, color: '#ec4899' },
        { department: 'Finance', overtime_hours: 10, color: '#f59e0b' },
    ]);

    // Mock Loading state
    const [loading, setLoading] = useState(false);

    const handleValidate = (id) => {
        setToValidate(prev => prev.filter(item => item.id !== id));
    };

    const maxPercentage = Math.max(...analyticsData.map(d => d.percentage), 100);

    return (
        <div className="dashboard-wrapper">
            {/* 1. Statistics Overview */}
            <header className="stats-header">
                <div className="stat-pill stat-pill--primary">
                    <div className="pill-icon"><Users size={20} /></div>
                    <div className="pill-content">
                        <span className="pill-label">Total Attendance</span>
                        <div className="pill-value-row">
                            <span className="pill-value">{stats.attendance_percentage}%</span>
                            <span className="pill-trend"><ArrowUpRight size={14} /> 12%</span>
                        </div>
                    </div>
                </div>
                <div className="stat-pill stat-pill--success">
                    <div className="pill-icon"><CheckCircle2 size={20} /></div>
                    <div className="pill-content">
                        <span className="pill-label">On Time</span>
                        <div className="pill-value-row">
                            <span className="pill-value">{stats.on_time}</span>
                            <span className="pill-sub">Employees</span>
                        </div>
                    </div>
                </div>
                <div className="stat-pill stat-pill--danger">
                    <div className="pill-icon"><AlertCircle size={20} /></div>
                    <div className="pill-content">
                        <span className="pill-label">Late Arrivals</span>
                        <div className="pill-value-row">
                            <span className="pill-value">{stats.late_come}</span>
                            <span className="pill-sub">Today</span>
                        </div>
                    </div>
                </div>
                <div className="stat-pill stat-pill--info">
                    <div className="pill-icon"><Clock size={20} /></div>
                    <div className="pill-content">
                        <span className="pill-label">Total Staff</span>
                        <div className="pill-value-row">
                            <span className="pill-value">{stats.total_employees}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Main Analytics & Activity Section */}
            <div className="layout-grid-top">
                {/* Attendance Chart */}
                <section className="glass-card analytics-box">
                    <div className="card-top">
                        <h3 className="card-heading">Attendance Analytics</h3>
                        <div className="card-actions">
                            <select
                                className="styled-select"
                                value={analyticsPeriod}
                                onChange={(e) => setAnalyticsPeriod(e.target.value)}
                            >
                                <option>Day</option>
                                <option>Week</option>
                                <option>Month</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-container">
                        {analyticsData.map((day, idx) => (
                            <div key={idx} className="bar-group">
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{ height: `${(day.percentage / maxPercentage) * 100}%` }}
                                    >
                                        <span className="bar-tooltip">{day.percentage}%</span>
                                    </div>
                                </div>
                                <span className="bar-label">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Offline List */}
                <section className="glass-card activity-box">
                    <div className="card-top">
                        <h3 className="card-heading">Offline Employees</h3>
                        <button className="text-btn">View All</button>
                    </div>
                    <div className="scroll-list">
                        {offlineEmployees.map((emp, idx) => (
                            <div key={idx} className="list-item">
                                <div className="avatar-circle">{emp.avatar}</div>
                                <div className="item-meta">
                                    <span className="item-title">{emp.name}</span>
                                    <span className="item-sub">{emp.dept}</span>
                                </div>
                                <span className="status-indicator status-indicator--offline">Away</span>
                                <button className="icon-btn"><MoreVertical size={16} /></button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* 3. Validation Table */}
            <section className="glass-card table-section">
                <div className="card-top">
                    <div className="heading-group">
                        <h3 className="card-heading">Pending Validations</h3>
                        <span className="badge-count">{toValidate.length} Requests</span>
                    </div>
                    <button className="primary-btn">Bulk Validate</button>
                </div>
                <div className="responsive-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Check-In</th>
                                <th>Work Type</th>
                                <th>Hours (Worked)</th>
                                <th>Status</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {toValidate.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-sm">{row.employee.avatar}</div>
                                            <div className="user-cell-text">
                                                <span className="name">{row.employee.name}</span>
                                                <span className="id">{row.employee.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="time-cell">
                                            <span className="time">{row.check_in}</span>
                                            <span className="date">{row.date}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`tag tag--${row.work_type.toLowerCase()}`}>
                                            {row.work_type}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="hours-group">
                                            <span className="hrs-val">{row.work}h</span>
                                            <div className="mini-progress"><div className="fill" style={{ width: '85%' }}></div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-pill-warning">Pending</span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            className="action-btn-success"
                                            onClick={() => handleValidate(row.id)}
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 4. Bottom Grid */}
            <div className="layout-grid-bottom">
                {/* On Break */}
                <section className="glass-card half-box">
                    <div className="card-top">
                        <h3 className="card-heading">Current Breaks</h3>
                        <Coffee size={18} className="text-muted" />
                    </div>
                    <div className="break-grid">
                        {onBreak.map((b, i) => (
                            <div key={i} className="break-card">
                                <div className="avatar-sm">{b.avatar}</div>
                                <div className="break-info">
                                    <span className="name">{b.name}</span>
                                    <span className="time">Since {b.break_start}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Dept Overtime */}
                <section className="glass-card half-box">
                    <div className="card-top">
                        <h3 className="card-heading">Overtime by Dept</h3>
                        <select className="styled-select-sm"><option>Monthly</option></select>
                    </div>
                    <div className="viz-row">
                        <div className="doughnut-viz">
                            <svg viewBox="0 0 100 100" className="donut">
                                <circle className="donut-hole" cx="50" cy="50" r="40" fill="transparent"></circle>
                                <circle className="donut-ring" cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="8"></circle>
                                <circle className="donut-segment" cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="8" strokeDasharray="70 30" strokeDashoffset="25"></circle>
                            </svg>
                            <div className="donut-text">
                                <span className="val">100+</span>
                                <span className="lab">Hours</span>
                            </div>
                        </div>
                        <div className="viz-legend">
                            {deptOvertime.map((d, i) => (
                                <div key={i} className="legend-row">
                                    <span className="dot" style={{ backgroundColor: d.color }}></span>
                                    <span className="label">{d.department}</span>
                                    <span className="value">{d.overtime_hours}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}