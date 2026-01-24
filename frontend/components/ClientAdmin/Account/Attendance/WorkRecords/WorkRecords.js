'use client';

import { useState } from 'react';
import { Download, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './WorkRecords.css';

const mockEmployees = [
    { id: 'PEP00', name: 'Kiran Kishor', status: ['L', '', 'A', 'L', 'L', 'L', 'A', 'P', 'A', 'A', 'P', 'P', 'P', 'L', 'P', 'P', 'P', 'P', 'P', 'P', 'P'] },
    { id: '567', name: 'Afsal', status: ['', 'A', 'A', '', '', 'A', 'A', '', 'L', 'A', '', '', 'A', 'A', 'A', 'A', 'A', '', '', 'A'] },
    { id: 'PEP03', name: 'Sunsreekumar', status: ['', 'A', 'A', '', '', 'A', 'A', '', 'P', 'A', '', '', 'A', 'A', 'A', '!'] },
    { id: 'PEP04', name: 'Jagathu', status: ['', 'A', 'P', '', '', 'A', 'A', '', 'A', 'A', '', '', 'A', 'A', 'L', 'A', 'A'], meta: 'TERMINATED' },
    { id: 'PEP05', name: 'Ankit Pokhrel', status: ['', '', '', '', '', '', '', '', 'L', '', '', '', '', '', '!', ''] },
    { id: 'PEP06', name: 'Ravi Kumar', status: [] },
    { id: 'PEP07', name: 'Priya Sharma', status: ['L'] },
    { id: 'PEP08', name: 'Rahul Verma', status: [] },
    { id: 'PEP09', name: 'Vikram Singh', status: ['', 'A', 'A', '', '', 'A', 'A', '', 'A', 'A', '', '', 'A', 'A', 'A', 'A', 'A'] },
    { id: 'PEP10', name: 'Amit Patel', status: ['', 'A', 'A', '', '', 'A', 'A', '', 'A', 'A', '', '', 'A', 'A', 'A', '', '', '', '', 'A'] },
];

export default function WorkRecords() {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const getStatusClass = (status) => {
        if (status === 'P') return 'wr-cell-bubble p';
        if (status === 'L') return 'wr-cell-bubble l';
        if (status === 'A') return 'wr-cell-bubble a';
        if (status === '!') return 'wr-cell-bubble conflict';
        if (status === 'H') return 'wr-cell-bubble h';
        if (status === 'O') return 'wr-cell-bubble o';
        return 'wr-cell-bubble empty';
    };

    const getTooltip = (status, date) => {
        if (!status) return `No Record - Jan ${date}`;
        const map = {
            'P': `Present • 09:00 - 18:00 • Jan ${date}`,
            'L': `Leave • Jan ${date}`,
            'A': `Absent • Jan ${date}`,
            '!': `Conflict Alert • Jan ${date}`,
            'H': `Half Day • 09:00 - 13:00 • Jan ${date}`,
            'O': `On Leave (Present) • Jan ${date}`
        };
        return map[status] || status;
    };

    const calculateStats = (statusArray) => {
        const stats = { P: 0, L: 0, A: 0, Conflict: 0 };
        statusArray.forEach(s => {
            if (s === 'P') stats.P++;
            if (s === 'L') stats.L++;
            if (s === 'A') stats.A++;
            if (s === '!') stats.Conflict++;
        });
        return stats;
    };

    return (
        <div className="work-records-section">
            {/* Header Area */}
            <div className="wr-header">
                <div className="wr-title-area">
                    <h2>Work Records</h2>
                    <p className="text-muted text-sm mt-1">Monthly attendance overview and status</p>
                </div>
                <div className="wr-meta-area">
                    <div className="wr-date-display">Date: Jan. 20, 2026</div>
                    <div className="wr-month-picker">
                        <label>Month</label>
                        <select defaultValue="January, 2026">
                            <option>January, 2026</option>
                            <option>February, 2026</option>
                        </select>
                        <Calendar size={16} className="text-slate-400" />
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
                            {days.map(d => <th key={d}>{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {mockEmployees.map(emp => {
                            const stats = calculateStats(emp.status);
                            return (
                                <tr key={emp.id}>
                                    <td className="emp-name-cell sticky-col">
                                        <div className="emp-info">
                                            <span className="emp-name">{emp.name}</span>
                                            <span className="emp-id">{emp.id}</span>
                                            {emp.meta && <span className="emp-badge terminated">{emp.meta}</span>}
                                        </div>
                                    </td>
                                    <td className="stat-cell sticky-col-2 font-bold text-emerald">{stats.P}</td>
                                    <td className="stat-cell text-amber">{Math.floor(Math.random() * 3)}</td>
                                    <td className="stat-cell text-rose">{stats.A}</td>
                                    {days.map((day, idx) => (
                                        <td key={day} className="timeline-cell">
                                            {emp.status[idx] && (
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
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
