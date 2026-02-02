'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, FileText, Calendar, Filter,
    ArrowUpRight, ArrowDownRight, Wallet, CheckCircle,
    AlertCircle, X, Loader2, Printer
} from 'lucide-react';
import { getAllPayslips, getPayslipDashboardStats, downloadPayslip, getPayslipById } from '@/api/api_clientadmin';
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
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { month: selectedMonth, year: selectedYear };

            const [listRes, statsRes] = await Promise.all([
                getAllPayslips(params),
                getPayslipDashboardStats(params)
            ]);

            // Handle potential DRF pagination or raw list
            const payslipList = listRes.data.results || listRes.data || [];
            setPayslips(payslipList);

            if (statsRes.data && statsRes.data.totals) {
                const t = statsRes.data.totals;
                setStats({
                    total_employees: t.payslips_generated || 0,
                    total_gross: t.total_gross || 0,
                    total_net: t.total_net || 0,
                    total_deductions: (t.total_gross - t.total_net) || 0
                });
            } else {
                setStats({ total_employees: 0, total_gross: 0, total_deductions: 0, total_net: 0 });
            }
        } catch (error) {
            console.error("Error fetching payslip data", error);
        } finally {
            setLoading(false);
        }
    };
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    const handleView = async (id) => {
        setModalLoading(true);
        setShowModal(true);
        try {
            const res = await getPayslipById(id);
            setSelectedPayslip(res.data);
        } catch (error) {
            console.error("Failed to fetch payslip details:", error);
            alert("Could not load payslip details.");
            setShowModal(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDownload = async (id, name) => {
        try {
            console.log(`Starting download for payslip ID: ${id}`);
            const response = await downloadPayslip(id);

            // Check if we got a PDF or an error
            const contentType = response.headers['content-type'];
            console.log(`Received download response. Content-Type: ${contentType}`);

            if (contentType && contentType.includes('application/json')) {
                // Unexpected JSON error response
                const reader = new FileReader();
                reader.onload = () => {
                    const errorData = JSON.parse(reader.result);
                    alert(`Download failed: ${errorData.error || 'Unknown error'}`);
                };
                reader.readAsText(response.data);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${name}_${selectedMonth}_${selectedYear}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            console.log("Download triggered successfully");
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download payslip. Please try again.");
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
        slip.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.employee_id_display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ps-page ps-animate">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="ps-title">Monthly <span className="ps-text-gold">Payslips</span></h1>
                <p className="ps-subtitle">Management console for salary distribution and document access.</p>

                {/* Dashboard Analysis Grid */}
                <div className="ps-grid">
                    <div className="ps-card">
                        <div className="ps-label">Total Disbursement (Net)</div>
                        <div className="ps-value ps-text-gold">{formatCurrency(stats.total_net)}</div>
                        <Wallet className="ps-icon-bg" size={80} />
                    </div>
                    <div className="ps-card">
                        <div className="ps-label">Total Gross Earnings</div>
                        <div className="ps-value">{formatCurrency(stats.total_gross)}</div>
                        <ArrowUpRight className="ps-icon-bg" size={80} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div className="ps-card">
                        <div className="ps-label">Total Deductions</div>
                        <div className="ps-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(stats.total_deductions)}</div>
                        <ArrowDownRight className="ps-icon-bg" size={80} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <div className="ps-card">
                        <div className="ps-label">Employees Processed</div>
                        <div className="ps-value">{stats.total_employees}</div>
                        <FileText className="ps-icon-bg" size={80} />
                    </div>
                </div>
            </div>

            {/* Interactive Toolbar */}
            <div className="ps-toolbar">
                <div className="ps-search-group">
                    <div className="ps-search-wrapper">
                        <Search size={18} className="text-muted" />
                        <input
                            type="text"
                            className="ps-search-input"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-muted" />
                        <select
                            className="ps-month-picker"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="ps-month-picker" // Reusing style, consider a new class if needed
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {[2023, 2024, 2025, 2026].map(year => ( // Adjust years as needed
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button className="ps-btn-export" onClick={() => alert('Exporting to Excel...')}>
                    <Download size={18} /> Export Data
                </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-brand" size={40} />
                    <p className="text-muted font-medium">Synchronizing payroll records...</p>
                </div>
            ) : (
                <div className="ps-table-wrapper ps-animate">
                    <table className="ps-table">
                        <thead>
                            <tr>
                                <th>Employee Identity</th>
                                <th>Position</th>
                                <th>Fiscal Period</th>
                                <th>Gross Pay</th>
                                <th>Deductions</th>
                                <th>Net Payable</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayslips.map(slip => (
                                <tr key={slip.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="ps-avatar">{slip.employee_name?.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold text-primary">{slip.employee_name}</div>
                                                <div className="text-xs text-muted font-mono">{slip.employee_id_display || slip.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{slip.designation || 'Staff'}</td>
                                    <td>{slip.period_name || `${slip.month_name} ${slip.year}`}</td>
                                    <td className="ps-font-mono">{formatCurrency(slip.gross_earnings || slip.gross_salary)}</td>
                                    <td className="ps-font-mono text-danger">{formatCurrency(slip.total_deductions)}</td>
                                    <td className="ps-font-mono font-bold text-success" style={{ fontSize: '1.05rem' }}>
                                        {formatCurrency(slip.net_salary)}
                                    </td>
                                    <td>
                                        <span className={`ps-badge ${slip.status === 'paid' ? 'ps-badge-paid' : 'ps-badge-pending'}`}>
                                            {slip.status === 'paid' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                            {slip.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                className="ps-btn-icon"
                                                title="View Detail View"
                                                onClick={() => handleView(slip.id)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="ps-btn-icon"
                                                style={{ color: 'var(--brand-primary)' }}
                                                title="Download PDF Archive"
                                                onClick={() => handleDownload(slip.id, slip.employee_name)}
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredPayslips.length === 0 && (
                        <div className="ps-empty">
                            <div className="mb-4 opacity-20">
                                <FileText size={64} style={{ margin: '0 auto' }} />
                            </div>
                            <h3>No Records Found</h3>
                            <p>We couldn't find any payslips for the selected period.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Payslip Detail Modal */}
            {showModal && (
                <div className="ps-modal-overlay">
                    <div className="ps-modal-content">
                        <div className="ps-modal-header">
                            <h2>Payslip View</h2>
                            <button className="ps-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        {modalLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <Loader2 className="animate-spin text-brand" size={32} />
                                <span className="text-muted">Loading payslip details...</span>
                            </div>
                        ) : selectedPayslip ? (
                            <div className="ps-modal-body">
                                <div className="ps-paper-layout">
                                    <div className="ps-paper-header">
                                        <div>
                                            <h1 className="ps-paper-title">PAYSLIP</h1>
                                            <p className="ps-paper-subtitle">{selectedPayslip.period_name || 'October 2023'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="ps-paper-value-bold" style={{ fontSize: '1.4rem' }}>{selectedPayslip.company_name || 'Acme Corp Inc.'}</div>
                                            <div className="text-xs text-zinc-500 mt-1">123 Business Rd, Tech City</div>
                                        </div>
                                    </div>

                                    <div className="ps-paper-meta ps-paper-grid">
                                        <div>
                                            <div className="ps-paper-label">Employee Details</div>
                                            <div className="ps-paper-value-bold">{selectedPayslip.employee_name}</div>
                                            <div className="text-sm font-bold">EMP-{selectedPayslip.employee_id || '001'}</div>
                                            <div className="text-sm uppercase tracking-wider">{selectedPayslip.designation_name || 'Staff'}</div>
                                        </div>
                                        <div className="flex gap-12 text-right justify-end">
                                            <div className="text-left">
                                                <div className="ps-paper-label">Pay Summary</div>
                                                <div className="text-sm mb-2">Gross Pay:</div>
                                                <div className="text-sm">Net Pay:</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="ps-paper-label">&nbsp;</div>
                                                <div className="text-sm font-bold mb-2">{formatCurrency(selectedPayslip.gross_earnings)}</div>
                                                <div className="ps-net-highlight">{formatCurrency(selectedPayslip.net_salary)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ps-paper-grid mt-12 mb-12">
                                        <div className="ps-paper-section">
                                            <h3 className="ps-section-title ps-title-earnings">Earnings</h3>
                                            <div className="ps-section-rows">
                                                {selectedPayslip.components?.filter(c => c.component_type === 'earning').map(c => (
                                                    <div key={c.id} className="ps-section-row">
                                                        <span>{c.component_name}</span>
                                                        <span className="font-bold">{formatCurrency(c.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ps-section-total">
                                                <span>Total Earnings</span>
                                                <span>{formatCurrency(selectedPayslip.gross_earnings)}</span>
                                            </div>
                                        </div>
                                        <div className="ps-paper-section">
                                            <h3 className="ps-section-title ps-title-deductions">Deductions</h3>
                                            <div className="ps-section-rows">
                                                {selectedPayslip.components?.filter(c => c.component_type === 'deduction').map(c => (
                                                    <div key={c.id} className="ps-section-row">
                                                        <span>{c.component_name}</span>
                                                        <span className="font-bold">{formatCurrency(c.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ps-section-total">
                                                <span>Total Deductions</span>
                                                <span>{formatCurrency(selectedPayslip.total_deductions)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ps-paper-footer">
                                        <div className="text-xs font-bold text-zinc-400">Generated automatically by System</div>
                                        <div className="text-right">
                                            <div className="ps-paper-label">Net Payable</div>
                                            <div className="text-4xl font-black">{formatCurrency(selectedPayslip.net_salary)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="ps-modal-footer">
                            <button className="ps-modal-btn-close" onClick={() => setShowModal(false)}>Close</button>
                            <button
                                className="ps-modal-btn-download"
                                onClick={() => handleDownload(selectedPayslip?.id, selectedPayslip?.employee_name)}
                            >
                                <Download size={16} />
                                <span>Download PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
