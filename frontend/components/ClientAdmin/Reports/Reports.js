'use client';

import { useEffect, useState } from 'react';
import {
    FileText, Download, Filter, Search,
    Calendar, Users, Wallet, Clock,
    ChevronRight, FileSpreadsheet, FilePieChart,
    ArrowUpRight, ArrowDownRight, MoreVertical,
    Loader2, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
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
    const [generatingReport, setGeneratingReport] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [stats, setStats] = useState([
        { label: 'Present Today', value: '0', trend: 'Attendance', icon: Clock, color: 'primary' },
        { label: 'Pending Leaves', value: '0', trend: 'Requests', icon: Calendar, color: 'info' },
        { label: 'Monthly Payroll', value: '₹0', trend: 'Net Paid', icon: Wallet, color: 'success' },
    ]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);

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

            // Prepare Attendance Chart Data
            setAttendanceData([
                { name: 'Present', value: attRes.data.present || 0, color: 'var(--brand-primary)' },
                { name: 'Absent', value: attRes.data.absent || 0, color: 'var(--color-danger)' },
                { name: 'Late', value: attRes.data.late || 0, color: 'var(--color-warning)' },
                { name: 'On Leave', value: attRes.data.on_leave || 0, color: 'var(--color-info)' }
            ]);

            let totalPendingLeaves = 0;
            const leaveTypeCounts = {};

            if (Array.isArray(leaveRes.data)) {
                leaveRes.data.forEach(emp => {
                    if (emp.leaves) {
                        emp.leaves.forEach(l => {
                            totalPendingLeaves += (l.pending || 0);
                            const type = l.type || 'Other';
                            leaveTypeCounts[type] = (leaveTypeCounts[type] || 0) + (l.used || 0);
                        });
                    }
                });
            }

            // Prepare Leave Chart Data
            const leaveChart = Object.keys(leaveTypeCounts).map(type => ({
                name: type,
                value: leaveTypeCounts[type]
            })).sort((a, b) => b.value - a.value).slice(0, 5);
            setLeaveData(leaveChart);

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

    const downloadAsCSV = (data, filename) => {
        if (!data || data.length === 0) {
            setNotification({ show: true, message: 'No data available to export.', type: 'error' });
            return;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row => headers.map(header => {
                const val = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape quotes and wrap in quotes if contains comma
                const escaped = ('' + val).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleGenerate = async (reportId, reportName) => {
        setGeneratingReport(reportId);

        try {
            let exportData = [];
            let filename = reportName.replace(/\s+/g, '_');

            if (reportId === 'salary-register') {
                const res = await getPayrollReports({ type: 'detailed' });
                exportData = res.data.payslips?.map(p => ({
                    Employee: p.employee,
                    ID: p.employee_id,
                    Department: p.department,
                    Designation: p.designation,
                    Basic: p.basic_salary,
                    Gross: p.gross_salary,
                    EPF_Employee: p.pf_deduction,
                    ESI_Employee: p.esi_deduction,
                    TDS: p.tds_deduction,
                    Total_Deductions: p.total_deductions,
                    Net_Salary: p.net_salary,
                    Status: p.status
                })) || [];
            } else if (reportId === 'daily-attendance') {
                const res = await getAttendanceReports({ type: 'detailed' });
                exportData = res.data?.map(att => ({
                    Employee: att.employee_name,
                    ID: att.employee_id,
                    Status: att.status,
                    Check_In: att.check_in,
                    Check_Out: att.check_out,
                    Hours: att.working_hours,
                    Late: att.is_late ? 'Yes' : 'No'
                })) || [];
            } else if (reportId === 'leave-balance') {
                const res = await getLeaveReports({ type: 'summary' });
                exportData = Array.isArray(res.data) ? res.data.map(emp => ({
                    Employee: emp.employee_name,
                    ID: emp.employee_id,
                    Department: emp.department,
                    ...emp.leaves?.reduce((acc, l) => ({
                        ...acc,
                        [`${l.type}_Total`]: l.total,
                        [`${l.type}_Used`]: l.used,
                        [`${l.type}_Pending`]: l.pending,
                        [`${l.type}_Available`]: l.available
                    }), {})
                })) : [];
            } else if (reportId === 'epf-esi') {
                const res = await getPayrollReports({ type: 'statutory' });
                exportData = res.data?.map(s => ({
                    Employee: s.employee_name,
                    ID: s.employee_id,
                    UAN: s.uan,
                    ESI_IP_No: s.esi_no,
                    Gross_Salary: s.gross_salary,
                    PF_Employee: s.pf_employee,
                    PF_Employer: s.pf_employer,
                    ESI_Employee: s.esi_employee,
                    ESI_Employer: s.esi_employer,
                    Total_Contribution: (s.pf_employee + s.pf_employer + s.esi_employee + s.esi_employer).toFixed(2)
                })) || [];
            } else {
                exportData = [{ Report: reportName, Info: 'Detailed export coming soon in backend update.', Timestamp: new Date().toISOString() }];
            }

            if (exportData.length > 0) {
                downloadAsCSV(exportData, filename);
                setNotification({
                    show: true,
                    message: `${reportName} has been downloaded successfully.`,
                    type: 'success'
                });
            } else {
                setNotification({
                    show: true,
                    message: `No data found for ${reportName}.`,
                    type: 'info'
                });
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setNotification({
                show: true,
                message: 'Failed to generate report. Please try again later.',
                type: 'error'
            });
        } finally {
            setGeneratingReport(null);
            setTimeout(() => {
                setNotification({ show: false, message: '', type: '' });
            }, 5000);
        }
    };

    const filteredCategories = reportCategories.map(cat => ({
        ...cat,
        reports: cat.reports.filter(r =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.reports.length > 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="reports-container">
            {/* Success Notification Toast */}
            {notification.show && (
                <div className={`notification-toast ${notification.type} animate-slide-in`}>
                    <div className="toast-content">
                        <FileText size={18} />
                        <span>{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification({ show: false, message: '', type: '' })} className="close-toast">
                        &times;
                    </button>
                </div>
            )}

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

            {/* Visual Insights Section */}
            <div className="reports-insights">
                <div className="insight-card chart-container">
                    <div className="insight-header">
                        <div className="insight-title">
                            <BarChart3 size={18} />
                            <span>Attendance Insights</span>
                        </div>
                    </div>
                    <div className="insight-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {attendanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="insight-card chart-container">
                    <div className="insight-header">
                        <div className="insight-title">
                            <PieIcon size={18} />
                            <span>Leave Distribution</span>
                        </div>
                    </div>
                    <div className="insight-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={leaveData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leaveData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
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
                                <div className="icon-container">
                                    <category.icon size={20} />
                                </div>
                                <h3>{category.name}</h3>
                            </div>
                            <span className="report-count">{category.reports.length} reports</span>
                        </div>

                        <div className="report-cards">
                            {category.reports.map((report) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-card-main">
                                        <div className="report-icon">
                                            <FileSpreadsheet size={20} />
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
                                        <button
                                            className={`generate-btn ${generatingReport === report.id ? 'loading' : ''}`}
                                            onClick={() => handleGenerate(report.id, report.name)}
                                            disabled={generatingReport !== null}
                                        >
                                            {generatingReport === report.id ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <Download size={16} />
                                            )}
                                            <span>{generatingReport === report.id ? 'Generating...' : 'Generate'}</span>
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
