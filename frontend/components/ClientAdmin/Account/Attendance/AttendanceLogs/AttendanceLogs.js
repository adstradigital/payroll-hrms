'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, Trash2, Plus, GripVertical, ChevronDown, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import './AttendanceLogs.css';

export default function AttendanceLogs() {
    const [logs, setLogs] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            // Corrected endpoint from /attendance/logs/ to /attendance/ with pagination
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/?date=${viewDate}&page=${currentPage}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Handle DRF Paginated Response
                if (data.results) {
                    setLogs(data.results);
                    setTotalCount(data.count || 0);
                } else {
                    setLogs(Array.isArray(data) ? data : []);
                    setTotalCount(Array.isArray(data) ? data.length : 0);
                }
            } else {
                console.error('Failed to fetch attendance logs');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when date changes
    }, [viewDate]);

    useEffect(() => {
        fetchLogs();
    }, [viewDate, currentPage]);

    const toggleSelectAll = () => {
        if (selectedItems.length === logs.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(logs.map(item => item.id));
        }
    };

    const toggleItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    const formatTime = (dateTimeStr) => {
        if (!dateTimeStr) return '-';
        try {
            return new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '-';
        }
    };

    const getLateStyle = (mins) => {
        if (!mins || mins <= 0) return {};
        if (mins > 30) return { color: '#ef4444', fontWeight: '700' }; // Hard late
        return { color: '#f97316', fontWeight: '600' }; // Grace period or slight late
    };

    const getEarlyStyle = (mins) => {
        if (!mins || mins <= 0) return {};
        return { color: '#f59e0b', fontWeight: '600' };
    };

    return (
        <div className="attendance-logs-section">
            <div className="aa-header">
                <div>
                    <h2 className="aa-title">Attendance Logs</h2>
                    <p className="lea-subtitle">Daily punch records and timings</p>
                </div>

                <div className="aa-toolbar">
                    <div className="wr-month-picker" style={{ padding: '0.4rem 0.8rem' }}>
                        <input
                            type="date"
                            className="wr-month-input"
                            value={viewDate}
                            onChange={(e) => setViewDate(e.target.value)}
                        />
                    </div>

                    <button className="aa-tool-btn" onClick={fetchLogs}><RefreshCw size={16} /></button>

                    <div className="aa-search-wrapper">
                        <Search size={16} className="aa-search-icon" />
                        <input type="text" placeholder="Search Employee" className="aa-search-input" />
                    </div>
                </div>
            </div>

            <div className="aa-selection-bar">
                <button className="select-all-btn" onClick={toggleSelectAll}>
                    {selectedItems.length > 0 ? `Deselect All (${selectedItems.length})` : 'Select All Attendance'}
                </button>
                {selectedItems.length > 0 && (
                    <button className="aa-tool-btn text-red-500 hover:bg-red-50"><Trash2 size={16} /> Delete Selected</button>
                )}
            </div>

            <div className="aa-table-container">
                <table className="aa-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    className="checkbox-custom"
                                    checked={selectedItems.length === logs.length && logs.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th><div className="aa-th-content"><GripVertical size={14} /> Employee</div></th>
                            <th><div className="aa-th-content"><GripVertical size={14} /> Date</div></th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Late (Min)</th>
                            <th>Early (Min)</th>
                            <th>Shift</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10} className="text-center p-4">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={10} className="text-center p-4">No attendance logs found for this date</td></tr>
                        ) : (
                            logs.map(row => (
                                <tr key={row.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox-custom"
                                            checked={selectedItems.includes(row.id)}
                                            onChange={() => toggleItem(row.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="aa-emp-cell">
                                            <div className="aa-avatar">{row.employee_name ? row.employee_name.charAt(0) : '?'}</div>
                                            <div className="aa-emp-details">
                                                <span className="aa-emp-name">{row.employee_name}</span>
                                                <span className="aa-emp-id">({row.employee_id})</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{formatDate(row.date)}</td>
                                    <td className="font-medium text-green-600">{formatTime(row.check_in_time)}</td>
                                    <td className="font-medium text-red-500">{formatTime(row.check_out_time)}</td>
                                    <td style={getLateStyle(row.late_by_minutes)}>
                                        {row.late_by_minutes > 0 ? `${row.late_by_minutes}m` : '-'}
                                    </td>
                                    <td style={getEarlyStyle(row.early_departure_minutes)}>
                                        {row.early_departure_minutes > 0 ? `${row.early_departure_minutes}m` : '-'}
                                    </td>
                                    <td>{row.shift_name || '-'}</td>
                                    <td>
                                        <span className={`status-badge-log ${row.status}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="aa-delete-btn"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
                <div className="aa-pagination-bar">
                    <div className="aa-pagination-info">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
                    </div>
                    <div className="aa-pagination-btns">
                        <button 
                            className="aa-page-btn" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Previous
                        </button>
                        <span className="aa-page-num">Page {currentPage}</span>
                        <button 
                            className="aa-page-btn" 
                            disabled={currentPage * pageSize >= totalCount}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <button className="aa-fab">
                <Plus size={28} />
            </button>
        </div>
    );
}
