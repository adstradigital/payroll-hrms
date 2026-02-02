'use client';

import { useEffect, useState } from 'react';
import {
    FileText, Download, Filter, Search,
    Calendar, Users, Wallet, Clock,
    ChevronRight, FileSpreadsheet, FilePieChart,
    ArrowUpRight, ArrowDownRight, MoreVertical,
    Loader2
} from 'lucide-react';
import { getAttendanceReports, getPayrollReports, getLeaveReports } from '@/api/api_clientadmin';
import './Reports.css';

const reportCategories = [
    {
        id: 'payroll',
        name: 'Payroll Reports',
        icon: Wallet,
        reports: [
            { id: 'salary-register', name: 'Salary Register', description: 'Comprehensive monthly salary statement for all employees' },
            { id: 'epf-esi', name: 'EPF & ESI Statements', description: 'Statutory compliance reports for EPF and ESI contributions' },
            { id: 'tds-summary', name: 'TDS Summary', description: 'Income tax deductions for the current financial year' },
            { id: 'bonus-report', name: 'Bonus & Incentives', description: 'Annual and performance-based bonus distribution' }
        ]
    },
    {
        id: 'attendance',
        name: 'Attendance Reports',
        icon: Clock,
        reports: [
            { id: 'daily-attendance', name: 'Daily Attendance Report', description: 'Real-time check-in and check-out status of employees' },
            { id: 'monthly-summary', name: 'Monthly Attendance Summary', description: 'Overview of present, absent, and late marks' },
            { id: 'overtime-report', name: 'Overtime Analysis', description: 'Detailed report on extra hours worked by employees' },
            { id: 'shift-roster', name: 'Shift Wise Roster', description: 'Employee distribution across different work shifts' }
        ]
    },
    {
        id: 'leave',
        name: 'Leave Reports',
        icon: Calendar,
        reports: [
            { id: 'leave-balance', name: 'Leave Balance Statement', description: 'Current leave balances for all active employees' },
            { id: 'leave-utilization', name: 'Leave Utilization Rate', description: 'Department-wise leave trends and patterns' },
            { id: 'holiday-calendar', name: 'Annual Holiday List', description: 'Company-wide holidays for the current calendar year' }
        ]
    },
    {
        id: 'employees',
        name: 'Employee Reports',
        icon: Users,
        reports: [
            { id: 'employee-master', name: 'Employee Master List', description: 'Detailed demographic and professional info of employees' },
            { id: 'joining-attrition', name: 'Joining & Attrition', description: 'Monthly analysis of new hires and exits' },
            { id: 'anniversaries', name: 'Birthdays & Work Anniversaries', description: 'Upcoming employee events for the month' }
        ]
    }
];

export default function Reports() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Present Today', value: '0', trend: 'Attendance', icon: Clock, color: 'primary' },
        { label: 'Pending Leaves', value: '0', trend: 'Requests', icon: Calendar, color: 'info' },
        { label: 'Monthly Payroll', value: '₹0', trend: 'Net Paid', icon: Wallet, color: 'success' },
    ]);

    useEffect(() => {
        fetchReportStats();
    }, []);

    const fetchReportStats = async () => {
        setLoading(true);
        try {
            const [attRes, leaveRes, payrollRes] = await Promise.all([
                getAttendanceReports({ type: 'summary' }),
                getLeaveReports({ type: 'summary' }),
                getPayrollReports({ type: 'summary' })
            ]);

            let totalPendingLeaves = 0;
            if (Array.isArray(leaveRes.data)) {
                leaveRes.data.forEach(emp => {
                    if (emp.leaves) {
                        emp.leaves.forEach(l => {
                            totalPendingLeaves += (l.pending || 0);
                        });
                    }
                });
            }

            const payrollVal = payrollRes.data.total_net || 0;
            const payrollDisplay = payrollVal >= 100000
                ? `₹${(payrollVal / 100000).toFixed(1)}L`
                : `₹${(payrollVal / 1000).toFixed(1)}K`;

            setStats([
                { label: 'Present Today', value: attRes.data.present || 0, trend: 'Attendance', icon: Clock, color: 'primary' },
                { label: 'Pending Leaves', value: totalPendingLeaves, trend: 'Requests', icon: Calendar, color: 'info' },
                { label: 'Monthly Payroll', value: payrollDisplay, trend: 'Net Paid', icon: Wallet, color: 'success' },
            ]);
        } catch (err) {
            console.error('Failed to fetch report stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = reportCategories.map(cat => ({
        ...cat,
        reports: cat.reports.filter(r =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.reports.length > 0);

    return (
        <div className="reports-container">
            {/* Reports Header Stats */}
            <div className="reports-stats">
                {stats.map((stat, idx) => (
                    <div key={idx} className="report-stat-card">
                        <div className={`stat-icon-wrapper ${stat.color}`}>
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <stat.icon size={24} />}
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-value-group">
                                <span className="stat-value">{loading ? '...' : stat.value}</span>
                                <span className="stat-trend">
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports Controls */}
            <div className="reports-controls">
                <div className="reports-tabs">
                    <button
                        className={`report-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Reports
                    </button>
                    <button
                        className={`report-tab ${activeTab === 'recent' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recent')}
                    >
                        Recently Used
                    </button>
                    <button
                        className={`report-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scheduled')}
                    >
                        Scheduled
                    </button>
                </div>

                <div className="reports-actions">
                    <div className="report-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Find a report..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="filter-btn">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="reports-grid">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="report-category-section">
                        <div className="category-header">
                            <div className="category-title">
                                <category.icon size={20} />
                                <h3>{category.name}</h3>
                            </div>
                            <span className="report-count">{category.reports.length} reports</span>
                        </div>

                        <div className="report-cards">
                            {category.reports.map((report) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-card-main">
                                        <div className="report-icon">
                                            <FilePieChart size={20} />
                                        </div>
                                        <div className="report-info">
                                            <h4>{report.name}</h4>
                                            <p>{report.description}</p>
                                        </div>
                                    </div>
                                    <div className="report-card-footer">
                                        <div className="report-formats">
                                            <span className="format-badge">PDF</span>
                                            <span className="format-badge">EXCEL</span>
                                            <span className="format-badge">CSV</span>
                                        </div>
                                        <button className="generate-btn">
                                            <Download size={16} />
                                            <span>Generate</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && (
                <div className="reports-empty">
                    <div className="empty-icon">
                        <FileText size={48} />
                    </div>
                    <h3>No reports found</h3>
                    <p>Try searching with different keywords or check back later.</p>
                </div>
            )}
        </div>
    );
}
