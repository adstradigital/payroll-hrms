'use client';

import { useState } from 'react';
import {
    TrendingUp, TrendingDown, Users, CalendarPlus,
    Clock, DollarSign, Download, Building2, UserPlus, Wallet,
    ChevronLeft, ChevronRight
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
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="calendar-weekday">{d}</div>
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
