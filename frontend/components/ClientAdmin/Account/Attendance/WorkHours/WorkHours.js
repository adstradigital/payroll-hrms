'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, ChevronRight, Download, Filter, Calendar, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { attendanceApi } from '@/api/attendance_api';
import './WorkHours.css';

export default function WorkHours() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showBreakdown, setShowBreakdown] = useState(null);
    const [calculating, setCalculating] = useState(false);

    const months = [
        { name: "January", value: 1 }, { name: "February", value: 2 }, { name: "March", value: 3 },
        { name: "April", value: 4 }, { name: "May", value: 5 }, { name: "June", value: 6 },
        { name: "July", value: 7 }, { name: "August", value: 8 }, { name: "September", value: 9 },
        { name: "October", value: 10 }, { name: "November", value: 11 }, { name: "December", value: 12 }
    ];

    const years = [2024, 2025, 2026];

    useEffect(() => {
        fetchSummaries();
    }, [selectedMonth, selectedYear]);

    const fetchSummaries = async () => {
        setLoading(true);
        try {
            const response = await attendanceApi.getAttendanceSummaries({
                month: selectedMonth,
                year: selectedYear
            });
            setData(response.data.results || response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch work hours:", err);
            setError("Failed to load work hours data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateAll = async () => {
        setCalculating(true);
        try {
            await Promise.all(
                data.map(item =>
                    attendanceApi.triggerSummaryGeneration({
                        employee: item.employee,
                        month: selectedMonth,
                        year: selectedYear
                    })
                )
            );
            await fetchSummaries();
            alert("Recalculation complete for all listed employees.");
        } catch (err) {
            console.error("Calculation failed:", err);
            alert("Some calculations failed. Please try again.");
        } finally {
            setCalculating(false);
        }
    };

    const filteredData = data.filter(row =>
        row.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
        row.employee_id?.toLowerCase().includes(search.toLowerCase())
    );

    const totals = filteredData.reduce((acc, row) => ({
        worked: acc.worked + parseFloat(row.total_hours_worked || 0),
        pending: acc.pending + (row.is_finalized ? 0 : 1),
        overtime: acc.overtime + parseFloat(row.overtime_hours || 0),
    }), { worked: 0, pending: 0, overtime: 0 });

    if (loading && data.length === 0) {
        return (
            <div className="work-hours-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading summary data...</p>
            </div>
        );
    }

    return (
        <div className="work-hours">
            <div className="wh-header">
                <div className="wh-title-group">
                    <h1>Work Hours <span className="highlight">Analytic</span></h1>
                    <p className="subtitle">Real-time attendance summary for {months.find(m => m.value === selectedMonth)?.name}, {selectedYear}</p>
                </div>

                <div className="wh-tools">
                    <div className="search-box-glass">
                        <Search size={18} />
                        <input
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <select
                            className="select-glass"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                        </select>

                        <select
                            className="select-glass"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <button
                        className="btn-premium calculate"
                        onClick={handleCalculateAll}
                        disabled={calculating}
                    >
                        {calculating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        <span>{calculating ? 'Processing...' : 'Recalculate'}</span>
                    </button>

                    <button className="btn-icon-glass" title="Export report">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="wh-error-alert">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchSummaries}>Retry</button>
                </div>
            )}

            <div className="wh-dashboard">
                <div className="wh-stat-card worked">
                    <div className="icon-wrapper"><Clock size={24} /></div>
                    <div className="info">
                        <div className="label">Total Worked</div>
                        <div className="value">{totals.worked.toFixed(1)}h</div>
                    </div>
                </div>

                <div className="wh-stat-card pending">
                    <div className="icon-wrapper"><Loader2 size={24} /></div>
                    <div className="info">
                        <div className="label">Unfinalized</div>
                        <div className="value">{totals.pending}</div>
                    </div>
                </div>

                <div className="wh-stat-card overtime">
                    <div className="icon-wrapper"><Clock size={24} /></div>
                    <div className="info">
                        <div className="label">Accumulated OT</div>
                        <div className="value">{totals.overtime.toFixed(1)}h</div>
                    </div>
                </div>
            </div>

            <div className="wh-content-glass">
                <table className="wh-premium-table">
                    <thead>
                        <tr>
                            <th>Employee Profile</th>
                            <th><Calendar size={14} /> Period</th>
                            <th>Effective Presence</th>
                            <th>Overtime</th>
                            <th>Percentage</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-state">
                                    No records found for the selected month and search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map(row => (
                                <tr key={row.id} className={showBreakdown === row.id ? "row-active" : ""}>
                                    <td>
                                        <div className="employee-flex">
                                            <div className="avatar-premium">
                                                {row.employee_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="emp-details">
                                                <div className="name">{row.employee_name}</div>
                                                <div className="id">{row.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="period-badge">
                                            {months.find(m => m.value === row.month)?.name?.substring(0, 3)} {row.year}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="presence-calc">
                                            <div className="hours">{row.total_hours_worked}h</div>
                                            <div className="days">{row.present_days}d Worked</div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="ot-value">
                                            {parseFloat(row.overtime_hours) > 0 ? `+${row.overtime_hours}h` : '—'}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="progress-container">
                                            <div className="progress-label">{row.attendance_percentage}%</div>
                                            <div className="progress-bar-bg">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${row.attendance_percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <span className={`status-pill ${row.is_finalized ? 'finalized' : 'draft'}`}>
                                            {row.is_finalized ? 'Finalized' : 'Draft'}
                                        </span>
                                    </td>

                                    <td className="text-right">
                                        <button
                                            className={`wh-action-btn ${showBreakdown === row.id ? 'active' : ''}`}
                                            onClick={() => setShowBreakdown(showBreakdown === row.id ? null : row.id)}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
