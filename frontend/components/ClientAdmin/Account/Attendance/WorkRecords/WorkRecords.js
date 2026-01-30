'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Calendar, ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';

import './WorkRecords.css';



export default function WorkRecords() {
    const [viewDate, setViewDate] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [daysInMonth, setDaysInMonth] = useState(31);
    const [searchTerm, setSearchTerm] = useState('');

    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const fetchWorkRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const month = viewDate.getMonth() + 1;
            const year = viewDate.getFullYear();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/monthly_matrix/?month=${month}&year=${year}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees || []);
                setDaysInMonth(data.days_in_month || 31);
            } else {
                console.error('Failed to fetch work records');
            }
        } catch (error) {
            console.error('Error fetching work records:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkRecords();
    }, [viewDate]);

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-');
        setViewDate(new Date(year, month - 1));
    };

    const shiftMonth = (delta) => {
        setViewDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + delta);
            return newDate;
        });
    };

    const getStatusStyles = (status) => {
        const base = "wr-status-bubble ";
        switch (status) {
            case 'P': return base + "status-p";
            case 'L': return base + "status-l";
            case 'A': return base + "status-a";
            case '!': return base + "status-conflict";
            case 'H': return base + "status-h";
            case 'O': return base + "status-off";
            default: return base;
        }
    };

    const getTooltip = (status, day) => {
        if (!status) return `No Record • Day ${day}`;
        const map = {
            'P': `Present • Day ${day}`,
            'L': `Leave • Day ${day}`,
            'A': `Absent • Day ${day}`,
            '!': `Conflict Alert • Day ${day}`,
            'H': `Half Day • Day ${day}`,
            'O': `Holiday / Week Off • Day ${day}`
        };
        return map[status] || status;
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="work-records-page">
            {/* Container Card */}
            <div className="work-records-container">

                {/* Header Section */}
                <div className="wr-header">
                    {/* Subtle glow background */}
                    <div className="wr-header-glow" />

                    <div className="wr-header-content">
                        <div className="wr-title-group">
                            <div className="wr-title-wrapper">
                                <div className="wr-icon-box">
                                    <Calendar size={24} />
                                </div>
                                <h2 className="wr-title wr-title-gradient">
                                    Work Records
                                </h2>
                            </div>
                            <p className="wr-subtitle">Enterprise Attendance Lifecycle Management</p>
                        </div>

                        <div className="wr-controls">
                            {/* Consolidated Date Navigator */}
                            <div className="wr-date-navigator">
                                <button
                                    onClick={() => shiftMonth(-1)}
                                    className="wr-nav-btn"
                                    title="Previous Month"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="wr-month-picker-integrated">
                                    <span className="wr-current-date-text">
                                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <input
                                        type="month"
                                        className="wr-month-hidden-input"
                                        value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`}
                                        onChange={handleMonthChange}
                                        title="Select Month"
                                    />
                                    <Calendar size={16} className="wr-calendar-icon-hint" />
                                </div>

                                <button
                                    onClick={() => shiftMonth(1)}
                                    className="wr-nav-btn"
                                    title="Next Month"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="wr-toolbar">
                    <div className="wr-search-group">
                        <div className="wr-search-wrapper">
                            <Search className="wr-search-icon" size={16} />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="wr-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="wr-export-btn">
                            <Download size={14} className="text-amber-500" />
                            <span>Export</span>
                        </button>
                    </div>

                    <div className="wr-legend">
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-p"></span> Present</div>
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-h"></span> Half Day</div>
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-l"></span> Leave</div>
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-a"></span> Absent</div>
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-o"></span> Off/Holiday</div>
                        <div className="wr-legend-item"><span className="wr-legend-dot legend-dot-c"></span> Conflict</div>
                    </div>
                </div>

                {/* Table Grid Wrapper */}
                <div className="wr-table-wrapper">
                    <table className="wr-table">
                        <thead>
                            <tr className="wr-tr">
                                <th className="wr-th wr-th-sticky-left">
                                    Employee Identity
                                </th>
                                <th className="wr-th wr-th-sticky-stats">Days</th>
                                <th className="wr-th">Late</th>
                                <th className="wr-th">Abs</th>

                                {days.map(d => (
                                    <th key={d} className={`wr-th wr-th-day ${d > daysInMonth ? 'wr-th-day-inactive' : ''}`}>
                                        {d}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={35} className="wr-loading-cell">
                                        <div className="wr-loading-container">
                                            <div className="wr-spinner"></div>
                                            <div className="wr-loading-text">Synchronizing Records...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={35} className="wr-loading-container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No matching personnel found for this period.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="wr-tr">
                                        <td className="wr-td wr-td-sticky-left">
                                            <div className="wr-emp-info">
                                                <span className="wr-emp-name">
                                                    {emp.name}
                                                </span>
                                                <div className="wr-emp-meta">
                                                    <span className="wr-emp-id">{emp.employee_id}</span>
                                                    {emp.meta && (
                                                        <span className="wr-emp-badge">
                                                            {emp.meta}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="wr-td wr-td-sticky-stats wr-td-stat wr-stat-p">
                                            {emp.stats.P}
                                        </td>

                                        <td className="wr-td wr-td-stat wr-stat-h">{emp.stats.H}</td>
                                        <td className="wr-td wr-td-stat wr-stat-a">{emp.stats.A}</td>

                                        {days.map((day, idx) => (
                                            <td key={day} className="wr-td wr-td-day">
                                                <div className="wr-day-content">
                                                    {day <= daysInMonth && emp.status[idx] ? (
                                                        <div
                                                            className={getStatusStyles(emp.status[idx])}
                                                            title={getTooltip(emp.status[idx], day)}
                                                        >
                                                            {emp.status[idx]}
                                                        </div>
                                                    ) : (
                                                        day <= daysInMonth && <div className="wr-empty-dot" />
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
