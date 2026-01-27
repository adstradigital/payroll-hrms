'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, FileText, Calendar, Filter, Loader } from 'lucide-react';
import { getAllPayslips, getPayslipDashboardStats, downloadPayslip } from '@/api/api_clientadmin';
import './PaySlips.css';

export default function PaySlips() {
    const [payslips, setPayslips] = useState([]);
    const [stats, setStats] = useState({
        total_employees: 0,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');

            // Parallel fetch for better performance
            const [listRes, statsRes] = await Promise.all([
                getAllPayslips({ month: parseInt(month), year: parseInt(year) }),
                getPayslipDashboardStats({ month: parseInt(month), year: parseInt(year) })
            ]);

            setPayslips(listRes.data.results || listRes.data || []);
            setStats(statsRes.data || { total_employees: 0, total_gross: 0, total_net: 0 });

        } catch (error) {
            console.error("Error fetching payslip data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, name) => {
        try {
            const response = await downloadPayslip(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${name}_${selectedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Download failed. Please try again.");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredPayslips = payslips.filter(slip =>
        slip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="payslips-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="text-brand" /> Employee Payslips
                    </h1>
                    <p className="text-secondary">View and download salary slips</p>
                </div>
                <div className="flex gap-4">
                    <div className="month-picker-wrapper">
                        <Calendar size={18} className="text-muted absolute left-3 top-2.5" />
                        <input
                            type="month"
                            className="input-month pl-10"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="stat-card">
                    <span className="label">Processed Employees</span>
                    <span className="value">{stats.total_employees}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Total Gross</span>
                    <span className="value">{formatCurrency(stats.total_gross)}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Total Deductions</span>
                    <span className="value text-danger">{formatCurrency(stats.total_deductions)}</span>
                </div>
                <div className="stat-card highlight">
                    <span className="label">Total Net Pay</span>
                    <span className="value text-success">{formatCurrency(stats.total_net)}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="toolbar-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-outline" disabled={payslips.length === 0}>
                    <Download size={18} /> Export List
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading payslip data...</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Designation</th>
                                <th>Pay Period</th>
                                <th>Gross Pay</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayslips.map(slip => (
                                <tr key={slip.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar-initials">{slip.employee_name?.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold">{slip.employee_name}</div>
                                                <div className="text-xs text-muted">{slip.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{slip.designation || '-'}</td>
                                    <td>{slip.month_name} {slip.year}</td>
                                    <td className="font-mono">{formatCurrency(slip.gross_salary)}</td>
                                    <td className="font-mono text-danger">{formatCurrency(slip.total_deductions)}</td>
                                    <td className="font-mono font-bold text-success">{formatCurrency(slip.net_salary)}</td>
                                    <td>
                                        <span className={`status-badge ${slip.status === 'paid' ? 'success' : 'warning'}`}>
                                            {slip.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Preview Button (Future) */}
                                            {/* <button className="btn-icon" title="View"><Eye size={16} /></button> */}
                                            <button
                                                onClick={() => handleDownload(slip.id, slip.employee_name)}
                                                className="btn-icon"
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayslips.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        No payslips found for {selectedMonth}. Run payroll first.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
