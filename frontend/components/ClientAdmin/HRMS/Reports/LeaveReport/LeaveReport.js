'use client';

import { useState } from 'react';
import { Download, Calendar, FileText, TrendingDown } from 'lucide-react';
import './LeaveReport.css';

export default function LeaveReport() {
    const [selectedMonth, setSelectedMonth] = useState('2026-01');

    const leaveStats = {
        totalLeavesTaken: 89,
        avgLeavesPerEmployee: 2.5,
        pendingRequests: 12,
        rejectedRequests: 5,
    };

    const leaveTypeData = [
        { type: 'Casual Leave', taken: 35, percentage: 39 },
        { type: 'Sick Leave', taken: 28, percentage: 31 },
        { type: 'Earned Leave', taken: 18, percentage: 20 },
        { type: 'Maternity/Paternity', taken: 8, percentage: 9 },
    ];

    return (
        <div className="leave-report">
            <div className="report-header">
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="report-month-picker"
                />
                <button className="btn btn-primary">
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            <div className="report-summary">
                <div className="report-card">
                    <FileText size={24} className="report-card__icon" />
                    <div className="report-card__info">
                        <span className="report-card__value">{leaveStats.totalLeavesTaken}</span>
                        <span className="report-card__label">Total Leaves Taken</span>
                    </div>
                </div>
                <div className="report-card">
                    <TrendingDown size={24} className="report-card__icon report-card__icon--info" />
                    <div className="report-card__info">
                        <span className="report-card__value">{leaveStats.avgLeavesPerEmployee}</span>
                        <span className="report-card__label">Avg per Employee</span>
                    </div>
                </div>
                <div className="report-card">
                    <Calendar size={24} className="report-card__icon report-card__icon--warning" />
                    <div className="report-card__info">
                        <span className="report-card__value">{leaveStats.pendingRequests}</span>
                        <span className="report-card__label">Pending</span>
                    </div>
                </div>
            </div>

            <div className="report-section">
                <h3 className="report-section__title">Leave Type Breakdown</h3>
                <div className="leave-breakdown">
                    {leaveTypeData.map((item, index) => (
                        <div key={index} className="leave-type-row">
                            <span className="leave-type-name">{item.type}</span>
                            <div className="leave-type-bar">
                                <div className="leave-type-bar__fill" style={{ width: `${item.percentage}%` }}></div>
                            </div>
                            <span className="leave-type-count">{item.taken} days</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
