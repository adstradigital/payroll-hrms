'use client';

import { useState } from 'react';
import {
    TrendingUp, TrendingDown, Users, CalendarPlus,
    Clock, DollarSign, Download, Building2, UserPlus, Wallet,
    ChevronLeft, ChevronRight, GripVertical, CalendarDays
} from 'lucide-react';

export const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }) => (
    <div className="stat-card">
        <div className="stat-card__header">
            <div className="stat-card__info">
                <span className="stat-card__label">{title}</span>
                <span className="stat-card__value">{value}</span>
            </div>
            <div className={`stat-card__icon-wrapper stat-card__icon-wrapper--${color}`} style={{ backgroundColor: `var(--brand-${color}, var(--color-${color}))` }}>
                <Icon size={22} />
            </div>
        </div>
        <div className="stat-card__footer">
            <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
                {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trendValue}
            </span>
            <span className="stat-card__trend-label">vs last month</span>
        </div>
    </div>
);

export const AttendanceChart = () => {
    const data = [
        { label: 'Mon', value: 85 },
        { label: 'Tue', value: 92 },
        { label: 'Wed', value: 88 },
        { label: 'Thu', value: 95 },
        { label: 'Fri', value: 90 },
        { label: 'Sat', value: 45 },
        { label: 'Sun', value: 20 },
    ];

    return (
        <div className="chart-container">
            <div className="bar-chart">
                {data.map((item, i) => (
                    <div key={i} className="bar-wrapper">
                        <div className="bar" style={{ height: `${item.value}%` }}>
                            <div className="bar-tooltip">{item.value}%</div>
                        </div>
                        <span className="bar-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const MiniCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Previous month filler
    for (let i = 0; i < startDay; i++) days.push({ day: '', type: 'empty' });

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
        const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
        const isWeekend = (startDay + i - 1) % 7 === 0 || (startDay + i - 1) % 7 === 6;
        const hasEvent = i === 15 || i === 26; // Example events
        days.push({ day: i, type: 'current', isToday, isWeekend, hasEvent });
    }

    return (
        <div className="mini-calendar">
            <div className="mini-calendar__header">
                <span className="mini-calendar__month">{monthNames[month]} {year}</span>
                <div className="mini-calendar__nav">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="calendar-nav-btn"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="calendar-nav-btn"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="mini-calendar__grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                    <div key={`weekday-${idx}`} className="calendar-weekday">{d}</div>
                ))}
                {days.map((d, i) => (
                    <div key={i} className={`calendar-day ${d.type} ${d.isToday ? 'is-today' : ''} ${d.isWeekend ? 'is-weekend' : ''} ${d.hasEvent ? 'has-event' : ''}`}>
                        {d.day}
                        {d.hasEvent && <span className="event-dot"></span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const RecentActivityTable = () => {
    const employees = [
        { id: 'EMP001', name: 'John Doe', email: 'john.doe@example.com', dept: 'Engineering', status: 'Active' },
        { id: 'EMP002', name: 'Jane Smith', email: 'jane.smith@example.com', dept: 'HR', status: 'Active' },
        { id: 'EMP003', name: 'Robert Wilson', email: 'robert.w@example.com', dept: 'Ops', status: 'On Leave' },
        { id: 'EMP004', name: 'Sarah Parker', email: 'sarah.p@example.com', dept: 'Engineering', status: 'Active' },
    ];

    return (
        <div className="recent-activity-table">
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp) => (
                        <tr key={emp.id}>
                            <td>
                                <div className="user-info-cell">
                                    <div className="user-avatar-sm">
                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{emp.name}</span>
                                        <span className="user-email">{emp.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td><span className="dept-tag">{emp.dept}</span></td>
                            <td>
                                <span className={`status-pill ${emp.status === 'Active' ? 'active' : 'warning'}`}>
                                    {emp.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const HolidayBanner = () => (
    <div className="holiday-banner">
        <div>
            <p className="holiday-banner__label">Upcoming Holiday</p>
            <p className="holiday-banner__title">Republic Day</p>
            <p className="holiday-banner__date">Monday, Jan 26</p>
        </div>
        <div className="holiday-banner__icon">
            <Building2 size={24} />
        </div>
    </div>
);

// Actions Widget - Shows pending actions count
export const ActionsWidget = () => {
    const actions = [
        { label: 'Leave', count: 8, color: 'warning' },
        { label: 'Payroll', count: 5, color: 'info' },
        { label: 'Attendance', count: 3, color: 'success' },
    ];

    return (
        <div className="action-widget">
            <div className="action-widget__header">
                <GripVertical size={16} className="drag-handle" />
                <h3 className="action-widget__title">Actions</h3>
            </div>
            <div className="action-widget__list">
                {actions.map((action, i) => (
                    <div key={i} className="action-widget__item">
                        <span className={`action-dot action-dot--${action.color}`}></span>
                        <span className="action-label">{action.label}</span>
                        <span className="action-count">{action.count}</span>
                    </div>
                ))}
            </div>
            <button className="action-widget__btn">All Actions</button>
        </div>
    );
};

// My Team Widget - Shows direct reports
export const MyTeamWidget = () => {
    const teamStats = [
        { label: 'Present', count: 10 },
        { label: 'WFH', count: 2 },
    ];

    return (
        <div className="team-widget">
            <div className="team-widget__header">
                <GripVertical size={16} className="drag-handle" />
                <h3 className="team-widget__title">My Team</h3>
            </div>
            <div className="team-widget__circle">
                <span className="team-widget__count">12</span>
                <div className="team-widget__info">
                    <span className="team-widget__label">Direct Reports</span>
                    <span className="team-widget__dept">Engineering</span>
                </div>
            </div>
            <div className="team-widget__stats">
                {teamStats.map((stat, i) => (
                    <div key={i} className="team-stat">
                        <span className="team-stat__label">{stat.label}</span>
                        <span className="team-stat__value">{stat.count}</span>
                    </div>
                ))}
            </div>
            <button className="team-widget__btn">View Team</button>
        </div>
    );
};

// Next Run Widget - Payroll countdown
export const NextRunWidget = () => {
    return (
        <div className="nextrun-widget">
            <div className="nextrun-widget__header">
                <span className="nextrun-widget__label">NEXT RUN</span>
                <CalendarDays size={18} className="nextrun-icon" />
            </div>
            <div className="nextrun-widget__date">Jan 31</div>
            <div className="nextrun-widget__countdown">
                <span className="countdown-value">3</span>
                <span className="countdown-label">days left</span>
            </div>
            <div className="nextrun-widget__stats">
                <div className="nextrun-stat">
                    <span className="nextrun-stat__label">Pending</span>
                    <span className="nextrun-stat__value">12</span>
                </div>
                <div className="nextrun-stat">
                    <span className="nextrun-stat__label">Processed</span>
                    <span className="nextrun-stat__value">1236</span>
                </div>
            </div>
            <button className="nextrun-widget__btn">View</button>
        </div>
    );
};
