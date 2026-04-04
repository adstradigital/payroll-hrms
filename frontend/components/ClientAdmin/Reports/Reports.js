'use client';

import { useEffect, useState } from 'react';
import {
    FileText, Download, Filter, Search,
    Calendar, Users, Wallet, Clock,
    ChevronRight, FileSpreadsheet, FilePieChart,
    ArrowUpRight, ArrowDownRight, MoreVertical,
    Loader2, PieChart as PieIcon, BarChart3, TrendingUp
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import {
    getAttendanceReports, getPayrollReports, getLeaveReports,
    exportEPFECR, exportESIChallan,
    exportSalaryRegister, exportPayrollSummary,
    getSalaryRegisterData, getPayrollSummaryData
} from '@/api/api_clientadmin';
import StatutoryReportPreview from './StatutoryReportPreview';
import PayrollReportPreview from './PayrollReportPreview';
import './Reports.css';

const reportCategories = [
    {
        id: 'payroll',
        name: 'Payroll Reports',
        icon: Wallet,
        reports: [
            { id: 'salary-register', name: 'Salary Register', description: 'Comprehensive monthly salary statement with all components', canView: true, canDownload: true },
            { id: 'payroll-summary', name: 'Payroll Summary', description: 'High-level cost analysis grouped by department', canView: true, canDownload: true },
            { id: 'epf-esi', name: 'EPF & ESI Statements', description: 'Statutory compliance reports for EPF and ESI contributions', canView: true, canDownload: true },
            { id: 'tds-summary', name: 'TDS Summary', description: 'Income tax deductions for the current financial year', canView: true, canDownload: true },
            { id: 'bonus-report', name: 'Bonus & Incentives', description: 'Annual and performance-based bonus distribution', canView: true, canDownload: true }
        ]
    },
    {
        id: 'attendance',
        name: 'Attendance Reports',
        icon: Clock,
        reports: [
            { id: 'daily-attendance', name: 'Daily Attendance Report', description: 'Real-time check-in and check-out status of employees', canView: true, canDownload: true },
            { id: 'monthly-summary', name: 'Monthly Attendance Summary', description: 'Overview of present, absent, and late marks', canView: true, canDownload: true },
            { id: 'overtime-report', name: 'Overtime Analysis', description: 'Detailed report on extra hours worked by employees', canView: true, canDownload: true },
            { id: 'shift-roster', name: 'Shift Wise Roster', description: 'Employee distribution across different work shifts', canView: false, canDownload: false }
        ]
    },
    {
        id: 'leave',
        name: 'Leave Reports',
        icon: Calendar,
        reports: [
            { id: 'leave-balance', name: 'Leave Balance Statement', description: 'Current leave balances for all active employees', canView: true, canDownload: true },
            { id: 'leave-utilization', name: 'Leave Utilization Rate', description: 'Department-wise leave trends and patterns', canView: false, canDownload: false },
            { id: 'holiday-calendar', name: 'Annual Holiday List', description: 'Company-wide holidays for the current calendar year', canView: false, canDownload: false }
        ]
    },
    {
        id: 'employees',
        name: 'Employee Reports',
        icon: Users,
        reports: [
            { id: 'employee-master', name: 'Employee Master List', description: 'Detailed demographic and professional info of employees', canView: false, canDownload: false },
            { id: 'joining-attrition', name: 'Joining & Attrition', description: 'Monthly analysis of new hires and exits', canView: false, canDownload: false },
            { id: 'anniversaries', name: 'Birthdays & Work Anniversaries', description: 'Upcoming employee events for the month', canView: false, canDownload: false }
        ]
    }
];

export default function Reports() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewReportName, setPreviewReportName] = useState('');
    const [previewReportId, setPreviewReportId] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [stats, setStats] = useState([
        { label: 'Present Today', value: '0', trend: 'Attendance', icon: Clock, color: 'primary' },
        { label: 'Pending Leaves', value: '0', trend: 'Requests', icon: Calendar, color: 'info' },
        { label: 'Monthly Payroll', value: '₹0', trend: 'Net Paid', icon: Wallet, color: 'success' },
    ]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [payrollDistData, setPayrollDistData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const formatINR = (value) => {
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(value || 0);
        } catch {
            return `₹${value || 0}`;
        }
    };

    const renderMiniTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="analytics-tooltip">
                <div className="tooltip-title">{label}</div>
                {payload.map((item, idx) => (
                    <div key={idx} className="tooltip-row">
                        <span className="dot" style={{ background: item.color }} />
                        <span className="name">{item.name}</span>
                        <span className="value">{typeof item.value === 'number' ? item.value : 0}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderCurrencyTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="analytics-tooltip">
                <div className="tooltip-title">{label}</div>
                {payload.map((item, idx) => (
                    <div key={idx} className="tooltip-row">
                        <span className="dot" style={{ background: item.color }} />
                        <span className="name">{item.name}</span>
                        <span className="value">{formatINR(item.value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    useEffect(() => {
        fetchReportStats();
    }, [selectedMonth, selectedYear]);

    const fetchReportStats = async () => {
        setLoading(true);
        try {
            const params = { month: selectedMonth, year: selectedYear };
            const [attRes, leaveRes, payrollRes, payrollDistRes] = await Promise.all([
                getAttendanceReports({ type: 'summary', ...params }),
                getLeaveReports({ type: 'summary', ...params }),
                getPayrollReports({ type: 'summary', ...params }),
                getPayrollSummaryData(params)
            ]);

            // Prepare Attendance Chart Data
            const attendanceSummary = attRes.data || {};
            setAttendanceData([
                { name: 'Present', value: attendanceSummary.present || 0, color: '#10b981' },
                { name: 'Absent', value: attendanceSummary.absent || 0, color: '#ef4444' },
                { name: 'Late', value: attendanceSummary.late || 0, color: '#f59e0b' },
                { name: 'On Leave', value: attendanceSummary.on_leave || 0, color: '#6366f1' }
            ]);

            // Payroll Net Calculation
            const payrollSummary = payrollRes.data || {};
            const totalNet = payrollSummary.total_net_pay || 0;
            const payrollDisplay = new Intl.NumberFormat('en-IN', {
                style: 'currency', currency: 'INR', maximumFractionDigits: 0
            }).format(totalNet);

            const totalPendingLeaves = leaveRes.data ? (leaveRes.data.pending || 0) : 0;

            setStats([
                { label: 'Present Today', value: attendanceSummary.present || '0', trend: 'Headcount', icon: Clock, color: 'primary' },
                { label: 'Pending Leaves', value: totalPendingLeaves, trend: 'Requests', icon: Calendar, color: 'info' },
                { label: 'Monthly Payroll', value: payrollDisplay, trend: 'Net Paid', icon: Wallet, color: 'success' },
            ]);

            // Payroll Distribution Chart
            if (Array.isArray(payrollDistRes.data)) {
                setPayrollDistData(payrollDistRes.data.map(d => ({
                    name: d.department,
                    gross: d.gross,
                    net: d.net
                })));
            }
        } catch (err) {
            console.error('Failed to fetch report stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async (reportId, reportName) => {
        setGeneratingReport(reportId);
        try {
            const params = { month: selectedMonth, year: selectedYear };
            let response;
            let filename = `${reportName.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.xlsx`;

            if (reportId === 'salary-register') {
                response = await exportSalaryRegister(params);
            } else if (reportId === 'payroll-summary') {
                response = await exportPayrollSummary(params);
            } else if (reportId === 'epf-esi') {
                const [epfRes, esiRes] = await Promise.all([
                    exportEPFECR(params),
                    exportESIChallan(params)
                ]);

                const epfUrl = window.URL.createObjectURL(new Blob([epfRes.data]));
                const epfLink = document.createElement('a');
                epfLink.href = epfUrl;
                epfLink.setAttribute('download', `EPF_ECR_${selectedMonth}_${selectedYear}.txt`);
                document.body.appendChild(epfLink);
                epfLink.click();
                epfLink.remove();

                const esiUrl = window.URL.createObjectURL(new Blob([esiRes.data]));
                const esiLink = document.createElement('a');
                esiLink.href = esiUrl;
                esiLink.setAttribute('download', `ESI_Challan_${selectedMonth}_${selectedYear}.xlsx`);
                document.body.appendChild(esiLink);
                esiLink.click();
                esiLink.remove();

                setNotification({ show: true, message: 'EPF & ESI files downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'daily-attendance') {
                const res = await getAttendanceReports({ type: 'detailed', ...params });
                downloadCSV(res.data, `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'monthly-summary') {
                const res = await getAttendanceReports({ type: 'summary', ...params });
                downloadCSV([res.data], `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'overtime-report') {
                const res = await getAttendanceReports({ type: 'overtime', ...params });
                downloadCSV(res.data, `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'tds-summary') {
                const res = await getPayrollReports({ type: 'tds_summary', ...params });
                downloadCSV(res.data, `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'bonus-report') {
                const res = await getPayrollReports({ type: 'bonus_report', ...params });
                downloadCSV(res.data, `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else if (reportId === 'leave-balance') {
                const res = await getLeaveReports({ type: 'summary', ...params });
                const flatData = res.data.map(emp => ({
                    Employee: emp.employee_name,
                    ID: emp.employee_id,
                    Department: emp.department,
                    ...emp.leaves.reduce((acc, l) => ({ ...acc, [l.type]: `${l.used}/${l.total}` }), {})
                }));
                downloadCSV(flatData, `${reportName}_${selectedMonth}_${selectedYear}.csv`);
                setNotification({ show: true, message: 'Report downloaded successfully', type: 'success' });
                return;
            } else {
                setNotification({ show: true, message: 'Export coming soon for this specific format.', type: 'info' });
                return;
            }

            if (response && response.data) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                setNotification({
                    show: true,
                    message: `${reportName} has been downloaded successfully.`,
                    type: 'success'
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

    const handleViewReport = async (reportId, reportName) => {
        setGeneratingReport(reportId);
        try {
            if (reportId === 'epf-esi') {
                const res = await getPayrollReports({ type: 'statutory', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No data found for this report.', type: 'info' });
                }
            } else if (reportId === 'salary-register') {
                const res = await getSalaryRegisterData({ month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No salary data found for this period.', type: 'info' });
                }
            } else if (reportId === 'payroll-summary') {
                const res = await getPayrollSummaryData({ month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No summary data found for this period.', type: 'info' });
                }
            } else if (reportId === 'daily-attendance') {
                const res = await getAttendanceReports({ type: 'detailed', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No attendance data found.', type: 'info' });
                }
            } else if (reportId === 'monthly-summary') {
                const res = await getAttendanceReports({ type: 'summary', month: selectedMonth, year: selectedYear });
                if (res.data) {
                    setPreviewData([res.data]);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                }
            } else if (reportId === 'overtime-report') {
                const res = await getAttendanceReports({ type: 'overtime', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No overtime data found.', type: 'info' });
                }
            } else if (reportId === 'tds-summary') {
                const res = await getPayrollReports({ type: 'tds_summary', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No TDS data found.', type: 'info' });
                }
            } else if (reportId === 'bonus-report') {
                const res = await getPayrollReports({ type: 'bonus_report', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    setPreviewData(res.data);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No bonus/incentive data found.', type: 'info' });
                }
            } else if (reportId === 'leave-balance') {
                const res = await getLeaveReports({ type: 'summary', month: selectedMonth, year: selectedYear });
                if (res.data && res.data.length > 0) {
                    const flatData = res.data.map(emp => ({
                        Employee: emp.employee_name,
                        ID: emp.employee_id,
                        Department: emp.department,
                        ...emp.leaves.reduce((acc, l) => ({ ...acc, [l.type]: `${l.used}/${l.total}` }), {})
                    }));
                    setPreviewData(flatData);
                    setPreviewReportName(reportName);
                    setPreviewReportId(reportId);
                } else {
                    setNotification({ show: true, message: 'No leave data found.', type: 'info' });
                }
            } else {
                setNotification({ show: true, message: 'Preview not available for this report yet.', type: 'info' });
            }
        } catch (err) {
            console.error('Failed to fetch report preview:', err);
            setNotification({ show: true, message: 'Failed to load report preview.', type: 'error' });
        } finally {
            setGeneratingReport(null);
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
                            <BarChart data={attendanceData} barSize={42}>
                                <defs>
                                    <linearGradient id="att-present" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#16a34a" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.75} />
                                    </linearGradient>
                                    <linearGradient id="att-absent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.75} />
                                    </linearGradient>
                                    <linearGradient id="att-late" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.75} />
                                    </linearGradient>
                                    <linearGradient id="att-leave" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.75} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="rgba(15,23,42,0.08)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip content={renderMiniTooltip} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
                                <Bar dataKey="value" radius={[10, 10, 4, 4]}>
                                    {attendanceData.map((entry, index) => {
                                        const gradient = entry.name === 'Present'
                                            ? 'url(#att-present)'
                                            : entry.name === 'Absent'
                                                ? 'url(#att-absent)'
                                                : entry.name === 'Late'
                                                    ? 'url(#att-late)'
                                                    : 'url(#att-leave)';
                                        return <Cell key={`cell-${index}`} fill={gradient} />;
                                    })}
                                    <LabelList dataKey="value" position="top" fill="#0f172a" fontSize={12} fontWeight={600} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="insight-card chart-container">
                    <div className="insight-header">
                        <div className="insight-title">
                            <TrendingUp size={18} />
                            <span>Department-wise Cost Breakdown</span>
                        </div>
                    </div>
                    <div className="insight-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={payrollDistData} barSize={24}>
                                <defs>
                                    <linearGradient id="pay-gross" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.75} />
                                    </linearGradient>
                                    <linearGradient id="pay-net" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                                        <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.75} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="rgba(15,23,42,0.08)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    tickFormatter={(value) => (value >= 100000 ? `${Math.round(value / 1000)}k` : value)}
                                />
                                <Tooltip content={renderCurrencyTooltip} />
                                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} iconType="circle" />
                                <Bar dataKey="gross" fill="url(#pay-gross)" name="Gross Pay" radius={[8, 8, 4, 4]}>
                                    <LabelList dataKey="gross" position="top" fill="#1f2937" fontSize={10} formatter={formatINR} />
                                </Bar>
                                <Bar dataKey="net" fill="url(#pay-net)" name="Net Pay" radius={[8, 8, 4, 4]}>
                                    <LabelList dataKey="net" position="top" fill="#1f2937" fontSize={10} formatter={formatINR} />
                                </Bar>
                            </BarChart>
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
                        onClick={() => setActiveTab('all')} // Simplified for now
                    >
                        Recently Used
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
                    <div className="report-date-selector">
                        <Calendar size={18} />
                        <input
                            type="month"
                            value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split('-');
                                setSelectedYear(parseInt(y));
                                setSelectedMonth(parseInt(m));
                            }}
                        />
                    </div>
                    <button className="filter-btn" onClick={fetchReportStats}>
                        <Filter size={18} />
                        <span>Refresh</span>
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
                                        <span className="format-badge">EXCEL</span>
                                        <span className="format-badge">CSV</span>
                                    </div>
                                    <div className="report-card-actions">
                                        {report.canView && (
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewReport(report.id, report.name)}
                                                disabled={generatingReport !== null}
                                            >
                                                View
                                            </button>
                                        )}
                                        {report.canDownload ? (
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
                                                <span>{generatingReport === report.id ? 'Generating...' : 'Download'}</span>
                                            </button>
                                        ) : (
                                            <div className="coming-soon-badge">Coming Soon</div>
                                        )}
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

            {/* Statutory Report Preview Modal */}
            {previewData && previewReportName === 'EPF & ESI Statements' && (
                <StatutoryReportPreview
                    data={previewData}
                    reportName={previewReportName}
                    onClose={() => {
                        setPreviewData(null);
                        setPreviewReportName('');
                        setPreviewReportId('');
                    }}
                    onExport={async (exportType) => {
                        const params = { month: selectedMonth, year: selectedYear };
                        try {
                            if (exportType === 'epf-ecr') {
                                const res = await exportEPFECR(params);
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `EPF_ECR_${selectedMonth}_${selectedYear}.txt`);
                                document.body.appendChild(link);
                                link.click();
                            } else if (exportType === 'esi-challan') {
                                const res = await exportESIChallan(params);
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `ESI_Challan_${selectedMonth}_${selectedYear}.xlsx`);
                                document.body.appendChild(link);
                                link.click();
                            }
                            setNotification({ show: true, message: 'Export successful!', type: 'success' });
                        } catch (err) {
                            setNotification({ show: true, message: 'Export failed!', type: 'error' });
                        }
                        setPreviewData(null);
                        setPreviewReportName('');
                        setPreviewReportId('');
                    }}
                />
            )}

            {/* Generic Payroll Report Preview Modal */}
            {previewData && previewReportName !== 'EPF & ESI Statements' && (
                <PayrollReportPreview
                    data={previewData}
                    reportName={previewReportName}
                    type={previewReportName.toLowerCase().includes('summary') ? 'payroll-summary' : 'detailed'}
                    onClose={() => {
                        setPreviewData(null);
                        setPreviewReportName('');
                        setPreviewReportId('');
                    }}
                    onExport={() => handleGenerate(previewReportId || 'salary-register', previewReportName)}
                />
            )}
        </div>
    );
}

