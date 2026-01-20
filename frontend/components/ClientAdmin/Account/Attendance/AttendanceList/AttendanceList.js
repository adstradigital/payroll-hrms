'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import './AttendanceList.css';

// Mock data - replace with API call
const mockAttendance = [
    { id: 1, employeeId: 'EMP001', name: 'John Doe', date: '2026-01-16', checkIn: '09:05', checkOut: '18:30', status: 'present', workHours: '8.5' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', date: '2026-01-16', checkIn: '09:15', checkOut: '18:00', status: 'late', workHours: '8.0' },
    { id: 3, employeeId: 'EMP003', name: 'Mike Johnson', date: '2026-01-16', checkIn: null, checkOut: null, status: 'absent', workHours: '0' },
    { id: 4, employeeId: 'EMP004', name: 'Sarah Wilson', date: '2026-01-16', checkIn: '09:00', checkOut: '13:00', status: 'half_day', workHours: '4.0' },
    { id: 5, employeeId: 'EMP005', name: 'Tom Brown', date: '2026-01-16', checkIn: null, checkOut: null, status: 'on_leave', workHours: '0' },
];

export default function AttendanceList() {
    const [attendance, setAttendance] = useState(mockAttendance);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState('all');

    const getStatusBadge = (status) => {
        const badges = {
            present: { label: 'Present', class: 'badge-success' },
            late: { label: 'Late', class: 'badge-warning' },
            absent: { label: 'Absent', class: 'badge-danger' },
            half_day: { label: 'Half Day', class: 'badge-info' },
            on_leave: { label: 'On Leave', class: 'badge-secondary' },
        };
        return badges[status] || { label: status, class: '' };
    };

    const filteredAttendance = attendance.filter(record => {
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Summary stats
    const summary = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        onLeave: attendance.filter(a => a.status === 'on_leave').length,
    };

    return (
        <div className="attendance-list">
            {/* Summary Cards */}
            <div className="attendance-summary">
                <div className="summary-card summary-card--total">
                    <span className="summary-card__value">{summary.total}</span>
                    <span className="summary-card__label">Total</span>
                </div>
                <div className="summary-card summary-card--present">
                    <span className="summary-card__value">{summary.present}</span>
                    <span className="summary-card__label">Present</span>
                </div>
                <div className="summary-card summary-card--late">
                    <span className="summary-card__value">{summary.late}</span>
                    <span className="summary-card__label">Late</span>
                </div>
                <div className="summary-card summary-card--absent">
                    <span className="summary-card__value">{summary.absent}</span>
                    <span className="summary-card__label">Absent</span>
                </div>
                <div className="summary-card summary-card--leave">
                    <span className="summary-card__value">{summary.onLeave}</span>
                    <span className="summary-card__label">On Leave</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="attendance-toolbar">
                <div className="attendance-toolbar__left">
                    <div className="attendance-search">
                        <Search size={18} className="attendance-search__icon" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="attendance-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <input
                        type="date"
                        className="attendance-date-picker"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <select
                        className="attendance-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="half_day">Half Day</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                </div>

                <div className="attendance-toolbar__right">
                    <button className="btn btn-secondary">
                        <Download size={18} />
                        Export
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Mark Attendance
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="attendance-table-container">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Work Hours</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(record => {
                            const badge = getStatusBadge(record.status);
                            return (
                                <tr key={record.id}>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-cell__avatar">
                                                {record.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="employee-cell__info">
                                                <span className="employee-cell__name">{record.name}</span>
                                                <span className="employee-cell__id">{record.employeeId}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{record.date}</td>
                                    <td>{record.checkIn || '--:--'}</td>
                                    <td>{record.checkOut || '--:--'}</td>
                                    <td>{record.workHours} hrs</td>
                                    <td>
                                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="action-btn" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
