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
import attendanceApi from '@/api/attendance_api';
import './Dashboard.css';

/**
 * Modern Attendance Dashboard
 * A high-fidelity UI for managing employee presence, overtime, and validations.
 */
export default function Dashboard() {
    const formatCheckInTime = (timeValue) => {
        if (!timeValue) return null;

        const [hours, minutes] = String(timeValue).split(':');
        if (hours === undefined || minutes === undefined) return timeValue;

        const hourNum = Number(hours);
        if (Number.isNaN(hourNum)) return timeValue;

        const suffix = hourNum >= 12 ? 'PM' : 'AM';
        const normalizedHour = hourNum % 12 || 12;
        return `${normalizedHour}:${minutes} ${suffix}`;
    };

    const normalizeValidationRecord = (record) => ({
        id: record.id,
        employee: {
            name: record.employee?.name || 'Unknown Employee',
            id: record.employee?.employee_id || record.employee?.id || 'N/A',
            avatar: record.employee?.avatar || (record.employee?.name || 'U').charAt(0).toUpperCase()
        },
        date: record.date || record.in_date || '--',
        check_in: formatCheckInTime(record.check_in),
        work_type: record.work_type || 'Office',
        pending: record.pending || '0.00',
        work: record.work || ''
    });

    // --- State Management ---
    const [stats, setStats] = useState({
        attendance_percentage: 0,
        on_time: 0,
        late_come: 0,
        total_employees: 0
    });
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('Week');
    const [offlineEmployees, setOfflineEmployees] = useState([]);
    const [onBreak, setOnBreak] = useState([]);
    const [toValidate, setToValidate] = useState([]);
    const [deptOvertime, setDeptOvertime] = useState([]);

    const [loading, setLoading] = useState(true);
    const [bulkValidating, setBulkValidating] = useState(false);
    const [validatingIds, setValidatingIds] = useState([]);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        const fetchAllDashboardData = async () => {
            setLoading(true);
            try {
                // Prepare concurrent requests
                const [
                    statsRes,
                    analyticsRes,
                    offlineRes,
                    onBreakRes,
                    overtimeRes,
                    validationRes
                ] = await Promise.all([
                    attendanceApi.getDashboardStats(),
                    attendanceApi.getAnalyticsData(analyticsPeriod === 'Week' ? 'Day' : analyticsPeriod),
                    attendanceApi.getOfflineEmployees({ page_size: 10 }),
                    attendanceApi.getOnBreakEmployees(),
                    attendanceApi.getDepartmentOvertime(),
                    attendanceApi.getAttendanceToValidate()
                ]);

                // 1. Update Core Stats
                if (statsRes.data) {
                    setStats({
                        attendance_percentage: statsRes.data.attendance_percentage || 0,
                        on_time: statsRes.data.on_time || 0,
                        late_come: statsRes.data.late_come || 0,
                        total_employees: statsRes.data.total_employees || 0
                    });
                }

                // 2. Update Analytics Chart
                if (analyticsRes.data?.data) {
                    setAnalyticsData(analyticsRes.data.data);
                }

                // 3. Update Offline List
                if (offlineRes.data?.employees) {
                    setOfflineEmployees(offlineRes.data.employees);
                }

                // 4. Update On Break
                if (onBreakRes.data?.employees) {
                    setOnBreak(onBreakRes.data.employees.map(b => ({
                        ...b,
                        // Format the break_start timestamp if available
                        break_start_display: b.break_start 
                            ? new Date(b.break_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Joined'
                    })));
                }

                // 5. Update Overtime
                if (overtimeRes.data?.data) {
                    setDeptOvertime(overtimeRes.data.data);
                }

                // 6. Update Validations
                const records = validationRes.data?.records || [];
                setToValidate(records.map(normalizeValidationRecord));
                setValidationError('');

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                setValidationError('Some dashboard metrics could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllDashboardData();
    }, [analyticsPeriod]);

    const handleValidate = async (id) => {
        setValidatingIds(prev => [...prev, id]);
        try {
            await attendanceApi.validateAttendance({ attendance_id: id });
            setToValidate(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to validate attendance:', error);
            alert(error?.response?.data?.error || 'Failed to validate attendance record.');
        } finally {
            setValidatingIds(prev => prev.filter(item => item !== id));
        }
    };

    const handleBulkValidate = async () => {
        if (toValidate.length === 0 || bulkValidating) return;

        setBulkValidating(true);
        const pendingIds = toValidate.map(item => item.id);

        try {
            const results = await Promise.allSettled(
                pendingIds.map((attendanceId) =>
                    attendanceApi.validateAttendance({ attendance_id: attendanceId })
                )
            );

            const successfulIds = results
                .map((result, index) => (result.status === 'fulfilled' ? pendingIds[index] : null))
                .filter(Boolean);

            const failedCount = results.length - successfulIds.length;

            if (successfulIds.length > 0) {
                setToValidate(prev => prev.filter(item => !successfulIds.includes(item.id)));
            }

            if (failedCount > 0) {
                alert(`${failedCount} attendance record(s) could not be validated. Please try again.`);
            }
        } catch (error) {
            console.error('Bulk validate failed:', error);
            alert('Failed to validate attendance records.');
        } finally {
            setBulkValidating(false);
        }
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
                        {offlineEmployees.length > 0 ? offlineEmployees.map((emp, idx) => (
                            <div key={idx} className="list-item">
                                <div className="avatar-circle">{emp.avatar}</div>
                                <div className="item-meta">
                                    <span className="item-title">{emp.name}</span>
                                    <span className="item-sub">{emp.dept}</span>
                                </div>
                                <span className="status-indicator status-indicator--offline">Away</span>
                                <button className="icon-btn"><MoreVertical size={16} /></button>
                            </div>
                        )) : (
                            <div className="empty-list-placeholder">All staff are accounted for.</div>
                        )}
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
                    <button
                        className="primary-btn"
                        onClick={handleBulkValidate}
                        disabled={loading || bulkValidating || toValidate.length === 0}
                    >
                        {bulkValidating ? 'Validating...' : 'Bulk Validate'}
                    </button>
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
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="table-empty-state">Loading validations...</td>
                                </tr>
                            ) : toValidate.length > 0 ? toValidate.map((row) => (
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
                                            <span className="time">{row.check_in || '--'}</span>
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
                                            <span className="hrs-val">{row.work ? `${row.work}h` : 'Pending'}</span>
                                            <div className="mini-progress"><div className="fill" style={{ width: row.work ? '85%' : '40%' }}></div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-pill-warning">Pending</span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            className="action-btn-success"
                                            onClick={() => handleValidate(row.id)}
                                            disabled={bulkValidating || validatingIds.includes(row.id)}
                                        >
                                            {validatingIds.includes(row.id) ? 'Validating...' : 'Approve'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="table-empty-state">
                                        {validationError || 'No pending validations.'}
                                    </td>
                                </tr>
                            )}
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
                        {onBreak.length > 0 ? onBreak.map((b, i) => (
                            <div key={i} className="break-card">
                                <div className="avatar-sm">{b.avatar}</div>
                                <div className="break-info">
                                    <span className="name">{b.name}</span>
                                    <span className="time">Since {b.break_start_display}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-list-placeholder">No employees currently on break.</div>
                        )}
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
                            {deptOvertime.length > 0 ? deptOvertime.map((d, i) => (
                                <div key={i} className="legend-row">
                                    <span className="dot" style={{ backgroundColor: d.color }}></span>
                                    <span className="label">{d.department}</span>
                                    <span className="value">{d.overtime_hours}h</span>
                                </div>
                            )) : (
                                <div className="empty-list-placeholder">No overtime recorded.</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
