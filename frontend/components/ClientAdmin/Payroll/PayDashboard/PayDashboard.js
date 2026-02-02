'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, Users, CheckCircle, Clock, AlertCircle,
    Download, RefreshCw, Loader2, TrendingUp, Building2,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { getPayslipDashboardStats } from '@/api/api_clientadmin';
import './PayDashboard.css';

export default function PayDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [chartPage, setChartPage] = useState(0);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPayslipDashboardStats({
                month: selectedMonth,
                year: selectedYear
            });

            setDashboardData(response.data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleExport = () => {
        alert('Export functionality coming soon!');
    };

    // Calculate max for chart scaling
    const maxPayslipAmount = dashboardData?.employee_payslips?.reduce(
        (max, emp) => Math.max(max, emp.gross), 0
    ) || 100000;

    // Pagination for chart
    const itemsPerPage = 8;
    const totalPages = Math.ceil((dashboardData?.employee_payslips?.length || 0) / itemsPerPage);
    const paginatedPayslips = dashboardData?.employee_payslips?.slice(
        chartPage * itemsPerPage,
        (chartPage + 1) * itemsPerPage
    ) || [];

    if (loading && !dashboardData) {
        return (
            <div className="pay-dashboard-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading payroll dashboard...</p>
            </div>
        );
    }

    return (
        <div className="pay-dashboard">
            {/* Header */}
            <div className="pd-header">
                <div className="pd-title-section">
                    <h1>Payroll <span className="highlight">Dashboard</span></h1>
                    <p className="pd-subtitle">
                        {months[selectedMonth - 1]} {selectedYear} Overview
                    </p>
                </div>
                <div className="pd-actions">
                    <div className="pd-filter-label">Filter:</div>
                    <div className="pd-month-selector-wrapper">
                        <input
                            type="month"
                            value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split('-');
                                setSelectedYear(parseInt(y));
                                setSelectedMonth(parseInt(m));
                            }}
                            className="pd-month-input"
                        />
                    </div>
                    <button className="pd-btn pd-btn--export" onClick={handleExport}>
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                    <button
                        className="pd-btn pd-btn--refresh"
                        onClick={fetchDashboardData}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="pd-error-alert">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchDashboardData}>Retry</button>
                </div>
            )}

            {/* Status Cards */}
            <div className="pd-stat-cards">
                <div className="pd-stat-card pd-stat-card--paid">
                    <div className="pd-stat-bar"></div>
                    <div className="pd-stat-content">
                        <span className="pd-stat-label">Paid</span>
                        <span className="pd-stat-value">
                            {dashboardData?.status_counts?.paid || 0}
                        </span>
                    </div>
                </div>
                <div className="pd-stat-card pd-stat-card--confirmed">
                    <div className="pd-stat-bar"></div>
                    <div className="pd-stat-content">
                        <span className="pd-stat-label">Confirmed</span>
                        <span className="pd-stat-value">
                            {dashboardData?.status_counts?.confirmed || 0}
                        </span>
                    </div>
                </div>
                <div className="pd-stat-card pd-stat-card--review">
                    <div className="pd-stat-bar"></div>
                    <div className="pd-stat-content">
                        <span className="pd-stat-label">Review Ongoing</span>
                        <span className="pd-stat-value">
                            {dashboardData?.status_counts?.review_ongoing || 0}
                        </span>
                    </div>
                </div>
                <div className="pd-stat-card pd-stat-card--draft">
                    <div className="pd-stat-bar"></div>
                    <div className="pd-stat-content">
                        <span className="pd-stat-label">Draft</span>
                        <span className="pd-stat-value">
                            {dashboardData?.status_counts?.draft || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="pd-content-grid">
                {/* Left: Employee Payslips Chart */}
                <div className="pd-chart-section">
                    <div className="pd-chart-header">
                        <h3>
                            <ChevronLeft
                                size={20}
                                className={`pd-chart-nav ${chartPage === 0 ? 'disabled' : ''}`}
                                onClick={() => chartPage > 0 && setChartPage(p => p - 1)}
                            />
                            Employee Payslips
                            <ChevronRight
                                size={20}
                                className={`pd-chart-nav ${chartPage >= totalPages - 1 ? 'disabled' : ''}`}
                                onClick={() => chartPage < totalPages - 1 && setChartPage(p => p + 1)}
                            />
                        </h3>
                    </div>

                    <div className="pd-chart-legend">
                        <span className="pd-legend-item"><span className="pd-legend-dot draft"></span> Draft</span>
                        <span className="pd-legend-item"><span className="pd-legend-dot review_ongoing"></span> Review Ongoing</span>
                        <span className="pd-legend-item"><span className="pd-legend-dot confirmed"></span> Confirmed</span>
                        <span className="pd-legend-item"><span className="pd-legend-dot paid"></span> Paid</span>
                    </div>

                    <div className="pd-chart-container">
                        <div className="pd-chart-y-axis">
                            <span>{formatCurrency(maxPayslipAmount)}</span>
                            <span>{formatCurrency(maxPayslipAmount * 0.75)}</span>
                            <span>{formatCurrency(maxPayslipAmount * 0.5)}</span>
                            <span>{formatCurrency(maxPayslipAmount * 0.25)}</span>
                            <span>0</span>
                        </div>
                        <div className="pd-chart-bars">
                            {paginatedPayslips.map((emp, index) => (
                                <div key={emp.id || index} className="pd-bar-group">
                                    <div className="pd-bar-stack">
                                        <div
                                            className={`pd-bar pd-bar--${emp.status}`}
                                            style={{ height: `${(emp.gross / maxPayslipAmount) * 100}%` }}
                                            title={`${emp.name}: ${formatCurrency(emp.gross)}`}
                                        ></div>
                                    </div>
                                    <span className="pd-bar-label">{emp.name?.split(' ')[0] || 'Employee'}</span>
                                </div>
                            ))}
                            {paginatedPayslips.length === 0 && (
                                <div className="pd-chart-empty">No payslips for this period</div>
                            )}
                        </div>
                    </div>
                    <div className="pd-chart-x-label">Name of Employees</div>
                </div>

                {/* Right: Summary & Department Breakdown */}
                <div className="pd-summary-section">
                    <div className="pd-totals-card">
                        <div className="pd-total-row">
                            <span className="pd-total-label">Total Payslips:</span>
                            <span className="pd-total-value">{dashboardData?.totals?.payslips_generated || 0}</span>
                        </div>
                        <div className="pd-total-row">
                            <span className="pd-total-label">Gross Amount:</span>
                            <span className="pd-total-value">{formatCurrency(dashboardData?.totals?.total_gross)}</span>
                        </div>
                        <div className="pd-total-row text-red-400">
                            <span className="pd-total-label">Fixed Deductions:</span>
                            <span className="pd-total-value">{formatCurrency(dashboardData?.totals?.total_deductions)}</span>
                        </div>
                        <div className="pd-total-row text-red-500">
                            <span className="pd-total-label">Attendance LOP:</span>
                            <span className="pd-total-value">{formatCurrency(dashboardData?.totals?.total_lop)}</span>
                        </div>
                        <div className="pd-total-row pd-total-row--highlight">
                            <span className="pd-total-label">Net Disbursal:</span>
                            <span className="pd-total-value">{formatCurrency(dashboardData?.totals?.total_net)}</span>
                        </div>
                    </div>

                    <div className="pd-department-section">
                        <h3><Building2 size={18} /> Department Total Amount</h3>

                        {dashboardData?.department_breakdown?.length > 0 ? (
                            <table className="pd-dept-table">
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        <th>Employees</th>
                                        <th>Gross</th>
                                        <th className="text-red-400">Deductions</th>
                                        <th>Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.department_breakdown.map((dept, idx) => (
                                        <tr key={idx}>
                                            <td className="pd-dept-name">{dept.name}</td>
                                            <td className="pd-dept-count">{dept.employee_count}</td>
                                            <td className="pd-dept-gross">{formatCurrency(dept.total_gross)}</td>
                                            <td className="pd-dept-deductions text-red-400">
                                                {formatCurrency((dept.total_deductions || 0) + (dept.total_lop || 0))}
                                            </td>
                                            <td className="pd-dept-net">{formatCurrency(dept.total_net)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td><strong>Total</strong></td>
                                        <td><strong>{dashboardData?.totals?.payslips_generated || 0}</strong></td>
                                        <td><strong>{formatCurrency(dashboardData?.totals?.total_gross)}</strong></td>
                                        <td className="text-red-400">
                                            <strong>{formatCurrency((dashboardData?.totals?.total_deductions || 0) + (dashboardData?.totals?.total_lop || 0))}</strong>
                                        </td>
                                        <td><strong>{formatCurrency(dashboardData?.totals?.total_net)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <div className="pd-dept-empty">
                                <Users size={32} />
                                <p>No department data for this period</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
