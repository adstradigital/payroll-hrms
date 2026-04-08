'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, Calendar, FileText, Search, AlertCircle, Loader2 } from 'lucide-react';
import { getLeaveReports } from '@/api/api_clientadmin';
import './LeaveReport.css';

export default function LeaveReport() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
    }, []);

    useEffect(() => {
        fetchReport();
    }, [selectedYear]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getLeaveReports({ type: 'summary', year: selectedYear });
            setReportData(response.data || []);
        } catch (err) {
            console.error('Error fetching leave report:', err);
            setError('Failed to load leave summary. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return reportData;
        const lowSearch = searchTerm.toLowerCase();
        return reportData.filter(emp => 
            emp.employee_name.toLowerCase().includes(lowSearch) || 
            emp.employee_id.toLowerCase().includes(lowSearch) ||
            emp.department.toLowerCase().includes(lowSearch)
        );
    }, [reportData, searchTerm]);

    // Calculate overall stats
    const stats = useMemo(() => {
        let totalEmployees = reportData.length;
        let totalLeavesUsed = 0;
        let totalPending = 0;

        reportData.forEach(emp => {
            emp.leaves.forEach(leaf => {
                totalLeavesUsed += leaf.used || 0;
                totalPending += leaf.pending || 0;
            });
        });

        return {
            totalEmployees,
            totalLeavesUsed,
            totalPending
        };
    }, [reportData]);

    // Extract all unique leave types for table columns
    const leaveTypes = useMemo(() => {
        const types = new Set();
        reportData.forEach(emp => {
            emp.leaves.forEach(leaf => {
                if (leaf.type) types.add(leaf.type);
            });
        });
        return Array.from(types).sort();
    }, [reportData]);

    const exportToCSV = () => {
        if (filteredData.length === 0) return;

        // Header
        let csvContent = "Employee ID,Employee Name,Department,";
        leaveTypes.forEach(type => {
            csvContent += `${type} Total,${type} Used,${type} Available,`;
        });
        csvContent += "\n";

        // Rows
        filteredData.forEach(emp => {
            csvContent += `"${emp.employee_id}","${emp.employee_name}","${emp.department}",`;
            leaveTypes.forEach(type => {
                const leaf = emp.leaves.find(l => l.type === type) || {};
                csvContent += `${leaf.total || 0},${leaf.used || 0},${leaf.available || 0},`;
            });
            csvContent += "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `leave_summary_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="leave-report">
            {/* Header / Filters */}
            <div className="report-header">
                <div className="report-header__filters">
                    <div className="filter-group">
                        <label>Year</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="report-select"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="search-box">
                        <Search size={18} className="search-box__icon" />
                        <input 
                            type="text" 
                            placeholder="Search employee or department..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="report-search-input"
                        />
                    </div>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={exportToCSV}
                    disabled={loading || filteredData.length === 0}
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="report-summary">
                <div className="report-card">
                    <FileText size={24} className="report-card__icon" />
                    <div className="report-card__info">
                        <span className="report-card__value">{loading ? '...' : stats.totalEmployees}</span>
                        <span className="report-card__label">Active Employees</span>
                    </div>
                </div>
                <div className="report-card">
                    <Calendar size={24} className="report-card__icon report-card__icon--warning" />
                    <div className="report-card__info">
                        <span className="report-card__value">{loading ? '...' : stats.totalPending}</span>
                        <span className="report-card__label">Pending Requests</span>
                    </div>
                </div>
                <div className="report-card">
                    <AlertCircle size={24} className="report-card__icon report-card__icon--info" />
                    <div className="report-card__info">
                        <span className="report-card__value">{loading ? '...' : stats.totalLeavesUsed}</span>
                        <span className="report-card__label">Total Leaves Used</span>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="report-section">
                <h3 className="report-section__title">Employee Leave Balances - {selectedYear}</h3>
                <div className="report-table-container">
                    {loading ? (
                        <div className="report-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Generating leave summary report...</p>
                        </div>
                    ) : error ? (
                        <div className="report-error">
                            <AlertCircle size={32} />
                            <p>{error}</p>
                            <button onClick={fetchReport} className="btn btn-secondary btn-sm mt-3">Try Again</button>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="report-empty">
                            <p>No leave data found for the selected criteria.</p>
                        </div>
                    ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th rowSpan="2">Employee</th>
                                    <th rowSpan="2">Department</th>
                                    {leaveTypes.map(type => (
                                        <th key={type} colSpan="2" className="text-center">{type}</th>
                                    ))}
                                </tr>
                                <tr>
                                    {leaveTypes.map(type => (
                                        <React.Fragment key={`${type}-head`}>
                                            <th className="text-center sub-head">Used / Total</th>
                                            <th className="text-center sub-head">Available</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(emp => (
                                    <tr key={emp.employee_id}>
                                        <td>
                                            <div className="emp-name-cell">
                                                <span className="emp-name">{emp.employee_name}</span>
                                                <span className="emp-id">{emp.employee_id}</span>
                                            </div>
                                        </td>
                                        <td>{emp.department}</td>
                                        {leaveTypes.map(type => {
                                            const leaf = emp.leaves.find(l => l.type === type) || { total: 0, used: 0, available: 0, pending: 0 };
                                            return (
                                                <React.Fragment key={`${emp.employee_id}-${type}`}>
                                                    <td className="text-center">
                                                        <span className="used-total">
                                                            <span className={leaf.used > 0 ? 'text-warning' : ''}>{leaf.used}</span>
                                                            {" / "}
                                                            <span>{leaf.total}</span>
                                                        </span>
                                                        {leaf.pending > 0 && (
                                                            <div className="pending-badge">+{leaf.pending} pending</div>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`avail-count ${leaf.available > 0 ? 'text-success' : 'text-danger'}`}>
                                                            {leaf.available}
                                                        </span>
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add React fragment support if not globally available in this scope
import React from 'react';
