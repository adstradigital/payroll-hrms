'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './WorkRecords.css';



export default function WorkRecords() {
    const [viewDate, setViewDate] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [daysInMonth, setDaysInMonth] = useState(31);

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

    const getStatusClass = (status) => {
        if (status === 'P') return 'wr-cell-bubble p';
        if (status === 'L') return 'wr-cell-bubble l';
        if (status === 'A') return 'wr-cell-bubble a';
        if (status === '!') return 'wr-cell-bubble conflict';
        if (status === 'H') return 'wr-cell-bubble h';
        if (status === 'O') return 'wr-cell-bubble o';
        return 'wr-cell-bubble empty';
    };

    const getTooltip = (status, day) => {
        if (!status) return `No Record - ${day}`;
        const map = {
            'P': `Present • ${day}`,
            'L': `Leave • ${day}`,
            'A': `Absent • ${day}`,
            '!': `Conflict Alert • ${day}`,
            'H': `Half Day • ${day}`,
            'O': `On Leave (Present) • ${day}`
        };
        return map[status] || status;
    };

    return (
        <div className="timesheets-section">
            {/* Header Area */}
            <div className="wr-header">
                <div className="wr-title-area">
                    <h2>Work Records</h2>
                    <p className="wr-subtitle">Monthly attendance overview and status</p>
                </div>
                <div className="wr-meta-area">
                    <div className="wr-date-display">Date: {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                    <div className="wr-month-picker">
                        <label>Month</label>
                        <input
                            type="month"
                            className="wr-month-input"
                            value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`}
                            onChange={handleMonthChange}
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar & Legend */}
            <div className="wr-toolbar">
                <div className="wr-toolbar-left">
                    <button className="wr-export-btn">
                        <Download size={16} /> Export
                    </button>
                    <button className="wr-filter-btn">
                        <Filter size={16} /> Filter
                    </button>
                </div>

                <div className="wr-legend">
                    <div className="legend-item"><span className="legend-dot present"></span> Present</div>
                    <div className="legend-item"><span className="legend-dot half-day"></span> Half Day</div>
                    <div className="legend-item"><span className="legend-dot on-leave-att"></span> Excused</div>
                    <div className="legend-item"><span className="legend-dot leave"></span> Leave</div>
                    <div className="legend-item"><span className="legend-dot absent"></span> Absent</div>
                    <div className="legend-item"><span className="legend-dot conflict"></span> Conflict</div>
                </div>
            </div>

            {/* Timeline Grid Table */}
            <div className="wr-grid-container">
                <table className="wr-table">
                    <thead>
                        <tr>
                            <th className="emp-col sticky-col">Employee</th>
                            <th className="stat-col sticky-col-2">Days</th>
                            <th className="stat-col">Late</th>
                            <th className="stat-col">Abs</th>
                            {days.map(d => (
                                <th key={d} className={d > daysInMonth ? 'wr-day-disabled' : ''}>{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={35} className="text-center p-4">Loading work records...</td></tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan={35} className="text-center p-4">No employees found</td></tr>
                        ) : (
                            employees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="emp-name-cell sticky-col">
                                        <div className="emp-info">
                                            <span className="emp-name">{emp.name}</span>
                                            <span className="emp-id">{emp.employee_id}</span>
                                            {emp.meta && <span className="emp-badge terminated">{emp.meta}</span>}
                                        </div>
                                    </td>
                                    <td className="stat-cell sticky-col-2 wr-stat-present">{emp.stats.P}</td>
                                    <td className="stat-cell wr-stat-late">{emp.stats.H}</td>
                                    <td className="stat-cell wr-stat-absent">{emp.stats.A}</td>
                                    {days.map((day, idx) => (
                                        <td key={day} className={`timeline-cell ${day > daysInMonth ? 'wr-day-disabled' : ''}`}>
                                            {day <= daysInMonth && emp.status[idx] && (
                                                <div
                                                    className={getStatusClass(emp.status[idx])}
                                                    title={getTooltip(emp.status[idx], day)}
                                                >
                                                    {emp.status[idx]}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
