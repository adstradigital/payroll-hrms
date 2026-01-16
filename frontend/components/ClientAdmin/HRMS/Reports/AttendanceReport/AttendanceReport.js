'use client';

import { useState } from 'react';
import { Download, Calendar, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import './AttendanceReport.css';

export default function AttendanceReport() {
    const [selectedMonth, setSelectedMonth] = useState('2026-01');

    const reportData = {
        totalWorkDays: 22,
        avgAttendance: 92.5,
        avgLateArrivals: 8.5,
        totalAbsent: 45,
    };

    const departmentData = [
        { dept: 'Engineering', present: 95, late: 5, absent: 2 },
        { dept: 'Design', present: 90, late: 8, absent: 4 },
        { dept: 'Marketing', present: 88, late: 10, absent: 5 },
        { dept: 'HR', present: 98, late: 2, absent: 1 },
        { dept: 'Finance', present: 92, late: 6, absent: 3 },
    ];

    return (
        <div className="attendance-report">
            {/* Header */}
            <div className="report-header">
                <div className="report-header__left">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="report-month-picker"
                    />
                </div>
                <button className="btn btn-primary">
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            {/* Summary Cards */}
            <div className="report-summary">
                <div className="report-card">
                    <Calendar size={24} className="report-card__icon" />
                    <div className="report-card__info">
                        <span className="report-card__value">{reportData.totalWorkDays}</span>
                        <span className="report-card__label">Working Days</span>
                    </div>
                </div>
                <div className="report-card">
                    <TrendingUp size={24} className="report-card__icon report-card__icon--success" />
                    <div className="report-card__info">
                        <span className="report-card__value">{reportData.avgAttendance}%</span>
                        <span className="report-card__label">Avg Attendance</span>
                    </div>
                </div>
                <div className="report-card">
                    <Clock size={24} className="report-card__icon report-card__icon--warning" />
                    <div className="report-card__info">
                        <span className="report-card__value">{reportData.avgLateArrivals}%</span>
                        <span className="report-card__label">Late Arrivals</span>
                    </div>
                </div>
                <div className="report-card">
                    <Users size={24} className="report-card__icon report-card__icon--danger" />
                    <div className="report-card__info">
                        <span className="report-card__value">{reportData.totalAbsent}</span>
                        <span className="report-card__label">Total Absents</span>
                    </div>
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="report-section">
                <h3 className="report-section__title">Department Breakdown</h3>
                <div className="report-table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Present %</th>
                                <th>Late %</th>
                                <th>Absent Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentData.map((dept, index) => (
                                <tr key={index}>
                                    <td>{dept.dept}</td>
                                    <td>
                                        <span className="text-success">{dept.present}%</span>
                                    </td>
                                    <td>
                                        <span className="text-warning">{dept.late}%</span>
                                    </td>
                                    <td>
                                        <span className="text-danger">{dept.absent}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
