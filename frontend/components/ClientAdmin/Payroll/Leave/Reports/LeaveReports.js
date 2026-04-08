'use client';

import { useState, useEffect } from 'react';
import {
    FileText, Download, Filter, Search,
    Calendar, User, Loader2, RefreshCw as RefreshIcon, AlertCircle, ChevronDown, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { getLeaveReports, getAllEmployees, getMyProfile, exportSalaryRegister } from '@/api/api_clientadmin';
import './LeaveReports.css';

export default function LeaveReports() {
    const [activeTab, setActiveTab] = useState('summary'); // summary | history
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        employee: '',
        start_date: '',
        end_date: '',
        year: new Date().getFullYear(),
        company: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (currentUser?.company?.id || currentUser?.company_id) {
            fetchReport();
        }
    }, [activeTab, filters.year, filters.employee, filters.start_date, filters.end_date, currentUser]);

    const fetchInitialData = async () => {
        try {
            const [profRes, empRes] = await Promise.all([
                getMyProfile(),
                getAllEmployees()
            ]);
            
            const userData = profRes.data.employee || profRes.data;
            setCurrentUser(userData);
            setEmployees(empRes.data.results || empRes.data || []);

            // Resolve company ID: User Profile -> localStorage -> profRes
            let companyId = userData.company?.id || userData.company_id || profRes.data.company_id;
            
            // Check localStorage if current profile gives 'system' or is empty (typical for superusers)
            if (!companyId || companyId === 'system') {
                const savedId = localStorage.getItem('selectedCompanyId');
                if (savedId && savedId !== 'system') companyId = savedId;
            }
            
            if (companyId && companyId !== 'system') {
                setFilters(prev => ({ ...prev, company: companyId }));
            }
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                company: filters.company || currentUser?.company_id || currentUser?.company?.id || localStorage.getItem('selectedCompanyId')
            };

            // Safety: Ensure we don't send 'system' as a company UUID to the backend
            if (params.company === 'system' || !params.company) {
                delete params.company;
            }

            // Remove empty keys
            Object.keys(params).forEach(key => (params[key] === null || params[key] === undefined || params[key] === '') && delete params[key]);

            console.log('Fetching report with params:', params);

            let res;
            if (activeTab === 'summary') {
                res = await getLeaveReports({ ...params, type: 'summary' });
            } else {
                res = await getLeaveReports({ ...params, type: 'history' });
            }

            setData(res.data);
            setError(null);
        } catch (err) {
            console.error('Full Axios Error Object:', err);
            if (err.response) {
                console.error('Error Response Data:', err.response.data);
                setError(err.response.data?.error || err.response.data?.detail || 'Failed to fetch report data');
            } else {
                setError(err.message || 'Failed to fetch report data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExportCSV = () => {
        if (!data || data.length === 0) {
            alert('No data to export.');
            return;
        }

        const escapeCsv = (value) => {
            const normalized = value === null || value === undefined ? '' : String(value);
            return `"${normalized.replace(/"/g, '""')}"`;
        };

        let csvRows = [];

        if (activeTab === 'summary') {
            // Summary columns
            csvRows.push(['Employee Name', 'Employee ID', 'Department', 'Leave Type Balances (Used/Total)']);

            data.forEach(row => {
                const leaveDetails = (row.leaves || []).map(l => `${l.type}: ${l.used}/${l.total}`).join(' | ');
                csvRows.push([
                    row.name,
                    row.employee_id,
                    row.department || 'N/A',
                    leaveDetails
                ]);
            });
        } else {
            // History columns
            csvRows.push(['Date', 'Employee Name', 'Leave Type', 'Days', 'Status', 'Reason']);

            data.forEach(row => {
                csvRows.push([
                    row.start_date,
                    row.employee_name,
                    row.leave_type,
                    row.days,
                    row.status,
                    row.reason || ''
                ]);
            });
        }

        const csvContent = csvRows.map(row => row.map(escapeCsv).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leave_${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadSalaryRegister = async () => {
        try {
            setLoading(true);
            const params = {
                company: filters.company || currentUser?.company_id || currentUser?.company?.id
            };
            
            const response = await exportSalaryRegister(params);
            
            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const urlObject = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlObject;
            link.setAttribute('download', `Salary_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(urlObject);
        } catch (err) {
            console.error('Error downloading salary register:', err);
            alert('Failed to download salary register. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return <CheckCircle size={14} />;
            case 'rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="leave-reports-modern">
            {/* Header & Tabs */}
            <div className="reports-header-wrapper">
                <div className="reports-page-title">
                    <div className="title-icon-wrapper">
                        <FileText size={24} className="title-icon" />
                    </div>
                    <div>
                        <h2>Leave Reports</h2>
                        <p>Analyze leave balances and request history</p>
                    </div>
                </div>

                <div className="reports-segmented-tabs">
                    <div
                        className={`segmented-tab ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('summary'); setData([]); }}
                    >
                        Employee Summary
                    </div>
                    <div
                        className={`segmented-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('history'); setData([]); }}
                    >
                        Detailed History
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="reports-filters-glass">
                <div className="filters-grid">
                    {activeTab === 'summary' ? (
                        <div className="filter-group-modern">
                            <label><Calendar size={14} /> Year</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange} className="filter-input-modern">
                                {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div className="filter-group-modern">
                                <label><Calendar size={14} /> From Date</label>
                                <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="filter-input-modern" />
                            </div>
                            <div className="filter-group-modern">
                                <label><Calendar size={14} /> To Date</label>
                                <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="filter-input-modern" />
                            </div>
                        </>
                    )}

                    <div className="filter-group-modern">
                        <label><User size={14} /> Employee</label>
                        <select name="employee" value={filters.employee} onChange={handleFilterChange} className="filter-input-modern">
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filters-actions">
                    <button className="icon-btn-refresh" onClick={fetchReport} disabled={loading} title="Refresh Data">
                        <RefreshIcon size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="icon-btn-download-excel" onClick={handleDownloadSalaryRegister} disabled={loading} title="Latest Payroll Register">
                        <Download size={18} className={loading ? 'animate-pulse' : ''} />
                        <span>Payroll Register</span>
                    </button>
                    <button className="btn-export-csv" onClick={handleExportCSV} disabled={loading || data.length === 0}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Reports Data Table Container */}
            <div className="reports-table-glass">
                {loading ? (
                    <div className="reports-loading-state">
                        <Loader2 size={48} className="animate-spin spinner-modern" />
                        <p>Crunching the numbers...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--danger-color)' }}>
                        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                        <p>{error}</p>
                        <button className="report-btn report-btn--secondary" onClick={fetchReport} style={{ marginTop: '1rem' }}>
                            Try Again
                        </button>
                    </div>
                                ) : data.length === 0 ? (
                    <div className="reports-empty-state">
                        <div className="empty-icon-wrapper">
                            <AlertCircle size={48} />
                        </div>
                        <h3>No Data Found</h3>
                        <p>There are no leave records matching your current filter criteria.</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'summary' ? (
                            <div className="reports-table-container">
                                <table className="report-table-modern">
                                    <thead>
                                        <tr>
                                            <th rowSpan="2">Employee</th>
                                            <th rowSpan="2">Department</th>
                                            {(() => {
                                                const types = new Set();
                                                data.forEach(emp => emp.leaves?.forEach(l => types.add(l.type)));
                                                return Array.from(types).sort().map(type => (
                                                    <th key={type} colSpan="2" className="text-center">{type}</th>
                                                ));
                                            })()}
                                        </tr>
                                        <tr>
                                            {(() => {
                                                const types = new Set();
                                                data.forEach(emp => emp.leaves?.forEach(l => types.add(l.type)));
                                                return Array.from(types).sort().map(type => (
                                                    <React.Fragment key={`${type}-sub`}>
                                                        <th className="text-center sub-head">Used / Total</th>
                                                        <th className="text-center sub-head">Available</th>
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map(emp => (
                                            <tr key={emp.employee_id}>
                                                <td>
                                                    <div className="emp-name-cell">
                                                        <span className="emp-name">{emp.employee_name || emp.name}</span>
                                                        <span className="emp-id">{emp.employee_id}</span>
                                                    </div>
                                                </td>
                                                <td><span className="dept-tag">{emp.department || 'N/A'}</span></td>
                                                {(() => {
                                                    const types = new Set();
                                                    data.forEach(e => e.leaves?.forEach(l => types.add(l.type)));
                                                    return Array.from(types).sort().map(type => {
                                                        const leaf = emp.leaves?.find(l => l.type === type) || { total: 0, used: 0, available: 0, pending: 0 };
                                                        return (
                                                            <React.Fragment key={`${emp.employee_id}-${type}`}>
                                                                <td className="text-center">
                                                                    <div className="balance-cell">
                                                                        <span>{leaf.used} / {leaf.total}</span>
                                                                        {leaf.pending > 0 && <span className="pending-hint">+{leaf.pending} pnd</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <span className={`avail-badge ${leaf.available > 0 ? 'positive' : 'empty'}`}>
                                                                        {leaf.available}
                                                                    </span>
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    });
                                                })()}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="modern-data-table">
                                    <thead>
                                        <tr>
                                            <th>Request Date</th>
                                            <th>Employee</th>
                                            <th>Leave Type</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Reason/Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row) => (
                                            <tr key={row.id}>
                                                <td className="date-cell">{row.start_date}</td>
                                                <td className="emp-primary-info">{row.employee_name}</td>
                                                <td><span className="type-tag">{row.leave_type}</span></td>
                                                <td className="duration-cell">{row.days} Days</td>
                                                <td>
                                                    <div className={`status-badge-modern status-${row.status?.toLowerCase() || 'pending'}`}>
                                                        {getStatusIcon(row.status)}
                                                        {row.status}
                                                    </div>
                                                </td>
                                                <td className="reason-cell">{row.reason || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

import React from 'react';

function RefreshCw({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
