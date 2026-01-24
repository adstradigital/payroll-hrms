'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, Trash2, Plus, GripVertical, ChevronDown, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import './AttendanceLogs.css';

export default function AttendanceLogs() {
    const [logs, setLogs] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/logs/?date=${viewDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.results || []);
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
        fetchLogs();
    }, [viewDate]);

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
        return new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                            <th>Shift (Assigned)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center p-4">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={8} className="text-center p-4">No attendance logs found for this date</td></tr>
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

            <button className="aa-fab">
                <Plus size={28} />
            </button>
        </div>
    );
}
