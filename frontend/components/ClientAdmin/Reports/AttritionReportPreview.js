'use client';

import { useState, useMemo } from 'react';
import {
    X, Download, TrendingDown, TrendingUp, Users,
    UserMinus, UserPlus, Building2, Calendar, Filter,
    ArrowDownRight, ArrowUpRight, Loader2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LineChart, Line, Area, AreaChart, LabelList
} from 'recharts';

const EXIT_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#6366f1'];
const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function AttritionReportPreview({ summaryData, detailsData, onClose, onExport, year }) {
    const [activeView, setActiveView] = useState('overview');
    const [filterDept, setFilterDept] = useState('');

    const monthlySummary = summaryData?.monthly || [];
    const deptBreakdown = summaryData?.department_breakdown || [];
    const exitReasons = summaryData?.exit_reasons || {};

    const exitReasonsChartData = useMemo(() => [
        { name: 'Resigned', value: exitReasons.resigned || 0 },
        { name: 'Terminated', value: exitReasons.terminated || 0 },
    ].filter(d => d.value > 0), [exitReasons]);

    const filteredDetails = useMemo(() => {
        if (!detailsData) return [];
        if (!filterDept) return detailsData;
        return detailsData.filter(d => d.department.toLowerCase().includes(filterDept.toLowerCase()));
    }, [detailsData, filterDept]);

    const departments = useMemo(() => {
        if (!detailsData) return [];
        return [...new Set(detailsData.map(d => d.department))].filter(d => d !== 'N/A');
    }, [detailsData]);

    const renderTooltip = ({ active, payload, label }) => {
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

    const renderPieTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="analytics-tooltip">
                <div className="tooltip-title">{payload[0].name}</div>
                <div className="tooltip-row">
                    <span className="dot" style={{ background: payload[0].payload.fill || payload[0].color }} />
                    <span className="name">Count</span>
                    <span className="value">{payload[0].value}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="attrition-preview-overlay" onClick={onClose}>
            <div className="attrition-preview-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="attrition-preview-header">
                    <div className="attrition-header-left">
                        <div className="attrition-header-icon">
                            <TrendingDown size={22} />
                        </div>
                        <div>
                            <h2>Attrition Report</h2>
                            <span className="attrition-year-badge">FY {year}</span>
                        </div>
                    </div>
                    <div className="attrition-header-actions">
                        <button className="attrition-export-btn" onClick={onExport}>
                            <Download size={16} />
                            <span>Export CSV</span>
                        </button>
                        <button className="attrition-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="attrition-tabs">
                    <button
                        className={`attrition-tab ${activeView === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveView('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`attrition-tab ${activeView === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveView('details')}
                    >
                        Exit Details
                    </button>
                </div>

                {/* Content */}
                <div className="attrition-preview-body">
                    {activeView === 'overview' ? (
                        <>
                            {/* KPI Cards */}
                            <div className="attrition-kpi-grid">
                                <div className="attrition-kpi-card danger">
                                    <div className="kpi-icon-wrap">
                                        <TrendingDown size={20} />
                                    </div>
                                    <div className="kpi-info">
                                        <span className="kpi-label">Annual Attrition Rate</span>
                                        <span className="kpi-value">{summaryData?.annual_attrition_rate || 0}%</span>
                                    </div>
                                </div>
                                <div className="attrition-kpi-card warning">
                                    <div className="kpi-icon-wrap">
                                        <UserMinus size={20} />
                                    </div>
                                    <div className="kpi-info">
                                        <span className="kpi-label">Total Exits</span>
                                        <span className="kpi-value">{summaryData?.total_exits || 0}</span>
                                    </div>
                                </div>
                                <div className="attrition-kpi-card success">
                                    <div className="kpi-icon-wrap">
                                        <UserPlus size={20} />
                                    </div>
                                    <div className="kpi-info">
                                        <span className="kpi-label">Total Hires</span>
                                        <span className="kpi-value">{summaryData?.total_hires || 0}</span>
                                    </div>
                                </div>
                                <div className="attrition-kpi-card primary">
                                    <div className="kpi-icon-wrap">
                                        <Users size={20} />
                                    </div>
                                    <div className="kpi-info">
                                        <span className="kpi-label">Current Headcount</span>
                                        <span className="kpi-value">{summaryData?.current_headcount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="attrition-charts-row">
                                {/* Monthly Trend Chart */}
                                <div className="attrition-chart-card wide">
                                    <h4 className="chart-card-title">
                                        <Calendar size={16} />
                                        Monthly Attrition Trend
                                    </h4>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={monthlySummary}>
                                            <defs>
                                                <linearGradient id="attrExits" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                                                </linearGradient>
                                                <linearGradient id="attrHires" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="rgba(15,23,42,0.06)" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                            <Tooltip content={renderTooltip} />
                                            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} iconType="circle" />
                                            <Area type="monotone" dataKey="exits" stroke="#ef4444" fill="url(#attrExits)" name="Exits" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                                            <Area type="monotone" dataKey="new_hires" stroke="#10b981" fill="url(#attrHires)" name="New Hires" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Exit Reasons Pie */}
                                <div className="attrition-chart-card narrow">
                                    <h4 className="chart-card-title">
                                        <UserMinus size={16} />
                                        Exit Reasons
                                    </h4>
                                    {exitReasonsChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie
                                                    data={exitReasonsChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {exitReasonsChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={EXIT_COLORS[index % EXIT_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={renderPieTooltip} />
                                                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="attrition-empty-chart">
                                            <UserMinus size={32} />
                                            <p>No exit data for this period</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Department Breakdown */}
                            {deptBreakdown.length > 0 && (
                                <div className="attrition-chart-card full">
                                    <h4 className="chart-card-title">
                                        <Building2 size={16} />
                                        Department-wise Exit Breakdown
                                    </h4>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={deptBreakdown} barSize={36}>
                                            <defs>
                                                <linearGradient id="deptBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="rgba(15,23,42,0.06)" />
                                            <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                            <Tooltip content={renderTooltip} />
                                            <Bar dataKey="exits" fill="url(#deptBar)" name="Exits" radius={[8, 8, 2, 2]}>
                                                <LabelList dataKey="exits" position="top" fill="#1f2937" fontSize={11} fontWeight={600} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Monthly Data Table */}
                            <div className="attrition-table-card">
                                <h4 className="chart-card-title">
                                    <Calendar size={16} />
                                    Monthly Headcount Summary
                                </h4>
                                <div className="attrition-table-wrapper">
                                    <table className="attrition-table">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Opening</th>
                                                <th>Hires</th>
                                                <th>Exits</th>
                                                <th>Closing</th>
                                                <th>Attrition %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlySummary.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="month-cell">{row.month}</td>
                                                    <td>{row.opening}</td>
                                                    <td className="hire-cell">
                                                        {row.new_hires > 0 && <ArrowUpRight size={13} />}
                                                        {row.new_hires}
                                                    </td>
                                                    <td className="exit-cell">
                                                        {row.exits > 0 && <ArrowDownRight size={13} />}
                                                        {row.exits}
                                                    </td>
                                                    <td>{row.closing}</td>
                                                    <td>
                                                        <span className={`rate-badge ${row.attrition_rate > 5 ? 'high' : row.attrition_rate > 2 ? 'medium' : 'low'}`}>
                                                            {row.attrition_rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Details View */}
                            <div className="attrition-details-filter">
                                <div className="details-filter-row">
                                    <Filter size={16} />
                                    <select
                                        value={filterDept}
                                        onChange={(e) => setFilterDept(e.target.value)}
                                        className="dept-filter-select"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <span className="details-count">{filteredDetails.length} records</span>
                                </div>
                            </div>

                            <div className="attrition-table-card">
                                <div className="attrition-table-wrapper">
                                    <table className="attrition-table details-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>ID</th>
                                                <th>Department</th>
                                                <th>Designation</th>
                                                <th>Joined</th>
                                                <th>Exit Date</th>
                                                <th>Tenure</th>
                                                <th>Type</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDetails.length > 0 ? filteredDetails.map((emp, idx) => (
                                                <tr key={idx}>
                                                    <td className="employee-name-cell">{emp.employee_name}</td>
                                                    <td className="id-cell">{emp.employee_id}</td>
                                                    <td>{emp.department}</td>
                                                    <td>{emp.designation}</td>
                                                    <td>{emp.date_of_joining}</td>
                                                    <td>{emp.exit_date}</td>
                                                    <td>
                                                        <span className="tenure-badge">{emp.tenure_years} yrs</span>
                                                    </td>
                                                    <td>
                                                        <span className={`exit-type-badge ${emp.exit_type}`}>
                                                            {emp.exit_type === 'resigned' ? 'Resigned' : 'Terminated'}
                                                        </span>
                                                    </td>
                                                    <td className="reason-cell">{emp.reason}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={9} className="empty-row">
                                                        <UserMinus size={24} />
                                                        <span>No exit records found for this period</span>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
