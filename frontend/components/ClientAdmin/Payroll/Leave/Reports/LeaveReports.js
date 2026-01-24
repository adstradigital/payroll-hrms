'use client';

import { useState, useEffect } from 'react';
import {
    FileText, Download, Filter, Search,
    Calendar, User, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';
import { getLeaveReports, getAllEmployees, getMyProfile } from '@/api/api_clientadmin';
import './LeaveReports.css';

export default function LeaveReports() {
    const [activeTab, setActiveTab] = useState('summary'); // summary | history
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

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
        if (currentUser?.company?.id) {
            fetchReport();
        }
    }, [activeTab, filters.year, filters.employee, filters.start_date, filters.end_date, currentUser]);

    const fetchInitialData = async () => {
        try {
            const [profRes, empRes] = await Promise.all([
                getMyProfile(),
                getAllEmployees()
            ]);
            setCurrentUser(profRes.data.employee || profRes.data);
            setEmployees(empRes.data.results || empRes.data || []);
            setFilters(prev => ({ ...prev, company: profRes.data.company_id }));
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                company: currentUser?.company_id || currentUser?.company?.id
            };

            // Clean empty params
            Object.keys(params).forEach(key => !params[key] && delete params[key]);

            // Determine endpoint based on tab
            let res;
            if (activeTab === 'summary') {
                // We'll need to manually call the 'summary' action if getLeaveReports is just a base
                // Assuming api_clientadmin has a flexible way but here I'll use a specific logic if needed
                // Based on previous step, I added summary and history actions
                res = await getLeaveReports({ ...params, type: 'summary' });
                // Note: api_clientadmin might need to be adjusted or use raw axios if it doesn't support actions
            } else {
                res = await getLeaveReports({ ...params, type: 'history' });
            }

            setData(res.data);
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = (format) => {
        // Implement export logic (CSV/PDF)
        alert(`Exporting as ${format}... (Functionality to be linked with backend)`);
    };

    return (
        <div className="leave-reports">
            {/* Tabs */}
            <div className="reports-tabs">
                <div
                    className={`reports-tab ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('summary'); setData([]); }}
                >
                    Employee Summary
                </div>
                <div
                    className={`reports-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('history'); setData([]); }}
                >
                    Detailed History
                </div>
            </div>

            {/* Actions */}
            <div className="report-actions">
                <button className="btn btn-secondary" onClick={() => handleExport('CSV')}>
                    <Download size={16} /> Export CSV
                </button>
                <button className="btn btn-primary" onClick={() => handleExport('PDF')}>
                    <FileText size={16} /> Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="reports-filters">
                {activeTab === 'summary' ? (
                    <div className="filter-group">
                        <label>Year</label>
                        <select name="year" value={filters.year} onChange={handleFilterChange} className="filter-input">
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                ) : (
                    <>
                        <div className="filter-group">
                            <label>From Date</label>
                            <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="filter-input" />
                        </div>
                        <div className="filter-group">
                            <label>To Date</label>
                            <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="filter-input" />
                        </div>
                    </>
                )}

                <div className="filter-group">
                    <label>Employee</label>
                    <select name="employee" value={filters.employee} onChange={handleFilterChange} className="filter-input">
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                        ))}
                    </select>
                </div>

                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={fetchReport}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Data Table */}
            <div className="report-table-container">
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 size={40} className="animate-spin" />
                        <p>Generating report...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No records found for the selected criteria.</p>
                    </div>
                ) : (
                    <table className="report-table">
                        <thead>
                            {activeTab === 'summary' ? (
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Leave Type Balances (Used / Total)</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Date</th>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Reason</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {activeTab === 'summary' ? (
                                data.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{row.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.employee_id}</div>
                                        </td>
                                        <td>{row.department}</td>
                                        <td>
                                            {row.leaves && row.leaves.map((l, i) => (
                                                <span key={i} className="leave-type-pill">
                                                    {l.type}: {l.used}/{l.allocated}
                                                </span>
                                            ))}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                data.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.start_date}</td>
                                        <td>{row.employee_name}</td>
                                        <td>{row.leave_type}</td>
                                        <td>{row.days}</td>
                                        <td>
                                            <span className={`badge badge-${row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '200px', fontSize: '0.75rem' }}>{row.reason}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Helper icons
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
