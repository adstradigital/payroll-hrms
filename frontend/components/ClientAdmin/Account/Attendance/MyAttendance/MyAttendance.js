'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, MoreVertical, Plus, ChevronDown, Clock, Calendar, AlertCircle, Loader, Coffee, LogIn, LogOut, History, CheckCircle2 } from 'lucide-react';
import './MyAttendance.css';
import { getMyProfile } from '@/api/api_clientadmin';

export default function MyAttendance() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/my_dashboard/?month=${month}&year=${year}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            } else {
                setError('Failed to fetch attendance dashboard');
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [currentDate]);

    const formatTime = (isoString) => {
        if (!isoString) return '-- : --';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const handleClockIn = async () => {
        if (!dashboardData?.employee?.id) {
            setError('Employee information missing. Cannot clock in.');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-in/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee: dashboardData.employee.id })
            });

            if (response.ok) {
                await fetchDashboard();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to clock in');
            }
        } catch (err) {
            setError('Error clocking in');
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!dashboardData?.employee?.id) {
            setError('Employee information missing. Cannot clock out.');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-out/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee: dashboardData.employee.id })
            });

            if (response.ok) {
                await fetchDashboard();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to clock out');
            }
        } catch (err) {
            setError('Error clocking out');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-attendance">
            <div className="ma-header">
                <div>
                    <h1>My Attendance</h1>
                    <p className="subtitle">Overview for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchDashboard} title="Refresh Data">
                        <Loader size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="wr-month-picker" style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                        <input
                            type="month"
                            className="wr-month-input"
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split('-');
                                setCurrentDate(new Date(y, m - 1));
                            }}
                        />
                    </div>
                </div>
            </div>

            {loading && !dashboardData ? (
                <div className="ma-loading">
                    <Loader size={32} className="animate-spin" />
                    <p>Loading your dashboard...</p>
                </div>
            ) : error ? (
                <div className="ma-error"><AlertCircle /> {error}</div>
            ) : (
                <>
                    {/* Top Stats Row */}
                    <div className="ma-stats">
                        <div className="stat-card validated">
                            <span className="stat-value">{dashboardData?.stats?.present || 0}</span>
                            <span className="stat-label">Present Days</span>
                        </div>
                        <div className="stat-card not-validated">
                            <span className="stat-value">{dashboardData?.stats?.absent || 0}</span>
                            <span className="stat-label">Absent Days</span>
                        </div>
                        <div className="stat-card pending">
                            <span className="stat-value">{dashboardData?.stats?.late || 0}</span>
                            <span className="stat-label">Late Arrivals</span>
                        </div>
                        <div className="stat-card requested">
                            <span className="stat-value">{dashboardData?.stats?.on_leave || 0}</span>
                            <span className="stat-label">Leaves Taken</span>
                        </div>
                        <div className="stat-card approved">
                            <span className="stat-value">{dashboardData?.stats?.total_hours || 0}</span>
                            <span className="stat-label">Total Hours</span>
                        </div>
                    </div>

                    <div className="ma-dashboard-grid">
                        {/* Today's Status Card */}
                        <div className="ma-card today-status-card">
                            <div className="ma-card-header">
                                <h3><Clock size={18} /> Today's Status</h3>
                                <span className={`status-badge ${dashboardData?.today?.status || 'absent'}`}>
                                    {dashboardData?.today?.status?.replace('_', ' ') || 'Not Marked'}
                                </span>
                            </div>

                            <div className="attendance-actions">
                                {!dashboardData?.today?.check_in ? (
                                    <button
                                        className="btn-clock-in"
                                        onClick={handleClockIn}
                                        disabled={loading}
                                    >
                                        <LogIn size={18} /> Clock In
                                    </button>
                                ) : !dashboardData?.today?.check_out ? (
                                    <button
                                        className="btn-clock-out"
                                        onClick={handleClockOut}
                                        disabled={loading}
                                    >
                                        <LogOut size={18} /> Clock Out
                                    </button>
                                ) : (
                                    <div className="attendance-complete">
                                        <CheckCircle2 size={18} /> Shift Completed
                                    </div>
                                )}
                            </div>

                            <div className="today-timings">
                                <div className="timing-block">
                                    <span className="label">Check In</span>
                                    <span className="time-value in">
                                        <LogIn size={16} /> {formatTime(dashboardData?.today?.check_in)}
                                    </span>
                                </div>
                                <div className="timing-block">
                                    <span className="label">Check Out</span>
                                    <span className="time-value out">
                                        <LogOut size={16} /> {formatTime(dashboardData?.today?.check_out)}
                                    </span>
                                </div>
                            </div>
                            <div className="working-hours-display">
                                <span className="label">Working Hours</span>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${Math.min((dashboardData?.today?.working_hours / 9) * 100, 100)}%` }}></div>
                                </div>
                                <span className="wh-val">{dashboardData?.today?.working_hours || 0} Hrs / 9.0 Hrs</span>
                            </div>
                            <div className="avg-stats">
                                <small>Avg Check-in: <strong>{dashboardData?.averages?.check_in}</strong></small>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="ma-card recent-activity-card">
                            <div className="ma-card-header">
                                <h3><History size={18} /> Recent Activity</h3>
                            </div>
                            <div className="recent-list">
                                {dashboardData?.recent_logs?.length === 0 ? (
                                    <p className="no-data-text">No recent activity.</p>
                                ) : (
                                    dashboardData?.recent_logs?.map(log => (
                                        <div className="recent-item" key={log.id}>
                                            <div className="ri-date-box">
                                                <span className="ri-day">{new Date(log.date).getDate()}</span>
                                                <span className="ri-month">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div className="ri-details">
                                                <div className="ri-top">
                                                    <span className={`ri-status ${log.status}`}>{log.status}</span>
                                                    <span className="ri-shift">{log.shift_name}</span>
                                                </div>
                                                <div className="ri-time">
                                                    {formatTime(log.check_in_time)} - {formatTime(log.check_out_time)}
                                                </div>
                                            </div>
                                            <div className="ri-hours">
                                                {log.total_hours}h
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}