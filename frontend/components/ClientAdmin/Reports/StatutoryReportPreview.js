import React from 'react';
import {
    X, Download, Shield, Users,
    ArrowUpRight, Info, CheckCircle2,
    FileText, CreditCard,
    FileJson, Sheet
} from 'lucide-react';

const StatutoryReportPreview = ({ data, onClose, onExport, reportName }) => {
    if (!data || data.length === 0) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Calculate Summaries
    const summary = data.reduce((acc, curr) => ({
        total_epf_emp: acc.total_epf_emp + (parseFloat(curr.pf_employee) || 0),
        total_epf_org: acc.total_epf_org + (parseFloat(curr.pf_employer_epf) || 0),
        total_eps_org: acc.total_eps_org + (parseFloat(curr.pf_employer_eps) || 0),
        total_admin: acc.total_admin + (parseFloat(curr.pf_admin_charges) || 0) + (parseFloat(curr.pf_edli_charges) || 0),
        total_esi_emp: acc.total_esi_emp + (parseFloat(curr.esi_employee) || 0),
        total_esi_org: acc.total_esi_org + (parseFloat(curr.esi_employer) || 0),
        count: acc.count + 1
    }), { total_epf_emp: 0, total_epf_org: 0, total_eps_org: 0, total_admin: 0, total_esi_emp: 0, total_esi_org: 0, count: 0 });

    const totalStatutoryLiability = summary.total_epf_emp + summary.total_epf_org + summary.total_eps_org + summary.total_admin + summary.total_esi_emp + summary.total_esi_org;

    return (
        <div className="report-preview-overlay">
            <div className="report-preview-modal animate-slide-in">
                <div className="preview-header">
                    <div className="header-info">
                        <div className="header-icon">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2>{reportName} Preview</h2>
                            <p>Statutory compliance summary for the current month</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="export-group">
                            <button className="preview-export-btn ecr-btn" onClick={() => onExport('epf-ecr')}>
                                <FileJson size={18} />
                                <span>EPF ECR</span>
                            </button>
                            <button className="preview-export-btn esi-btn" onClick={() => onExport('esi-challan')}>
                                <Sheet size={18} />
                                <span>ESI Challan</span>
                            </button>
                            <button className="preview-export-btn" onClick={() => onExport('csv')}>
                                <Download size={18} />
                                <span>Export CSV</span>
                            </button>
                        </div>
                        <button className="preview-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="preview-summary-grid">
                    <div className="summary-card stat-blue">
                        <div className="card-lbl">Total PF Contribution</div>
                        <div className="card-val">{formatCurrency(summary.total_epf_emp + summary.total_epf_org + summary.total_eps_org)}</div>
                        <div className="card-sub text-blue-400">
                            <Users size={14} />
                            <span>{summary.count} Employees Covered</span>
                        </div>
                    </div>
                    <div className="summary-card stat-emerald">
                        <div className="card-lbl">Total ESI Contribution</div>
                        <div className="card-val">{formatCurrency(summary.total_esi_emp + summary.total_esi_org)}</div>
                        <div className="card-sub text-emerald-400">
                            <CheckCircle2 size={14} />
                            <span>Statutory Compliant</span>
                        </div>
                    </div>
                    <div className="summary-card stat-amber">
                        <div className="card-lbl">PF Admin & EDLI</div>
                        <div className="card-val">{formatCurrency(summary.total_admin)}</div>
                        <div className="card-sub text-amber-400">
                            <CreditCard size={14} />
                            <span>Organization Overhead</span>
                        </div>
                    </div>
                    <div className="summary-card stat-purple">
                        <div className="card-lbl">Total Statutory Outflow</div>
                        <div className="card-val">{formatCurrency(totalStatutoryLiability)}</div>
                        <div className="card-sub text-purple-400">
                            <ArrowUpRight size={14} />
                            <span>Current Month Projection</span>
                        </div>
                    </div>
                </div>

                <div className="preview-table-container">
                    <table className="preview-table">
                        <thead>
                            <tr>
                                <th rowSpan="2">Employee Info</th>
                                <th rowSpan="2">Gross Salary</th>
                                <th colSpan="2" className="text-center group-header group-pf">Provident Fund (Employee)</th>
                                <th colSpan="4" className="text-center group-header group-pf-org">Provident Fund (Employer Share)</th>
                                <th colSpan="2" className="text-center group-header group-esi">ESI Contribution</th>
                            </tr>
                            <tr>
                                <th className="sub-th group-pf">PF Wage</th>
                                <th className="sub-th group-pf">Emp Share</th>
                                <th className="sub-th group-pf-org">EPF (3.67%)</th>
                                <th className="sub-th group-pf-org">EPS (8.33%)</th>
                                <th className="sub-th group-pf-org">Admin (0.5%)</th>
                                <th className="sub-th group-pf-org">EDLI (0.5%)</th>
                                <th className="sub-th group-esi">Emp Share</th>
                                <th className="sub-th group-esi">Org Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="emp-name">{row.employee_name}</div>
                                        <div className="emp-id">ID: {row.employee_id}</div>
                                    </td>
                                    <td className="font-mono">{formatCurrency(row.gross_salary)}</td>
                                    <td className="font-mono text-muted">{formatCurrency(row.pf_base)}</td>
                                    <td className="font-mono font-bold text-rose-500">-{formatCurrency(row.pf_employee)}</td>
                                    <td className="font-mono text-emerald-500">{formatCurrency(row.pf_employer_epf)}</td>
                                    <td className="font-mono text-emerald-500">{formatCurrency(row.pf_employer_eps)}</td>
                                    <td className="font-mono text-amber-500">{formatCurrency(row.pf_admin_charges)}</td>
                                    <td className="font-mono text-amber-500">{formatCurrency(row.pf_edli_charges)}</td>
                                    <td className="font-mono text-rose-500">-{formatCurrency(row.esi_employee)}</td>
                                    <td className="font-mono text-emerald-500">{formatCurrency(row.esi_employer)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="preview-footer">
                    <div className="footer-info">
                        <Info size={16} />
                        <span>Data reflects calculations based on current Payroll Settings and attendance proration.</span>
                    </div>
                    <div className="footer-stats">
                        <span>Rows: {data.length}</span>
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
                    max-width: 1400px;
                    height: 90vh;
                    border-radius: 32px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .preview-header {
                    padding: 32px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .header-icon {
                    width: 56px;
                    height: 56px;
                    background: #6366f1;
                    color: white;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
                }

                .header-info h2 {
                    font-size: 24px;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.02em;
                }

                .header-info p {
                    color: #64748b;
                    font-size: 14px;
                    margin-top: 2px;
                }

                .header-actions {
                    display: flex;
                    gap: 16px;
                }

                .preview-export-btn {
                    background: #1e293b;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .preview-export-btn:hover {
                    background: #0f172a;
                    transform: translateY(-2px);
                }

                .ecr-btn {
                    background: #4f46e5;
                }
                .ecr-btn:hover { background: #4338ca; }

                .esi-btn {
                    background: #10b981;
                }
                .esi-btn:hover { background: #059669; }

                .export-group {
                    display: flex;
                    gap: 12px;
                    background: #f1f5f9;
                    padding: 6px;
                    border-radius: 16px;
                }

                .preview-close-btn {
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .preview-close-btn:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .preview-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    padding: 32px 40px;
                    background: #ffffff;
                }

                .summary-card {
                    padding: 24px;
                    border-radius: 20px;
                    border: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-blue { background: #eff6ff; border-color: #dbeafe; }
                .stat-emerald { background: #ecfdf5; border-color: #d1fae5; }
                .stat-amber { background: #fffbeb; border-color: #fef3c7; }
                .stat-purple { background: #f5f3ff; border-color: #ede9fe; }

                .card-lbl { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
                .card-val { font-size: 24px; font-weight: 800; color: #1e293b; margin: 4px 0; }
                .card-sub { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

                .preview-table-container {
                    flex: 1;
                    overflow: auto;
                    padding: 0 40px;
                }

                .preview-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .preview-table th {
                    position: sticky;
                    top: 0;
                    background: #f8fafc;
                    padding: 16px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    border-bottom: 2px solid #e2e8f0;
                    z-index: 10;
                }

                .group-header { background: #f1f5f9 !important; }
                .group-pf { color: #6366f1; border-bottom: 2px solid #6366f1 !important; }
                .group-pf-org { color: #8b5cf6; border-bottom: 2px solid #8b5cf6 !important; }
                .group-esi { color: #10b981; border-bottom: 2px solid #10b981 !important; }

                .sub-th { font-size: 10px; padding: 10px 20px !important; }

                .preview-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 14px;
                    vertical-align: middle;
                }

                .emp-name { font-weight: 700; color: #1e293b; }
                .emp-id { font-size: 11px; color: #94a3b8; margin-top: 2px; }

                .preview-footer {
                    padding: 24px 40px;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .footer-info { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 12px; }
                .footer-stats { display: flex; align-items: center; gap: 20px; color: #94a3b8; font-size: 12px; font-weight: 600; }
                .v-divider { width: 1px; height: 14px; background: #e2e8f0; }

                @keyframes slideIn {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default StatutoryReportPreview;
