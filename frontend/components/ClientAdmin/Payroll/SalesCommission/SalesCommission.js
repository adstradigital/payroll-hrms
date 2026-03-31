'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Plus, RefreshCw, Clock,
    CheckCircle2, X, AlertCircle, ChevronRight,
    DollarSign, FileText, Activity
} from 'lucide-react';
import {
    getCommissionRules, createCommissionRule,
    getSalesRecords, createSalesRecord,
    calculateCommissions, getCommissionHistory, approveCommission,
    getAllEmployees, getPayrollPeriods, getAllDesignations
} from '@/api/api_clientadmin';
import './SalesCommission.css';

export default function SalesCommission() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [periods, setPeriods] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');

    const [rules, setRules] = useState([]);
    const [sales, setSales] = useState([]);
    const [history, setHistory] = useState([]);

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

    const [ruleForm, setRuleForm] = useState({ name: '', rule_type: 'PERCENTAGE', value: '', designation: '', employee: '' });
    const [saleForm, setSaleForm] = useState({ employee: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference_number: '' });

    useEffect(() => { initData(); }, []);

    const initData = async () => {
        setLoading(true);
        try {
            const [pRes, eRes, dRes, rulesRes, histRes] = await Promise.all([
                getPayrollPeriods(),
                getAllEmployees(),
                getAllDesignations(),
                getCommissionRules(),
                getCommissionHistory({}),
            ]);
            const periodsData = pRes.data?.results || pRes.data || [];
            setPeriods(periodsData);
            setEmployees(eRes.data?.results || eRes.data || []);
            setDesignations(dRes.data?.results || dRes.data || []);
            setRules(rulesRes.data?.results || rulesRes.data || []);
            setHistory(histRes.data?.results || histRes.data || []);
            if (periodsData.length > 0) setSelectedPeriod(periodsData[0].id);
        } catch (err) {
            console.error('Init error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchForTab = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'overview' || tab === 'history') {
                const res = await getCommissionHistory(selectedPeriod ? { period: selectedPeriod } : {});
                setHistory(res.data?.results || res.data || []);
            }
            if (tab === 'rules') {
                const res = await getCommissionRules();
                setRules(res.data?.results || res.data || []);
            }
            if (tab === 'sales') {
                const res = await getSalesRecords();
                setSales(res.data?.results || res.data || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab === 'sales' && sales.length === 0) fetchForTab(tab);
        else if (tab === 'rules' && rules.length === 0) fetchForTab(tab);
        else if (tab === 'history') fetchForTab(tab);
    };

    const handleCalculate = async () => {
        if (!selectedPeriod) return alert('Please select a payroll period first');
        setActionLoading(true);
        try {
            const res = await calculateCommissions({ period: selectedPeriod });
            const results = res.data?.results || res.data || [];
            if (results.length === 0) {
                alert('No commissions calculated. Make sure you have:\n1. At least one active Commission Rule\n2. Sales Records for this period\n3. Employees matching the rule');
            } else {
                setHistory(results);
                alert(`✅ ${results.length} commission(s) calculated successfully!`);
            }
        } catch (err) {
            console.error(err);
            alert('Calculation failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (id, employeeName) => {
        if (!confirm(`Approve commission for ${employeeName}? This will create an AdhocPayment for the next payroll run.`)) return;
        setActionLoading(true);
        try {
            await approveCommission(id);
            fetchForTab('overview');
        } catch (err) {
            alert('Approval failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await createCommissionRule(ruleForm);
            setIsRuleModalOpen(false);
            setRuleForm({ name: '', rule_type: 'PERCENTAGE', value: '', designation: '', employee: '' });
            fetchForTab('rules');
        } catch (err) {
            alert('Failed: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        } finally { setActionLoading(false); }
    };

    const handleCreateSale = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await createSalesRecord(saleForm);
            setIsSaleModalOpen(false);
            setSaleForm({ employee: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference_number: '' });
            fetchForTab('sales');
        } catch (err) {
            alert('Failed: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        } finally { setActionLoading(false); }
    };

    const pendingHistory = history.filter(h => h.status === 'PENDING');
    const totalCommission = history.reduce((s, h) => s + parseFloat(h.calculated_amount || 0), 0);

    const EmptyState = ({ message, action, actionLabel }) => (
        <div className="commission-empty-state">
            <Activity size={48} className="commission-empty-icon" />
            <h3>{message}</h3>
            {action && <button className="commission-btn-primary" onClick={action}>{actionLabel}</button>}
        </div>
    );

    return (
        <div className="commission-container">
            {/* Header */}
            <header className="commission-page-header">
                <div className="commission-title-block">
                    <h1 className="commission-cinematic-title">Sales <span className="commission-title-accent">Commission</span></h1>
                    <p className="commission-cinematic-subtitle">Automated Performance Incentives</p>
                </div>
                <div className="commission-header-actions">
                    <select className="commission-select" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                        <option value="">Select Payroll Period</option>
                        {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="commission-btn-primary" onClick={handleCalculate} disabled={actionLoading || !selectedPeriod}>
                        <RefreshCw size={16} className={actionLoading ? 'spin' : ''} />
                        {actionLoading ? 'Calculating...' : 'Calculate Commissions'}
                    </button>
                </div>
            </header>

            {/* Workflow Guide — shown when no history exists */}
            {history.length === 0 && (
                <div className="commission-workflow-guide">
                    <p className="commission-workflow-title">Follow these steps to calculate commissions:</p>
                    <div className="commission-steps">
                        {[
                            { n: 1, t: 'Add a Rule', d: 'Go to Rules tab → Add Rule (e.g. 5% of Sales)', action: () => switchTab('rules') },
                            { n: 2, t: 'Record Sales', d: 'Go to Sales Records tab → Add Sale for an employee', action: () => switchTab('sales') },
                            { n: 3, t: 'Select Period & Calculate', d: 'Select a Payroll Period above, then click Calculate Commissions', action: null },
                            { n: 4, t: 'Approve', d: 'Approve each commission — it will be added to the next payroll run', action: null },
                        ].map(step => (
                            <div key={step.n} className="commission-step-card" onClick={step.action} style={{ cursor: step.action ? 'pointer' : 'default' }}>
                                <span className="commission-step-number">{step.n}</span>
                                <div>
                                    <div className="commission-step-title">{step.t}</div>
                                    <div className="commission-step-desc">{step.d}</div>
                                </div>
                                {step.action && <ChevronRight size={18} className="commission-step-arrow" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <nav className="commission-tabs">
                {['overview', 'sales', 'rules'].map(tab => (
                    <button key={tab} className={`commission-tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => switchTab(tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'overview' && pendingHistory.length > 0 && (
                            <span className="commission-tab-badge">{pendingHistory.length}</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="commission-content">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div>
                        <div className="commission-stats-grid">
                            <div className="commission-stat-card">
                                <span className="commission-stat-label">Pending Approval</span>
                                <div className="commission-stat-value">₹{pendingHistory.reduce((s, h) => s + parseFloat(h.calculated_amount || 0), 0).toLocaleString('en-IN')}</div>
                                <span className="commission-stat-count">{pendingHistory.length} employees</span>
                                <Clock className="commission-stat-icon-bg" size={64} />
                            </div>
                            <div className="commission-stat-card">
                                <span className="commission-stat-label">Total Commission</span>
                                <div className="commission-stat-value">₹{totalCommission.toLocaleString('en-IN')}</div>
                                <span className="commission-stat-count">{history.length} records</span>
                                <TrendingUp className="commission-stat-icon-bg" size={64} />
                            </div>
                        </div>

                        {history.length === 0 ? (
                            <EmptyState message="No commissions calculated yet for this period." action={handleCalculate} actionLabel="Calculate Now" />
                        ) : (
                            <div className="commission-table-container">
                                <table className="commission-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Total Sales</th>
                                            <th>Commission</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td><strong>{h.employee_name}</strong> <br /><small style={{ color: 'var(--text-secondary)' }}>{h.employee_id_display}</small></td>
                                                <td>₹{parseFloat(h.total_sales || 0).toLocaleString('en-IN')}</td>
                                                <td className="commission-font-mono">₹{parseFloat(h.calculated_amount || 0).toLocaleString('en-IN')}</td>
                                                <td><span className={`commission-status-badge commission-status-${(h.status || '').toLowerCase()}`}>{h.status}</span></td>
                                                <td>
                                                    {h.status === 'PENDING' && (
                                                        <button
                                                            className="commission-approve-btn"
                                                            onClick={() => handleApprove(h.id, h.employee_name)}
                                                            disabled={actionLoading}
                                                        >
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                    )}
                                                    {h.status === 'APPROVED' && <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>✓ Added to Payroll</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* SALES TAB */}
                {activeTab === 'sales' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button className="commission-btn-primary" onClick={() => setIsSaleModalOpen(true)}>
                                <Plus size={16} /> Add Sale
                            </button>
                        </div>
                        {sales.length === 0 ? (
                            <EmptyState message="No sales records yet." action={() => setIsSaleModalOpen(true)} actionLabel="Add First Sale" />
                        ) : (
                            <div className="commission-table-container">
                                <table className="commission-table">
                                    <thead><tr><th>Date</th><th>Employee</th><th>Amount</th><th>Reference</th><th>Description</th></tr></thead>
                                    <tbody>
                                        {sales.map(s => (
                                            <tr key={s.id}>
                                                <td>{s.date}</td>
                                                <td>{s.employee_name}</td>
                                                <td>₹{parseFloat(s.amount).toLocaleString('en-IN')}</td>
                                                <td>{s.reference_number || '—'}</td>
                                                <td>{s.description || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* RULES TAB */}
                {activeTab === 'rules' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button className="commission-btn-primary" onClick={() => setIsRuleModalOpen(true)}>
                                <Plus size={16} /> Add Rule
                            </button>
                        </div>
                        {rules.length === 0 ? (
                            <EmptyState message="No commission rules defined yet." action={() => setIsRuleModalOpen(true)} actionLabel="Add First Rule" />
                        ) : (
                            <div className="commission-table-container">
                                <table className="commission-table">
                                    <thead><tr><th>Rule Name</th><th>Type</th><th>Value</th><th>Assignment</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {rules.map(r => (
                                            <tr key={r.id}>
                                                <td><strong>{r.name}</strong></td>
                                                <td>{r.rule_type}</td>
                                                <td>{r.value}{r.rule_type === 'PERCENTAGE' ? '%' : ' ₹'}</td>
                                                <td>{r.employee_name || r.designation_name || 'Global (All Employees)'}</td>
                                                <td><span className={`commission-status-badge ${r.is_active ? 'commission-status-approved' : 'commission-status-rejected'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RULE MODAL */}
            {isRuleModalOpen && (
                <div className="commission-modal-overlay" onClick={() => setIsRuleModalOpen(false)}>
                    <div className="commission-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="commission-modal-header">
                            <h2 className="commission-modal-title">Create Commission Rule</h2>
                            <button className="commission-modal-close" onClick={() => setIsRuleModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateRule}>
                            <div className="commission-modal-body">
                                <div className="commission-form-group">
                                    <label>Rule Name *</label>
                                    <input className="commission-input" type="text" required value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. Sales Team 5%" />
                                </div>
                                <div className="commission-form-group">
                                    <label>Rule Type *</label>
                                    <select className="commission-select" value={ruleForm.rule_type} onChange={e => setRuleForm({ ...ruleForm, rule_type: e.target.value })}>
                                        <option value="PERCENTAGE">Percentage of Sales</option>
                                        <option value="FLAT">Flat Amount per Period</option>
                                    </select>
                                </div>
                                <div className="commission-form-group">
                                    <label>{ruleForm.rule_type === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'} *</label>
                                    <input className="commission-input" type="number" step="0.01" min="0" required value={ruleForm.value} onChange={e => setRuleForm({ ...ruleForm, value: e.target.value })} placeholder={ruleForm.rule_type === 'PERCENTAGE' ? 'e.g. 5.00' : 'e.g. 10000'} />
                                </div>
                                <div className="commission-form-group">
                                    <label>Apply to Designation (optional — blank = Global)</label>
                                    <select className="commission-select" value={ruleForm.designation} onChange={e => setRuleForm({ ...ruleForm, designation: e.target.value, employee: '' })}>
                                        <option value="">Global — All Employees</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="commission-form-group">
                                    <label>Apply to Specific Employee (optional)</label>
                                    <select className="commission-select" value={ruleForm.employee} onChange={e => setRuleForm({ ...ruleForm, employee: e.target.value, designation: '' })}>
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="commission-modal-footer">
                                <button type="button" className="commission-btn-secondary" onClick={() => setIsRuleModalOpen(false)}>Cancel</button>
                                <button type="submit" className="commission-btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Rule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SALE MODAL */}
            {isSaleModalOpen && (
                <div className="commission-modal-overlay" onClick={() => setIsSaleModalOpen(false)}>
                    <div className="commission-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="commission-modal-header">
                            <h2 className="commission-modal-title">Record New Sale</h2>
                            <button className="commission-modal-close" onClick={() => setIsSaleModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateSale}>
                            <div className="commission-modal-body">
                                <div className="commission-form-group">
                                    <label>Employee *</label>
                                    <select className="commission-select" required value={saleForm.employee} onChange={e => setSaleForm({ ...saleForm, employee: e.target.value })}>
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="commission-form-group">
                                    <label>Sale Amount (₹) *</label>
                                    <input className="commission-input" type="number" min="1" required value={saleForm.amount} onChange={e => setSaleForm({ ...saleForm, amount: e.target.value })} placeholder="e.g. 50000" />
                                </div>
                                <div className="commission-form-group">
                                    <label>Date *</label>
                                    <input className="commission-input" type="date" required value={saleForm.date} onChange={e => setSaleForm({ ...saleForm, date: e.target.value })} />
                                </div>
                                <div className="commission-form-group">
                                    <label>Reference # (Invoice/Order ID)</label>
                                    <input className="commission-input" type="text" value={saleForm.reference_number} onChange={e => setSaleForm({ ...saleForm, reference_number: e.target.value })} placeholder="e.g. INV-001" />
                                </div>
                                <div className="commission-form-group">
                                    <label>Description</label>
                                    <input className="commission-input" type="text" value={saleForm.description} onChange={e => setSaleForm({ ...saleForm, description: e.target.value })} placeholder="Optional notes about this sale" />
                                </div>
                            </div>
                            <div className="commission-modal-footer">
                                <button type="button" className="commission-btn-secondary" onClick={() => setIsSaleModalOpen(false)}>Cancel</button>
                                <button type="submit" className="commission-btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Sale'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
