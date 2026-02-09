'use client';

import React, { useState, useEffect } from 'react';
import {
    Play, Calendar, Users, DollarSign, AlertCircle,
    CheckCircle, FileText, Loader2, ArrowRight, ShieldCheck,
    Activity, Lock, ChevronRight, Zap, AlertTriangle,
    TrendingUp, Sliders, X, Trash2
} from 'lucide-react';
import {
    getPayrollPeriods, generateAdvancedPayroll,
    deletePayrollPeriod,
    markPeriodAsPaid, getAllEmployees, getEmployeeSalaryStats,
    getSecurityProfile, verifySecurityPin
} from '@/api/api_clientadmin';
import Link from 'next/link';
import './RunPayroll.css';

export default function RunPayroll() {
    const [step, setStep] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [existingPeriod, setExistingPeriod] = useState(null);

    // Advanced UI States
    const [bootSequence, setBootSequence] = useState(false);
    const [startDate, setStartDate] = useState(Date.now());
    const [securityPin, setSecurityPin] = useState(['', '', '', '']);
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [securityProfile, setSecurityProfile] = useState(null);
    const [pinLoading, setPinLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');

    const [bonusPool, setBonusPool] = useState(0); // Simulation state only for now
    const [activeEmployeeCount, setActiveEmployeeCount] = useState(0);
    const [salaryStats, setSalaryStats] = useState({ total_net_salary: 0 });

    // Preview State
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (step === 2) {
            fetchActiveEmployees();
        }
    }, [step]);

    const fetchActiveEmployees = async () => {
        try {
            const [empRes, statsRes] = await Promise.all([
                getAllEmployees({ status: 'active', page_size: 1 }),
                getEmployeeSalaryStats()
            ]);

            if (empRes.data) {
                // If paginated, count is in res.data.count, else length of results
                const count = empRes.data.count || (Array.isArray(empRes.data) ? empRes.data.length : (empRes.data.results ? empRes.data.results.length : 0));
                setActiveEmployeeCount(count);
            }

            if (statsRes.data) {
                setSalaryStats(statsRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch payroll data", error);
        }
    };

    useEffect(() => {
        setBootSequence(true);
        fetchSecurityProfile();
    }, []);

    const fetchSecurityProfile = async () => {
        try {
            const response = await getSecurityProfile();
            if (response.data.success) {
                setSecurityProfile(response.data.profile);
                // If PIN is not enabled, we consider it verified for the UI 
                // but we should check clearance separately
                if (!response.data.profile.is_pin_enabled) {
                    setIsPinVerified(true);
                }
            }
        } catch (error) {
            console.error('Error fetching security profile:', error);
        }
    };

    useEffect(() => {
        checkExistingPeriod();
    }, [selectedMonth]);

    const checkExistingPeriod = async () => {
        setLoading(true);
        // Reset states
        setSecurityPin(['', '', '', '']);
        setIsPinVerified(false);

        try {
            const [year, month] = selectedMonth.split('-');
            const res = await getPayrollPeriods({
                month: parseInt(month),
                year: parseInt(year)
            });

            if (res.data && res.data.results && res.data.results.length > 0) {
                setExistingPeriod(res.data.results[0]);
                setStep(3);
            } else {
                setExistingPeriod(null);
                setStep(1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!existingPeriod) return;
        if (!confirm('Are you sure you want to delete this payroll data and restart? This cannot be undone.')) return;

        setProcessing(true);
        try {
            await deletePayrollPeriod(existingPeriod.id);
            setExistingPeriod(null);
            setStep(1); // Go back to Period Selection
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to generate payroll';
            alert(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleGeneratePayroll = async (force = false) => {
        if (!isPinVerified && step === 2 && !force) return;

        setProcessing(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const res = await generateAdvancedPayroll({
                month: parseInt(month),
                year: parseInt(year),
                action: 'generate',
                force: force // Add force flag
            });

            setExistingPeriod({
                id: res.data.period_id,
                month: parseInt(month),
                year: parseInt(year),
                total_net: res.data.total_net,
                total_gross: res.data.total_gross || "0",
                total_lop: res.data.total_lop || "0",
                total_statutory: res.data.total_statutory || "0",
                total_advance_recovery: res.data.total_advance_recovery || "0",
                total_deductions: res.data.total_deductions || "0",
                total_employees: res.data.total_employees,
                status: 'Completed'
            });
            setStep(3);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || "Failed to generate payroll";

            if (errorMsg.includes('force=true') && !force) {
                if (window.confirm('Payroll already exists for this period. Do you want to overwrite and regenerate it?')) {
                    handleGeneratePayroll(true);
                    return;
                }
            } else {
                alert(errorMsg);
            }
        } finally {
            setProcessing(false);
        }
    };

    const fetchPreview = async () => {
        setLoadingPreview(true);
        setError(null);
        try {
            const [year, month] = selectedMonth.split('-');
            const res = await generateAdvancedPayroll({
                month: parseInt(month),
                year: parseInt(year),
                action: 'generate',
                preview: true // Use preview mode
            });

            if (res.data && res.data.preview) {
                setPreviewData(res.data);
            }
        } catch (error) {
            console.error("Preview failed", error);
            setError(error.response?.data?.error || "Failed to load preview");
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleInitiate = () => {
        setStep(2);
        setActiveTab('preview');
        fetchPreview();
    };

    // Pin logic (Real backend verification)
    const handlePinChange = async (index, value) => {
        if (value.length > 1) return;
        const newPin = [...securityPin];
        newPin[index] = value;
        setSecurityPin(newPin);

        if (value && index < 3) {
            document.getElementById(`pin-${index + 1}`)?.focus();
        }

        const pinString = newPin.join('');
        if (pinString.length === 4) {
            try {
                setPinLoading(true);
                const response = await verifySecurityPin({ pin: pinString });
                if (response.data.success) {
                    setIsPinVerified(true);
                }
            } catch (error) {
                console.error('PIN verification failed:', error);
                setSecurityPin(['', '', '', '']);
                document.getElementById('pin-0')?.focus();
                alert(error.response?.data?.error || 'Incorrect PIN');
            } finally {
                setPinLoading(false);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getMonthName = (dateStr) => {
        const date = new Date(dateStr + '-01');
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    // Estimated calculation for preview using actual salary data
    const estimatedCost = (parseFloat(salaryStats.total_net_salary) || 0) * (1 + (bonusPool / 100));

    return (
        <div className={`rp-container ${bootSequence ? 'rp-booted' : ''}`}>

            {/* Ambient Background */}
            <div className="rp-ambient-bg">
                <div className="rp-blob rp-blob-1"></div>
                <div className="rp-blob rp-blob-2"></div>
                <div className="rp-noise"></div>
            </div>

            <div className="rp-content-wrapper">

                {/* Header */}
                <header className="rp-header">
                    <div>
                        <div className="rp-system-status">
                            <Activity size={12} className="rp-pulse" />
                            <span>System v4.0.1 Online</span>
                        </div>
                        <h1 className="rp-title">
                            Payroll <span className="text-gradient">Command</span>
                        </h1>
                        <p className="rp-subtitle">Advanced financial control unit. Secure session active.</p>
                    </div>
                    <div className="rp-security-badge">
                        <div className="rp-label-mono">ENCRYPTION LEVEL</div>
                        <div className="rp-value-mono text-emerald">
                            <ShieldCheck size={16} /> 256-BIT AES
                        </div>
                    </div>
                </header>

                {/* Progress Steps */}
                <div className="rp-steps">
                    <div className="rp-progress-track">
                        <div className="rp-step-line-bg"></div>
                        <div className="rp-step-line-fill" style={{ width: `${(step - 1) * 50}%` }}></div>
                    </div>

                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`rp-step-item ${s <= step ? 'active' : ''} ${s === step ? 'current' : ''}`}>
                            <div className="rp-step-circle">
                                {s < step ? <CheckCircle size={18} /> : s}
                            </div>
                            <span className="rp-step-text">
                                {s === 1 ? 'Period' : s === 2 ? 'Analysis' : 'Execution'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="rp-viewport">
                    {loading ? (
                        <div className="rp-loading">
                            <div className="rp-spinner-outer">
                                <div className="rp-spinner-inner"></div>
                            </div>
                            <p className="rp-loading-text">CALIBRATING FINANCIAL MODELS...</p>
                        </div>
                    ) : (
                        <>
                            {/* STEP 1: SELECT PERIOD */}
                            {step === 1 && (
                                <div className="rp-card-center">
                                    <div className="rp-card rp-card-glow">
                                        <div className="rp-card-blur-glow"></div>

                                        <div className="rp-card-header">
                                            <div className="rp-icon-box">
                                                <Calendar size={24} />
                                            </div>
                                            <h2>Select Fiscal Period</h2>
                                        </div>

                                        <div className="rp-form-group">
                                            <div className="rp-month-selector">
                                                <button
                                                    className="rp-month-btn"
                                                    onClick={() => document.getElementById('month-picker').showPicker()}
                                                >
                                                    <div className="rp-month-info">
                                                        <Calendar size={20} className="rp-month-icon" />
                                                        <div className="rp-month-text">
                                                            <span className="rp-label-sm">Billing Period</span>
                                                            <span className="rp-value-lg">{getMonthName(selectedMonth)}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="rp-month-arrow" />
                                                </button>
                                                <input
                                                    id="month-picker"
                                                    type="month"
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                    className="rp-hidden-input"
                                                />
                                            </div>
                                        </div>

                                        <button onClick={handleInitiate} className="rp-btn-primary rp-btn-block group">
                                            <span className="rp-btn-content">
                                                INITIATE ANALYSIS <ArrowRight size={18} />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: REVIEW & PROCESS */}
                            {step === 2 && (
                                <div className="rp-grid animate-slide-up">
                                    {/* Left Panel: Preview Data */}
                                    <div className="rp-col-main">
                                        <div className="rp-tabs">
                                            <button
                                                className={`rp-tab ${activeTab === 'preview' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('preview')}
                                            >Payroll Preview</button>
                                            <button
                                                className={`rp-tab ${activeTab === 'anomalies' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('anomalies')}
                                            >AI Insights <span className="rp-badge">2</span></button>
                                        </div>

                                        {activeTab === 'preview' && (
                                            <div className="rp-tab-content animate-fade-in">
                                                {loadingPreview ? (
                                                    <div className="p-10 text-center">
                                                        <Loader2 className="animate-spin text-gold mx-auto mb-3" size={32} />
                                                        <p className="text-secondary">Calculating payroll preview...</p>
                                                    </div>
                                                ) : error ? (
                                                    <div className="p-6 text-center text-red-500 bg-red-900/10 rounded-lg border border-red-900/30">
                                                        <AlertTriangle className="mx-auto mb-2" />
                                                        {error}
                                                        <button onClick={fetchPreview} className="mt-4 px-4 py-2 bg-red-900/20 rounded hover:bg-red-900/30 text-sm">Retry</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="rp-stats-grid">
                                                            <div className="rp-stat-box">
                                                                <div className="rp-stat-header">
                                                                    <span>Est. Net Disbursal</span>
                                                                    <TrendingUp size={16} className="text-emerald" />
                                                                </div>
                                                                <div className="rp-stat-value">
                                                                    {previewData ? formatCurrency(previewData.summary.total_net) : '--'}
                                                                </div>
                                                                <div className="rp-stat-meta">
                                                                    {previewData ? previewData.summary.employee_count : 0} Employees
                                                                </div>
                                                            </div>
                                                            <div className="rp-stat-box">
                                                                <div className="rp-stat-header">
                                                                    <span>Attendance Deductions</span>
                                                                    <AlertTriangle size={16} className="text-red-400" />
                                                                </div>
                                                                <div className="rp-stat-value text-red-400">
                                                                    {previewData ? formatCurrency(previewData.summary.total_lop) : '--'}
                                                                </div>
                                                                <div className="rp-stat-meta">Loss of Pay (LOP)</div>
                                                            </div>
                                                            <div className="rp-stat-box">
                                                                <div className="rp-stat-header">
                                                                    <span>Statutory Deductions</span>
                                                                    <ShieldCheck size={16} className="text-amber-500" />
                                                                </div>
                                                                <div className="rp-stat-value text-amber-500">
                                                                    {previewData ? formatCurrency(previewData.summary.total_statutory) : '--'}
                                                                </div>
                                                                <div className="rp-stat-meta">PF, ESI & Taxes</div>
                                                            </div>
                                                            <div className="rp-stat-box">
                                                                <div className="rp-stat-header">
                                                                    <span>Advance Recovery</span>
                                                                    <ArrowRight size={16} className="text-blue-400" />
                                                                </div>
                                                                <div className="rp-stat-value text-blue-400">
                                                                    {previewData ? formatCurrency(previewData.summary.total_advance_recovery) : '--'}
                                                                </div>
                                                                <div className="rp-stat-meta">Salary Advances</div>
                                                            </div>
                                                        </div>

                                                        {/* Employee Preview Table */}
                                                        <div className="mt-6 border border-[#222] rounded-lg overflow-hidden bg-[#0a0a0a]">
                                                            <div className="p-3 bg-[#111] border-b border-[#222] flex justify-between items-center">
                                                                <h4 className="text-sm font-bold text-secondary uppercase tracking-wider">Employee Impact Preview</h4>
                                                                <span className="text-xs text-muted">Review before execution</span>
                                                            </div>
                                                            <div className="overflow-x-auto max-h-[300px]">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead className="text-xs text-muted uppercase bg-[#151515] sticky top-0">
                                                                        <tr>
                                                                            <th className="px-4 py-3">Employee</th>
                                                                            <th className="px-4 py-3 text-right">Gross Pay</th>
                                                                            <th className="px-4 py-3 text-right text-red-400">LOP</th>
                                                                            <th className="px-4 py-3 text-right text-amber-500">Statutory</th>
                                                                            <th className="px-4 py-3 text-right text-blue-400">Advance</th>
                                                                            <th className="px-4 py-3 text-right">Net Salary</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-[#222]">
                                                                        {previewData?.employees.map((emp, idx) => (
                                                                            <tr key={idx} className="hover:bg-[#111]">
                                                                                <td className="px-4 py-2 font-medium">
                                                                                    <div className="text-white">{emp.name}</div>
                                                                                    <div className="text-xs text-muted">{emp.designation}</div>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-white">
                                                                                    {formatCurrency(emp.gross_pay)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-red-400">
                                                                                    {emp.lop_deduction > 0 ? `-${Math.round(emp.lop_deduction)}` : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-amber-500">
                                                                                    {emp.statutory_deductions > 0 ? `-${Math.round(emp.statutory_deductions)}` : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-blue-400">
                                                                                    {emp.advance_recovery > 0 ? `-${Math.round(emp.advance_recovery)}` : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono font-bold text-white">
                                                                                    {formatCurrency(emp.net_pay)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'anomalies' && (
                                            <div className="rp-tab-content animate-fade-in">
                                                <div className="rp-alert rp-alert-danger">
                                                    <div className="rp-alert-icon"><AlertTriangle size={20} /></div>
                                                    <div>
                                                        <h4>High Overtime Detected</h4>
                                                        <p>3 Employees have logged &gt;40 hours overtime. Review recommended.</p>
                                                    </div>
                                                </div>
                                                <div className="rp-alert rp-alert-info">
                                                    <div className="rp-alert-icon"><Activity size={20} /></div>
                                                    <div>
                                                        <h4>New Tax Regime</h4>
                                                        <p>5 Employees switched to New Tax Regime recently.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Panel: Security */}
                                    <div className="rp-col-side">
                                        <div className="rp-security-card">
                                            <div className="rp-security-grid-bg"></div>
                                            <div className="rp-security-content">
                                                <h3 className="rp-security-title">
                                                    <Lock size={18} /> Authorization Required
                                                </h3>

                                                {!isPinVerified ? (
                                                    <div className="rp-pin-pad">
                                                        <p className="rp-pin-label">ENTER SECURITY PIN</p>
                                                        <div className="rp-pin-inputs">
                                                            {securityPin.map((digit, idx) => (
                                                                <input
                                                                    key={idx}
                                                                    id={`pin-${idx}`}
                                                                    type="password"
                                                                    maxLength={1}
                                                                    value={digit}
                                                                    autoComplete="off"
                                                                    disabled={pinLoading}
                                                                    onChange={(e) => handlePinChange(idx, e.target.value)}
                                                                    className="rp-pin-input"
                                                                />
                                                            ))}
                                                        </div>
                                                        {pinLoading && <div className="text-[10px] text-center mt-2 animate-pulse text-brand">Verifying Clearance...</div>}
                                                    </div>
                                                ) : securityProfile?.clearance_level < 4 ? (
                                                    <div className="rp-alert rp-alert-danger animate-zoom-in" style={{ marginTop: '1rem' }}>
                                                        <div className="rp-alert-icon"><AlertTriangle size={20} /></div>
                                                        <div>
                                                            <h4>Access Denied</h4>
                                                            <p>Level 4 (Critical) Clearance required to execute payroll. Your current level: {securityProfile?.clearance_level}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rp-verified-badge animate-zoom-in">
                                                        <div className="rp-verified-icon"><CheckCircle size={20} /></div>
                                                        <span className="rp-verified-text">Identity Verified</span>
                                                    </div>
                                                )}

                                                <p className="rp-security-note">
                                                    You are authorizing the payroll generation for <strong>{getMonthName(selectedMonth)}</strong>.
                                                </p>
                                            </div>

                                            <div className="rp-security-actions">
                                                <button
                                                    onClick={() => handleGeneratePayroll(false)}
                                                    disabled={!isPinVerified || processing || (securityProfile?.clearance_level < 4)}
                                                    className={`rp-btn-execute ${isPinVerified && !processing && (securityProfile?.clearance_level >= 4) ? 'ready' : 'disabled'}`}
                                                >
                                                    {processing ? (
                                                        <><Loader2 className="animate-spin" size={20} /> EXECUTING...</>
                                                    ) : (
                                                        <><Zap size={18} /> EXECUTE PAYROLL</>
                                                    )}
                                                </button>
                                                <button onClick={() => setStep(1)} className="rp-btn-cancel">
                                                    CANCEL OPERATION
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SUCCESS */}
                            {step === 3 && existingPeriod && (
                                <div className="rp-success-container animate-zoom-in">
                                    <div className="rp-success-card">
                                        <div className="rp-success-beam"></div>
                                        <div className="rp-success-content">
                                            <div className="rp-success-icon-box">
                                                <CheckCircle size={48} />
                                            </div>

                                            <h2>Funds Disbursed</h2>
                                            <p className="rp-tx-hash">TRANSACTION ID: {existingPeriod.id}</p>

                                            <div className="rp-receipt">
                                                <div className="rp-receipt-row">
                                                    <div>
                                                        <span className="rp-receipt-label">Period</span>
                                                        <span className="rp-receipt-val">{getMonthName(`${existingPeriod.year}-${existingPeriod.month.toString().padStart(2, '0')}`)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="rp-receipt-label">Recipients</span>
                                                        <span className="rp-receipt-val">{existingPeriod.total_employees}</span>
                                                    </div>
                                                </div>
                                                <div className="rp-receipt-divider"></div>

                                                {/* Calculation Breakdown */}
                                                <div className="rp-calc-breakdown">
                                                    <div className="rp-calc-row">
                                                        <span>Potential Cost</span>
                                                        {/* Potential = Actual Gross + LOP Deducted */}
                                                        <span>{formatCurrency(Number(existingPeriod.total_gross) + Number(existingPeriod.total_lop))}</span>
                                                    </div>
                                                    <div className="rp-calc-row text-danger">
                                                        <span>Attendance Deductions</span>
                                                        <span>- {formatCurrency(existingPeriod.total_lop)}</span>
                                                    </div>
                                                    <div className="rp-calc-row" style={{ color: '#f59e0b' }}>
                                                        <span>Statutory Deductions</span>
                                                        <span>- {formatCurrency(existingPeriod.total_statutory)}</span>
                                                    </div>
                                                    <div className="rp-calc-row" style={{ color: '#60a5fa' }}>
                                                        <span>Advance Salary Recovery</span>
                                                        <span>- {formatCurrency(existingPeriod.total_advance_recovery)}</span>
                                                    </div>
                                                    <div className="rp-calc-row rp-calc-total">
                                                        <span>Net Disbursal</span>
                                                        <span className="text-emerald">{formatCurrency(existingPeriod.total_net)}</span>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="rp-success-actions">
                                                <button
                                                    onClick={() => handleGeneratePayroll(true)}
                                                    className="rp-btn-outline"
                                                    disabled={processing}
                                                    style={{ border: '1px solid #f59e0b', color: '#f59e0b' }}
                                                >
                                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                                    Re-Run (Bypass)
                                                </button>
                                                <button
                                                    onClick={handleReset}
                                                    className="rp-btn-outline"
                                                    disabled={processing}
                                                    style={{ border: '1px solid #ef4444', color: '#ef4444' }}
                                                >
                                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                    Reset Data
                                                </button>
                                                <Link href="/dashboard/payroll/payslips" className="rp-btn-outline">
                                                    <FileText size={18} /> Payslips
                                                </Link>
                                                <Link href="/dashboard/payroll" className="rp-btn-primary">
                                                    <ArrowRight size={18} /> Dashboard
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
