'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Edit2, Wallet,
    TrendingUp, Briefcase, RefreshCw, Loader2,
    ArrowUpRight, ArrowDownRight,
    X, Save, Landmark, History, User, Building, AlertCircle,
    FileText
} from 'lucide-react';
import {
    getEmployeeSalaries,
    getAllEmployees,
    getSalaryStructures,
    createEmployeeSalary,
    updateEmployeeSalary
} from '@/api/api_clientadmin';
import './EmployeeSalary.css';

/**
 * Premium Modal for Salary Assignment - Exact Design Match (Target Image 0)
 */
const SalaryAssignmentForm = ({ assignment, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        employee: '',
        salary_structure: '',
        basic_amount: '',
        effective_from: new Date().toISOString().split('T')[0],
        is_current: true,
        remarks: ''
    });

    const [components, setComponents] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [empRes, structRes] = await Promise.all([
                    getAllEmployees({ status: 'active' }),
                    getSalaryStructures({ is_active: true })
                ]);
                setEmployees(empRes.data.results || empRes.data || []);
                setStructures(structRes.data.results || structRes.data || []);
            } catch (error) {
                console.error("Error fetching options", error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchOptions();
    }, []);

    // Load existing assignment data
    useEffect(() => {
        if (assignment) {
            setFormData({
                employee: assignment.employee?.id || assignment.employee,
                salary_structure: assignment.salary_structure?.id || assignment.salary_structure,
                basic_amount: assignment.basic_amount || '',
                effective_from: assignment.effective_from || new Date().toISOString().split('T')[0],
                is_current: assignment.is_current,
                remarks: assignment.remarks || ''
            });

            if (assignment.components) {
                setComponents(assignment.components.map(c => ({
                    component: c.id || c.component,
                    component_name: c.component_name || 'Component',
                    component_type: c.component_type || 'earning',
                    amount: c.amount,
                    is_manual: true
                })));
            }
        }
    }, [assignment]);

    // Recalculate components when Structure or Basic changes
    useEffect(() => {
        if (!formData.salary_structure || !formData.basic_amount || assignment) return;

        const structure = structures.find(s => s.id === parseInt(formData.salary_structure));
        if (structure && structure.components) {
            const basic = parseFloat(formData.basic_amount) || 0;

            const calculated = structure.components.map(sc => {
                let amount = 0;
                if (sc.amount > 0) {
                    amount = parseFloat(sc.amount);
                } else if (sc.percentage > 0) {
                    amount = (basic * parseFloat(sc.percentage)) / 100;
                } else {
                    amount = parseFloat(sc.component_details?.default_amount || 0);
                }

                return {
                    component: sc.component,
                    component_name: sc.component_name || 'Component',
                    component_type: sc.component_type || 'earning',
                    amount: amount.toFixed(2),
                    is_manual: false
                };
            });
            setComponents(calculated);
        }
    }, [formData.salary_structure, formData.basic_amount, structures, assignment]);

    const handleComponentChange = (index, val) => {
        const newComponents = [...components];
        newComponents[index] = {
            ...newComponents[index],
            amount: val,
            is_manual: true
        };
        setComponents(newComponents);
    };

    const handleReset = () => {
        if (!formData.salary_structure || !formData.basic_amount) return;
        const structure = structures.find(s => s.id === parseInt(formData.salary_structure));
        if (structure && structure.components) {
            const basic = parseFloat(formData.basic_amount) || 0;
            const reset = structure.components.map(sc => {
                let amount = sc.amount > 0 ? parseFloat(sc.amount) : (basic * parseFloat(sc.percentage)) / 100;
                return {
                    component: sc.component,
                    component_name: sc.component_name,
                    component_type: sc.component_type,
                    amount: amount.toFixed(2),
                    is_manual: false
                };
            });
            setComponents(reset);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                components: components.map(c => ({
                    component: c.component,
                    amount: parseFloat(c.amount)
                }))
            };

            let res;
            if (assignment) {
                res = await updateEmployeeSalary(assignment.id, payload);
            } else {
                res = await createEmployeeSalary(payload);
            }
            onSuccess(res.data);
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to save salary assignment");
        } finally {
            setLoading(false);
        }
    };

    const totalEarnings = components.filter(c => c.component_type === 'earning').reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
    const totalDeductions = components.filter(c => c.component_type === 'deduction').reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
    const basicPay = parseFloat(formData.basic_amount) || 0;
    const netSalary = (basicPay + totalEarnings) - totalDeductions;

    return (
        <div className="modal-overlay">
            <div className="modal-content-premium">
                <div className="modal-header-premium">
                    <div className="header-info-box">
                        <div className="header-icon-container"><Wallet size={24} /></div>
                        <div className="header-text-container">
                            <h3 className="modal-title-text">Salary Assignment</h3>
                            <p className="modal-subtitle-text">Define fixed monthly compensation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form-layout">
                    <div className="modal-body-premium custom-scroll">
                        {fetchingData ? (
                            <div className="loading-state-full"><Loader2 className="animate-spin text-brand-primary" size={48} /></div>
                        ) : (
                            <>
                                {/* SECTION 1: BASIC INFORMATION */}
                                <div className="form-column-basics">
                                    <div className="form-section-header">
                                        <div className="flex-center-gap">
                                            <div className="section-accent"></div>
                                            <h4 className="section-title">SECTION 1: BASIC INFORMATION</h4>
                                        </div>
                                    </div>

                                    <div className="form-group-item">
                                        <label className="field-label">Employee Name</label>
                                        <select
                                            className="custom-select-premium"
                                            value={formData.employee}
                                            onChange={e => setFormData({ ...formData, employee: e.target.value })}
                                            disabled={!!assignment}
                                            required
                                        >
                                            <option value="">Search & Select Employee...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="primary-config-box">
                                        <div className="form-group-item">
                                            <label className="secondary-label">Salary Structure</label>
                                            <select
                                                className="custom-select-premium"
                                                value={formData.salary_structure}
                                                onChange={e => setFormData({ ...formData, salary_structure: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Compensation Structure...</option>
                                                {structures.map(str => (
                                                    <option key={str.id} value={str.id}>{str.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group-item">
                                            <label className="secondary-label">Basic Salary (Monthly)</label>
                                            <div className="input-with-symbol">
                                                <span className="input-symbol">$</span>
                                                <input
                                                    type="number"
                                                    className="premium-form-input basic-pay-input"
                                                    placeholder="0.00"
                                                    value={formData.basic_amount}
                                                    onChange={e => setFormData({ ...formData, basic_amount: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row-compact">
                                        <div className="form-group-item">
                                            <label className="field-label">Effective From</label>
                                            <input
                                                type="date"
                                                className="premium-form-input"
                                                value={formData.effective_from}
                                                onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="checkbox-alignment-wrapper">
                                            <label className="custom-checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    className="hidden-checkbox"
                                                    checked={formData.is_current}
                                                    onChange={e => setFormData({ ...formData, is_current: e.target.checked })}
                                                />
                                                <span className="checkbox-visual"></span>
                                                <span className="checkbox-label">Mark as Current Salary</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-group-item">
                                        <label className="field-label">Remarks (Optional)</label>
                                        <textarea
                                            className="premium-textarea"
                                            rows={2}
                                            value={formData.remarks}
                                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                            placeholder="Reason for salary change..."
                                        />
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: COMPONENTS & SUMMARY */}
                                <div className="form-column-breakdown">
                                    {/* SECTION 2: COMPONENTS */}
                                    <div className="breakdown-stack">
                                        <div className="form-section-header breakdown-header">
                                            <div className="flex-center-gap">
                                                <div className="section-accent" style={{ background: '#3b82f6' }}></div>
                                                <h4 className="section-title">SECTION 2: COMPONENTS</h4>
                                            </div>
                                            <button type="button" onClick={handleReset} className="reset-calc-btn">
                                                <RefreshCw size={10} /> RESET AUTO-CALC
                                            </button>
                                        </div>

                                        <div className="component-list-premium custom-scroll">
                                            {components.length === 0 ? (
                                                <div className="empty-breakdown-state">
                                                    <Briefcase size={40} />
                                                    <p className="empty-text">Select structure & basic salary to calculate.</p>
                                                </div>
                                            ) : (
                                                components.map((comp, idx) => (
                                                    <div key={idx} className={`component-item-premium ${comp.is_manual ? 'overridden' : ''}`}>
                                                        <div className="comp-info">
                                                            <div className="comp-name-row">
                                                                {comp.component_name}
                                                                {comp.is_manual && <span className="manual-flag">MODIFIED</span>}
                                                            </div>
                                                            <div className={`comp-type-tag ${comp.component_type === 'earning' ? 'text-green' : 'text-red'}`}>
                                                                {comp.component_type}
                                                            </div>
                                                        </div>
                                                        <div className="comp-input-wrapper">
                                                            <span className="comp-symbol">$</span>
                                                            <input
                                                                type="number"
                                                                className={`component-input-premium ${comp.is_manual ? 'manual' : ''}`}
                                                                value={comp.amount}
                                                                onChange={(e) => handleComponentChange(idx, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* SECTION 3: SUMMARY */}
                                    <div className="summary-stack">
                                        <div className="form-section-header">
                                            <div className="flex-center-gap" style={{ opacity: 0.5 }}>
                                                <div className="section-accent" style={{ opacity: 0.3 }}></div>
                                                <h4 className="section-title">SECTION 3: SUMMARY</h4>
                                            </div>
                                        </div>

                                        <div className="summary-list-container">
                                            <div className="summary-row">
                                                <span>Basic Salary</span>
                                                <span className="summary-amount">${basicPay.toLocaleString()}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span className="text-green">↗ Total Earnings</span>
                                                <span className="summary-amount text-green">${totalEarnings.toLocaleString()}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span className="text-red">↘ Total Deductions</span>
                                                <span className="summary-amount text-red">-${totalDeductions.toLocaleString()}</span>
                                            </div>
                                            <div className="summary-row main-net">
                                                <span>Net Salary</span>
                                                <span className="summary-amount amount-accent">${netSalary.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer-premium">
                        <button type="button" onClick={onClose} className="btn-cancel-plain">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-shimmer-gold">
                            {loading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                            <span>Assign Salary</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function EmployeeSalary() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await getEmployeeSalaries();
            setAssignments(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        fetchAssignments();
        setShowForm(false);
        setSelectedAssignment(null);
    };

    const openModal = (assign = null) => {
        setSelectedAssignment(assign);
        setShowForm(true);
    };

    const filtered = assignments.filter(a =>
        (a.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.employee_id_display || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = useMemo(() => {
        const total = assignments.reduce((acc, curr) => acc + (parseFloat(curr.basic_amount) || 0), 0);
        const avg = assignments.length ? total / assignments.length : 0;
        return { total, avg, count: assignments.length };
    }, [assignments]);

    return (
        <div className="employee-salary-container">
            <header className="page-header-premium">
                <div className="title-block">
                    <h1 className="cinematic-title">
                        OFFICIAL <span className="title-accent">SALARY RECORDS</span>
                    </h1>
                    <p className="cinematic-subtitle">Manage Employee Fixed Compensation and Packages</p>
                </div>
                <div className="header-action-panel">
                    <button className="btn-refresh-premium" onClick={fetchAssignments} title="Refresh Data">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-gold-premium" onClick={() => openModal()}>
                        <Plus size={20} />
                        <span>Assign New</span>
                    </button>
                </div>
            </header>

            <section className="salary-dash-grid">
                <article className="salary-dash-card">
                    <div className="dash-label">Total Monthly Fixed Payroll</div>
                    <div className="dash-value">${stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <Wallet size={64} className="dash-icon-bg" />
                    <ArrowUpRight className="stats-indicator text-green" size={24} />
                </article>
                <article className="salary-dash-card">
                    <div className="dash-label">Average Base Salary</div>
                    <div className="dash-value text-brand-accent">${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <TrendingUp size={64} className="dash-icon-bg" />
                </article>
                <article className="salary-dash-card">
                    <div className="dash-label">Defined Distributions</div>
                    <div className="dash-value">{stats.count}</div>
                    <Briefcase size={64} className="dash-icon-bg" />
                    <Landmark className="stats-indicator text-gold-dim" size={24} />
                </article>
            </section>

            <div className="salary-toolbar-layout">
                <div className="salary-search-container">
                    <Search size={20} className="search-icon-dim" />
                    <input
                        className="salary-search-input"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="salary-table-container">
                {loading ? (
                    <div className="loading-overlay-premium"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>
                ) : (
                    <table className="salary-table">
                        <thead>
                            <tr>
                                <th>Employee Entity</th>
                                <th>Structure Package</th>
                                <th>Monthly Basic</th>
                                <th>Effective Since</th>
                                <th>Status</th>
                                <th className="text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((assign, idx) => (
                                <tr key={assign.id || idx}>
                                    <td>
                                        <div className="emp-entity-cell">
                                            <div className="salary-avatar-circle">
                                                {assign.employee_name?.charAt(0) || <User size={18} />}
                                            </div>
                                            <div className="emp-info-text">
                                                <div className="emp-name-text">{assign.employee_name}</div>
                                                <div className="emp-id-text">{assign.employee_id_display}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="structure-cell">
                                            <Building size={14} className="title-accent" />
                                            <span className="structure-name-text">{assign.structure_name || 'Standard'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="salary-amount-label">${parseFloat(assign.basic_amount).toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <History size={14} />
                                            {assign.effective_from}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge-premium ${assign.is_current ? 'status-active-premium' : 'status-history-premium'}`}>
                                            {assign.is_current ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-edit-btn" onClick={() => openModal(assign)}>
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="empty-table-state">
                        <AlertCircle size={48} className="empty-table-icon" />
                        <h3 className="empty-table-title">No matching salary assignments</h3>
                        <p className="empty-table-subtitle">Try adjusting your search criteria or add a new one.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <SalaryAssignmentForm
                    assignment={selectedAssignment}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
