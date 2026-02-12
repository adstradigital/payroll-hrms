'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Download, Eye, FileText, Calendar, Filter,
    ArrowUpRight, ArrowDownRight, Wallet, CheckCircle,
    AlertCircle, X, Loader2, Printer, Plus, Trash2, Mail
} from 'lucide-react';
import { getAllPayslips, getPayslipDashboardStats, downloadPayslip, getPayslipById, addPayslipComponent, removePayslipComponent, sendPayslipEmail } from '@/api/api_clientadmin';
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [addComponentData, setAddComponentData] = useState({ name: 'Salary Advance', amount: '', component_type: 'deduction' });
    const [addComponentLoading, setAddComponentLoading] = useState(false);

    const handleAddComponent = async (e) => {
        e.preventDefault();
        setAddComponentLoading(true);
        try {
            const res = await addPayslipComponent(selectedPayslip.id, addComponentData);
            setSelectedPayslip(res.data); // Update with new calculation
            setShowAddModal(false);
            setAddComponentData({ name: 'Salary Advance', amount: '', component_type: 'deduction' }); // Reset
        } catch (error) {
            console.error("Failed to add component:", error);
            alert(error.response?.data?.error || "Failed to add component");
        } finally {
            setAddComponentLoading(false);
        }
    };

    const handleDeleteComponent = async (componentId) => {
        if (!confirm('Are you sure you want to remove this manual entry?')) return;
        try {
            const res = await removePayslipComponent(selectedPayslip.id, componentId);
            setSelectedPayslip(res.data);
        } catch (error) {
            console.error("Failed to remove component:", error);
            alert("Failed to remove component");
        }
    };

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

    const handleSendEmail = async (id, name) => {
        if (!confirm(`Are you sure you want to send the payslip to ${name}?`)) return;
        try {
            await sendPayslipEmail(id);
            alert(`Payslip sent successfully to ${name}`);
        } catch (error) {
            console.error("Failed to send email:", error);
            alert(error.response?.data?.error || "Failed to send email");
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
                                                title="Send Email"
                                                onClick={() => handleSendEmail(slip.id, slip.employee_name)}
                                            >
                                                <Mail size={18} />
                                            </button>
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
                                                {selectedPayslip.components?.filter(c => c.component_type?.toLowerCase() === 'earning').map(c => (
                                                    <div key={c.id} className="ps-section-row group relative">
                                                        <span>{c.component_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{formatCurrency(c.amount)}</span>
                                                            {c.is_manual && (
                                                                <button
                                                                    onClick={() => handleDeleteComponent(c.id)}
                                                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove Manual Entry"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ps-section-total">
                                                <span>Total Earnings</span>
                                                <span>{formatCurrency(selectedPayslip.gross_earnings)}</span>
                                            </div>
                                        </div>
                                        <div className="ps-paper-section">
                                            <div className="flex justify-between items-center border-b border-[#e5e7eb]">
                                                <h3 className="ps-section-title ps-title-deductions border-b-0">Deductions</h3>
                                                <button
                                                    onClick={() => setShowAddModal(true)}
                                                    className="m-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Deduct
                                                </button>
                                            </div>
                                            <div className="ps-section-rows">
                                                {selectedPayslip.components?.filter(c => c.component_type?.toLowerCase() === 'deduction').map(c => (
                                                    <div key={c.id} className="ps-section-row group relative">
                                                        <span>{c.component_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{formatCurrency(c.amount)}</span>
                                                            {c.is_manual && (
                                                                <button
                                                                    onClick={() => handleDeleteComponent(c.id)}
                                                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove Manual Entry"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
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
            )
            }
            {/* Add Component Modal */}
            {
                showAddModal && (
                    <div className="ps-modal-overlay">
                        <div className="bg-[#111] p-6 rounded-lg w-full max-w-md border border-[#333] shadow-2xl animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4">Add Manual Deduction</h3>
                            <form onSubmit={handleAddComponent}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Deduction Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#222] border border-[#333] rounded p-2 text-white focus:border-brand-primary outline-none"
                                            placeholder="e.g. Salary Advance, Penalty"
                                            value={addComponentData.name}
                                            onChange={(e) => setAddComponentData({ ...addComponentData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[#222] border border-[#333] rounded p-2 text-white focus:border-brand-primary outline-none"
                                            placeholder="0.00"
                                            value={addComponentData.amount}
                                            onChange={(e) => setAddComponentData({ ...addComponentData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 rounded text-gray-400 hover:bg-[#222]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addComponentLoading}
                                        className="px-4 py-2 rounded bg-brand-primary text-black font-bold hover:opacity-90 disabled:opacity-50"
                                    >
                                        {addComponentLoading ? 'Adding...' : 'Add Deduction'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
