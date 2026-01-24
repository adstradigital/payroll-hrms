'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Coffee, Search, Calendar } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        attendance_percentage: 0,
        on_time: 0,
        late_come: 0
    });
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('Day');
    const [offlineEmployees, setOfflineEmployees] = useState([]);
    const [offlinePage, setOfflinePage] = useState(1);
    const [offlineTotal, setOfflineTotal] = useState(0);
    const [onBreak, setOnBreak] = useState([]);
    const [overtimePending, setOvertimePending] = useState([]);
    const [toValidate, setToValidate] = useState([]);
    const [departmentOvertime, setDepartmentOvertime] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard statistics
    useEffect(() => {
        fetchDashboardStats();
        fetchOfflineEmployees();
        fetchOnBreak();
        fetchOvertimePending();
        fetchToValidate();
        fetchAnalytics();
        fetchDepartmentOvertime();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [analyticsPeriod]);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('/attendance/api/attendance/dashboard-stats/');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchOfflineEmployees = async (page = 1) => {
        try {
            const response = await fetch(`/attendance/api/attendance/offline-employees/?page=${page}`);
            const data = await response.json();
            setOfflineEmployees(data.employees || []);
            setOfflinePage(data.page);
            setOfflineTotal(data.total_pages);
        } catch (error) {
            console.error('Error fetching offline employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOnBreak = async () => {
        try {
            const response = await fetch('/attendance/api/attendance/on-break/');
            const data = await response.json();
            setOnBreak(data.employees || []);
        } catch (error) {
            console.error('Error fetching on-break employees:', error);
        }
    };

    const fetchOvertimePending = async () => {
        try {
            const response = await fetch('/attendance/api/attendance/overtime-pending/');
            const data = await response.json();
            setOvertimePending(data.records || []);
        } catch (error) {
            console.error('Error fetching overtime pending:', error);
        }
    };

    const fetchToValidate = async () => {
        try {
            const response = await fetch('/attendance/api/attendance/to-validate/');
            const data = await response.json();
            setToValidate(data.records || []);
        } catch (error) {
            console.error('Error fetching validation records:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`/attendance/api/attendance/analytics/?period=${analyticsPeriod}`);
            const data = await response.json();
            setAnalyticsData(data.data || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchDepartmentOvertime = async () => {
        try {
            const response = await fetch('/attendance/api/attendance/department-overtime/');
            const data = await response.json();
            setDepartmentOvertime(data.data || []);
        } catch (error) {
            console.error('Error fetching department overtime:', error);
        }
    };

    const handleValidate = async (attendanceId) => {
        try {
            const response = await fetch('/attendance/api/attendance/to-validate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendance_id: attendanceId })
            });
            if (response.ok) {
                fetchToValidate();
            }
        } catch (error) {
            console.error('Error validating attendance:', error);
        }
    };

    const maxPercentage = Math.max(...analyticsData.map(d => d.percentage), 100);

    return (
        <div className="attendance-dashboard">
            {/* Top Stats Cards */}
            <div className="stats-grid stats-grid--3">
                <div className="stat-card stat-card--gray">
                    <div className="stat-card__label">Today's Attendances</div>
                    <div className="stat-card__value">{stats.attendance_percentage}%</div>
                </div>
                <div className="stat-card stat-card--green">
                    <div className="stat-card__label">On Time</div>
                    <div className="stat-card__value">{stats.on_time}</div>
                </div>
                <div className="stat-card stat-card--red">
                    <div className="stat-card__label">Late Come</div>
                    <div className="stat-card__value">{stats.late_come}</div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="dashboard-main-grid">
                {/* Attendance Analytics */}
                <div className="att-card analytics-card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Attendance Analytic</h3>
                        </div>
                        <select
                            className="period-select"
                            value={analyticsPeriod}
                            onChange={(e) => setAnalyticsPeriod(e.target.value)}
                        >
                            <option value="Day">Day</option>
                            <option value="Week">Week</option>
                            <option value="Month">Month</option>
                        </select>
                    </div>
                    <div className="analytics-chart">
                        {analyticsData.map((day, idx) => (
                            <div key={idx} className="analytics-bar-wrapper">
                                <div className="analytics-bar" style={{ height: `${(day.percentage / maxPercentage) * 100}%` }}>
                                    <div className="tooltip">{day.percentage}%</div>
                                </div>
                                <div className="analytics-label">{day.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Offline Employees */}
                <div className="att-card offline-card">
                    <div className="card-header">
                        <h3 className="card-title">Offline Employees</h3>
                    </div>
                    <div className="offline-list">
                        {offlineEmployees.map((emp, idx) => (
                            <div key={idx} className="offline-item">
                                <div className="employee-avatar">{emp.avatar}</div>
                                <div className="employee-info">
                                    <div className="employee-name">{emp.name}</div>
                                    <span className="employee-status">{emp.status}</span>
                                </div>
                                <button className="expand-btn">⋮</button>
                            </div>
                        ))}
                    </div>
                    {offlineTotal > 1 && (
                        <div className="pagination">
                            <span>Page {offlinePage} of {offlineTotal}</span>
                            <div className="pagination-btns">
                                <button
                                    onClick={() => fetchOfflineEmployees(offlinePage - 1)}
                                    disabled={offlinePage === 1}
                                >‹</button>
                                <button
                                    onClick={() => fetchOfflineEmployees(offlinePage + 1)}
                                    disabled={offlinePage === offlineTotal}
                                >›</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Enhanced Hours Chart */}
                <div className="att-card hours-card">
                    <div className="card-header">
                        <h3 className="card-title">Hours Chart</h3>
                        <select className="period-select">
                            <option>January, 2026</option>
                        </select>
                    </div>
                    <div className="hours-chart-wrapper">
                        <div className="chart-legend">
                            <span className="legend-item">
                                <span className="legend-dot legend-dot--pink"></span>
                                Pending Hours
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot legend-dot--cyan"></span>
                                Worked Hours
                            </span>
                        </div>
                        <div className="hours-chart-container">
                            <div className="y-axis-labels">
                                <span>50</span>
                                <span>40</span>
                                <span>30</span>
                                <span>20</span>
                                <span>10</span>
                                <span>0</span>
                            </div>
                            <div className="hours-bars-new">
                                {['Department', 'Sales', 'HR', 'Management', 'Finance', 'Legal', 'Marketing', 'Support', 'Operations', 'IT'].map((dept, idx) => {
                                    const workedHeight = Math.random() * 30 + 10;
                                    const pendingHeight = Math.random() * 20 + 5;
                                    return (
                                        <div key={idx} className="hour-bar-group-new">
                                            <div className="hour-bar-stack">
                                                <div
                                                    className="bar-segment bar-segment--pink"
                                                    style={{ height: `${pendingHeight}px` }}
                                                    data-value={pendingHeight.toFixed(0)}
                                                ></div>
                                                <div
                                                    className="bar-segment bar-segment--cyan"
                                                    style={{ height: `${workedHeight}px` }}
                                                    data-value={workedHeight.toFixed(0)}
                                                ></div>
                                            </div>
                                            <div className="hour-label-new">{dept}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Width Attendance Validation Table */}
            <div className="att-card validation-card-fullwidth">
                <div className="card-header">
                    <h3 className="card-title">Attendance To Validate</h3>
                    <button className="validate-all-btn">Validate All</button>
                </div>
                <div className="validation-table-fullwidth-wrapper">
                    <table className="validation-table-fullwidth">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Check-In</th>
                                <th>In Date</th>
                                <th>Check-Out</th>
                                <th>Out Date</th>
                                <th>Shift</th>
                                <th>Work Type</th>
                                <th>Min Hour</th>
                                <th>Pending Hour</th>
                                <th>At Work</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {toValidate.slice(0, 6).map((record, idx) => {
                                const minHour = '08:15';
                                const pendingHour = (Math.random() * 8).toFixed(2);
                                const atWork = (Math.random() * 8 + 1).toFixed(2);
                                const checkOut = idx % 2 === 0 ? '09:11' : 'None';
                                const outDate = idx % 2 === 0 ? '20/01/2026' : 'None';

                                return (
                                    <tr key={idx}>
                                        <td>
                                            <div className="employee-cell-full">
                                                <div className="employee-avatar-md">{record.employee.avatar}</div>
                                                <div>
                                                    <div className="employee-name-md">{record.employee.name}</div>
                                                    <div className="employee-id-md">({record.employee.employee_id})</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="date-text">{record.date}</span></td>
                                        <td><span className="time-text">{record.check_in}</span></td>
                                        <td><span className="date-text">{record.in_date || record.date}</span></td>
                                        <td><span className="time-text">{checkOut}</span></td>
                                        <td><span className="date-text">{outDate}</span></td>
                                        <td><span className="shift-badge-full">Regular Shift</span></td>
                                        <td><span className="work-type-full">{idx % 3 === 0 ? 'Work From Office' : 'None'}</span></td>
                                        <td><span className="hour-text">{minHour}</span></td>
                                        <td><span className="hour-badge-full hour-badge--pending">{pendingHour}</span></td>
                                        <td><span className="hour-badge-full hour-badge--work">{atWork}</span></td>
                                        <td>
                                            <button
                                                className="validate-btn-full"
                                                onClick={() => handleValidate(record.id)}
                                            >
                                                Validate
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="dashboard-bottom-grid">
                {/* On Break */}
                <div className="att-card on-break-card">
                    <h3 className="card-title">On Break</h3>
                    {onBreak.length === 0 ? (
                        <div className="empty-state">
                            <Coffee size={48} className="empty-icon" />
                            <p>No employees are currently taking a break.</p>
                        </div>
                    ) : (
                        <div className="break-list">
                            {onBreak.map((emp, idx) => (
                                <div key={idx} className="break-item">
                                    <span>{emp.name}</span>
                                    <span className="break-time">{emp.break_start}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overtime To Approve */}
                <div className="att-card overtime-card">
                    <h3 className="card-title">Overtime To Approve</h3>
                    {overtimePending.length === 0 ? (
                        <div className="empty-state">
                            <Search size={48} className="empty-icon" />
                            <p className="empty-title">No Records found.</p>
                            <p className="empty-subtitle">No overtime records pending validation.</p>
                        </div>
                    ) : (
                        <div className="overtime-list">
                            {overtimePending.map((record, idx) => (
                                <div key={idx} className="overtime-item">
                                    <span>{record.employee.name}</span>
                                    <span>{record.overtime_hours}h</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Department Overtime Chart */}
                <div className="att-card dept-overtime-card">
                    <div className="card-header">
                        <h3 className="card-title">Department Overtime Chart</h3>
                        <select className="period-select">
                            <option>Monthly</option>
                            <option>Yearly</option>
                        </select>
                    </div>
                    <div className="pie-chart-wrapper">
                        {departmentOvertime.length > 0 ? (
                            <>
                                <svg viewBox="0 0 200 200" className="pie-chart">
                                    {(() => {
                                        const total = departmentOvertime.reduce((sum, d) => sum + d.overtime_hours, 0);
                                        let currentAngle = 0;
                                        return departmentOvertime.map((dept, idx) => {
                                            const percentage = (dept.overtime_hours / total) * 100;
                                            const angle = (percentage / 100) * 360;
                                            const startAngle = currentAngle;
                                            currentAngle += angle;

                                            const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                                            const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                                            const x2 = 100 + 80 * Math.cos((currentAngle - 90) * Math.PI / 180);
                                            const y2 = 100 + 80 * Math.sin((currentAngle - 90) * Math.PI / 180);
                                            const largeArc = angle > 180 ? 1 : 0;

                                            return (
                                                <path
                                                    key={idx}
                                                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                    fill={dept.color}
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div className="pie-legend">
                                    {departmentOvertime.map((dept, idx) => (
                                        <div key={idx} className="legend-item">
                                            <span className="legend-dot" style={{ backgroundColor: dept.color }}></span>
                                            <span>{dept.department}</span>
                                        </div>
                                    ))}
                                </div>
                            </>

                        ) : (
                            <div className="empty-state">
                                <p>No overtime data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
