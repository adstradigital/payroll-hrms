'use client';

import { useState, useEffect } from 'react';
import {
    Loader,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar as CalendarIcon,
    History,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import attendanceApi from '@/api/attendance_api';
import './BasicAttendance.css';

export default function BasicAttendance({ employeeId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = {
                employee_id: employeeId,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            };

            const response = await attendanceApi.getMyDashboard(params);

            if (response.data) {
                setData(response.data);
            }
        } catch (err) {
            console.error('Error fetching basic attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (employeeId) {
            fetchAttendance();
        }
    }, [employeeId, currentDate]);

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
        setCurrentPage(1); // Reset pagination on month change
    };

    if (loading && !data) {
        return (
            <div className="basic-attendance-loading">
                <Loader className="animate-spin" size={32} />
                <p>Loading attendance data...</p>
            </div>
        );
    }

    if (!data) return <div className="basic-attendance-error">Failed to load attendance records.</div>;

    const stats = data.stats || {};
    const logs = data.recent_logs || [];

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = logs.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(logs.length / recordsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="basic-attendance">
            {/* Stats Overview */}
            <div className="ba-stats-grid">
                <div className="ba-stat-card success">
                    <div className="ba-stat-icon"><CheckCircle2 size={20} /></div>
                    <div className="ba-stat-info">
                        <span className="ba-stat-value">{stats.present || 0}</span>
                        <span className="ba-stat-label">Present</span>
                    </div>
                </div>
                <div className="ba-stat-card danger">
                    <div className="ba-stat-icon"><AlertCircle size={20} /></div>
                    <div className="ba-stat-info">
                        <span className="ba-stat-value">{stats.absent || 0}</span>
                        <span className="ba-stat-label">Absent</span>
                    </div>
                </div>
                <div className="ba-stat-card warning">
                    <div className="ba-stat-icon"><Clock size={20} /></div>
                    <div className="ba-stat-info">
                        <span className="ba-stat-value">{stats.late || 0}</span>
                        <span className="ba-stat-label">Late</span>
                    </div>
                </div>
                <div className="ba-stat-card primary">
                    <div className="ba-stat-icon"><CalendarIcon size={20} /></div>
                    <div className="ba-stat-info">
                        <span className="ba-stat-value">{stats.on_leave || 0}</span>
                        <span className="ba-stat-label">Leave</span>
                    </div>
                </div>
            </div>

            {/* Attendance Log Table */}
            <div className="ba-log-card">
                <div className="ba-log-header">
                    <div className="ba-log-title">
                        <History size={18} />
                        <span>Attendance History</span>
                    </div>
                    <div className="ba-month-selector">
                        <button onClick={() => changeMonth(-1)} className="ba-month-btn"><ChevronLeft size={16} /></button>
                        <span className="ba-current-month">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="ba-month-btn"><ChevronRight size={16} /></button>
                    </div>
                </div>

                <div className="ba-table-container">
                    <table className="ba-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length > 0 ? currentRecords.map((log, idx) => (
                                <tr key={log.id || idx}>
                                    <td>{new Date(log.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td>
                                        <span className={`ba-badge ba-badge-${log.status?.toLowerCase()}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="font-mono">{log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td className="font-mono">{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td className="ba-hours">{log.total_hours || '0.00'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="ba-no-data">No records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="ba-pagination">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="ba-page-btn"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="ba-page-info">
                            Page <span>{currentPage}</span> of {totalPages}
                        </div>

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="ba-page-btn"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
