import React, { useState } from 'react';
import {
    X, Download, FileText, Search,
    Filter, ChevronLeft, ChevronRight,
    ArrowUpRight, Users, Wallet, TrendingUp
} from 'lucide-react';

const PayrollReportPreview = ({ data, reportName, type, onClose, onExport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (!data || data.length === 0) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Dynamic Summary for Header
    const getSummary = () => {
        if (type === 'payroll-summary') {
            const totalGross = data.reduce((acc, curr) => acc + (parseFloat(curr.gross) || 0), 0);
            const totalNet = data.reduce((acc, curr) => acc + (parseFloat(curr.net) || 0), 0);
            const totalEmployees = data.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
            return [
                { label: 'Total Gross Pay', value: formatCurrency(totalGross), icon: Wallet, color: 'stat-blue' },
                { label: 'Total Net Pay', value: formatCurrency(totalNet), icon: TrendingUp, color: 'stat-emerald' },
                { label: 'Total Headcount', value: totalEmployees, icon: Users, color: 'stat-purple' }
            ];
        } else {
            const totalGross = data.reduce((acc, curr) => acc + (parseFloat(curr.gross_salary || curr.Gross) || 0), 0);
            const avgNet = data.length > 0 ? data.reduce((acc, curr) => acc + (parseFloat(curr.net_salary || curr.Net_Salary) || 0), 0) / data.length : 0;
            return [
                { label: 'Total Gross', value: formatCurrency(totalGross), icon: Wallet, color: 'stat-blue' },
                { label: 'Avg Net Pay', value: formatCurrency(avgNet), icon: TrendingUp, color: 'stat-emerald' },
                { label: 'Record Count', value: data.length, icon: Users, color: 'stat-purple' }
            ];
        }
    };

    const summaryCards = getSummary();
    const headers = data.length > 0 ? Object.keys(data[0]).filter(h => h !== 'id') : [];

    return (
        <div className="report-preview-overlay">
            <div className="report-preview-modal animate-slide-in">
                <div className="preview-header">
                    <div className="header-info">
                        <div className="header-icon">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2>{reportName}</h2>
                            <p>Data Preview & Verification</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="preview-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search in preview..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="preview-export-btn" onClick={() => onExport('excel')}>
                            <Download size={18} />
                            <span>Export Excel</span>
                        </button>
                        <button className="preview-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="preview-summary-grid">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className={`summary-card ${card.color}`}>
                            <div className="card-lbl">{card.label}</div>
                            <div className="card-val">{card.value}</div>
                            <div className="card-sub">
                                <card.icon size={14} />
                                <span>Monthly Analytics</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="preview-table-container">
                    <table className="preview-table">
                        <thead>
                            <tr>
                                {headers.map(header => (
                                    <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, idx) => (
                                <tr key={idx}>
                                    {headers.map(header => (
                                        <td key={`${idx}-${header}`}>
                                            {typeof row[header] === 'number' && header.match(/gross|net|basic|salary|pf|esi|tds/i)
                                                ? formatCurrency(row[header])
                                                : row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="preview-footer">
                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="pagi-btn"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="pagi-btn"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div className="footer-stats">
                        <span>Showing {currentData.length} of {filteredData.length} records</span>
                        <div className="v-divider"></div>
                        <span>Timestamp: {new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .report-preview-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }

                .report-preview-modal {
                    background: #ffffff;
                    width: 100%;
                    max-width: 1300px;
                    height: 85vh;
                    border-radius: 24px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .preview-header {
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .header-icon {
                    width: 48px;
                    height: 48px;
                    background: #6366f1;
                    color: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-info h2 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; }
                .header-info p { color: #64748b; font-size: 13px; margin: 2px 0 0; }

                .header-actions { display: flex; gap: 12px; align-items: center; }

                .preview-search {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0 12px;
                    border-radius: 10px;
                    width: 240px;
                }

                .preview-search input {
                    border: none;
                    padding: 10px 0;
                    font-size: 13px;
                    width: 100%;
                    outline: none;
                }

                .preview-export-btn {
                    background: #1e293b;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .preview-export-btn:hover { background: #0f172a; transform: translateY(-1px); }

                .preview-close-btn {
                    background: transparent;
                    color: #64748b;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .preview-close-btn:hover { background: #f1f5f9; color: #1e293b; }

                .preview-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    padding: 24px 32px;
                }

                .summary-card {
                    padding: 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.05);
                }

                .stat-blue { background: #eff6ff; border-color: #dbeafe; }
                .stat-emerald { background: #ecfdf5; border-color: #d1fae5; }
                .stat-purple { background: #f5f3ff; border-color: #ede9fe; }

                .card-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .card-val { font-size: 22px; font-weight: 800; color: #1e293b; margin: 4px 0; }
                .card-sub { font-size: 11px; font-weight: 600; color: #94a3b8; display: flex; align-items: center; gap: 4px; }

                .preview-table-container {
                    flex: 1;
                    overflow: auto;
                    padding: 0 32px;
                }

                .preview-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .preview-table th {
                    position: sticky;
                    top: 0;
                    background: #f8fafc;
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    z-index: 10;
                    white-space: nowrap;
                }

                .preview-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                    color: #1e293b;
                    white-space: nowrap;
                }

                .preview-footer {
                    padding: 20px 32px;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .pagination { display: flex; align-items: center; gap: 16px; font-size: 13px; font-weight: 600; color: #475569; }
                .pagi-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .pagi-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .footer-stats { display: flex; align-items: center; gap: 16px; color: #94a3b8; font-size: 12px; }
                .v-divider { width: 1px; height: 12px; background: #e2e8f0; }

                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PayrollReportPreview;
