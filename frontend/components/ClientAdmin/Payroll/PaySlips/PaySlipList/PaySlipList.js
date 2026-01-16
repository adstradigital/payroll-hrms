'use client';

import { useState } from 'react';
import { Search, Download, Eye, FileText, Calendar, Filter } from 'lucide-react';
import './PaySlipList.css';

// Mock data
const mockPayslips = [
    { id: 1, employeeId: 'EMP001', name: 'John Doe', department: 'Engineering', month: 'January 2026', gross: 45000, deductions: 5500, net: 39500, status: 'paid' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', department: 'Design', month: 'January 2026', gross: 38000, deductions: 4200, net: 33800, status: 'paid' },
    { id: 3, employeeId: 'EMP003', name: 'Mike Johnson', department: 'Marketing', month: 'January 2026', gross: 42000, deductions: 4800, net: 37200, status: 'generated' },
    { id: 4, employeeId: 'EMP004', name: 'Sarah Wilson', department: 'HR', month: 'January 2026', gross: 35000, deductions: 3800, net: 31200, status: 'generated' },
];

export default function PaySlipList() {
    const [payslips, setPayslips] = useState(mockPayslips);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('2026-01');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredPayslips = payslips.filter(slip =>
        slip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slip.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Summary
    const summary = {
        totalEmployees: payslips.length,
        totalGross: payslips.reduce((sum, p) => sum + p.gross, 0),
        totalDeductions: payslips.reduce((sum, p) => sum + p.deductions, 0),
        totalNet: payslips.reduce((sum, p) => sum + p.net, 0),
    };

    return (
        <div className="payslip-list">
            {/* Summary Cards */}
            <div className="payslip-summary">
                <div className="summary-card">
                    <span className="summary-card__label">Total Employees</span>
                    <span className="summary-card__value">{summary.totalEmployees}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-card__label">Gross Salary</span>
                    <span className="summary-card__value">{formatCurrency(summary.totalGross)}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-card__label">Total Deductions</span>
                    <span className="summary-card__value summary-card__value--danger">{formatCurrency(summary.totalDeductions)}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-card__label">Net Payable</span>
                    <span className="summary-card__value summary-card__value--success">{formatCurrency(summary.totalNet)}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="payslip-toolbar">
                <div className="payslip-toolbar__left">
                    <div className="payslip-search">
                        <Search size={18} className="payslip-search__icon" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="payslip-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <input
                        type="month"
                        className="payslip-month-picker"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>

                <div className="payslip-toolbar__right">
                    <button className="btn btn-secondary">
                        <Download size={18} />
                        Export All
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="payslip-table-container">
                <table className="payslip-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Month</th>
                            <th>Gross</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayslips.map(slip => (
                            <tr key={slip.id}>
                                <td>
                                    <div className="employee-cell">
                                        <div className="employee-cell__avatar">
                                            {slip.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="employee-cell__info">
                                            <span className="employee-cell__name">{slip.name}</span>
                                            <span className="employee-cell__id">{slip.employeeId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{slip.department}</td>
                                <td>{slip.month}</td>
                                <td>{formatCurrency(slip.gross)}</td>
                                <td className="text-danger">{formatCurrency(slip.deductions)}</td>
                                <td className="text-success font-bold">{formatCurrency(slip.net)}</td>
                                <td>
                                    <span className={`badge ${slip.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                        {slip.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action-btn" title="View">
                                            <Eye size={16} />
                                        </button>
                                        <button className="action-btn" title="Download">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
