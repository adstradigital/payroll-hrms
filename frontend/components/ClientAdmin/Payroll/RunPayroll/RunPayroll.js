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
    deletePayrollPeriod, // Import delete function
    markPeriodAsPaid, getAllEmployees, getEmployeeSalaryStats
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
    const [activeTab, setActiveTab] = useState('overview');

    const [bonusPool, setBonusPool] = useState(0); // Simulation state only for now
    const [activeEmployeeCount, setActiveEmployeeCount] = useState(0);
    const [salaryStats, setSalaryStats] = useState({ total_net_salary: 0 });

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
    }, []);

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
                total_employees: res.data.total_employees,
                status: 'Completed'
            });
            setStep(3);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || "Failed to generate payroll";
            alert(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    // Pin logic (Client side security simulation)
    const handlePinChange = (index, value) => {
        if (value.length > 1) return;
        const newPin = [...securityPin];
        newPin[index] = value;
        setSecurityPin(newPin);

        if (value && index < 3) {
            document.getElementById(`pin-${index + 1}`)?.focus();
        }

        if (newPin.join('').length === 4) {
            // Demo Pin: 1234
            if (newPin.join('') === '1234') {
                setTimeout(() => setIsPinVerified(true), 300);
            } else {
                setTimeout(() => setSecurityPin(['', '', '', '']), 500);
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
                    <div className="rp-step-line-bg"></div>
                    <div className="rp-step-line-fill" style={{ width: `${(step - 1) * 50}%` }}></div>

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
                                            <label>Month Selection</label>
                                            <div className="rp-input-group">
                                                <input
                                                    type="month"
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                    className="rp-input-lg"
                                                />
                                                <div className="rp-input-icon"><ChevronRight size={16} /></div>
                                            </div>
                                        </div>

                                        <button onClick={() => setStep(2)} className="rp-btn-primary rp-btn-block group">
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
                                    {/* Left Panel */}
                                    <div className="rp-col-main">
                                        <div className="rp-tabs">
                                            <button
                                                className={`rp-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('overview')}
                                            >Overview</button>
                                            <button
                                                className={`rp-tab ${activeTab === 'anomalies' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('anomalies')}
                                            >AI Insights <span className="rp-badge">2</span></button>
                                        </div>

                                        {activeTab === 'overview' && (
                                            <div className="rp-tab-content animate-fade-in">
                                                <div className="rp-stats-grid">
                                                    <div className="rp-stat-box">
                                                        <div className="rp-stat-header">
                                                            <span>Total Est. Cost</span>
                                                            <TrendingUp size={16} className="text-emerald" />
                                                        </div>
                                                        <div className="rp-stat-value">{formatCurrency(estimatedCost)}</div>
                                                        <div className="rp-stat-meta">Based on current active employees</div>
                                                    </div>
                                                    <div className="rp-stat-box">
                                                        <div className="rp-stat-header">
                                                            <span>Employees</span>
                                                            <Users size={16} className="text-info" />
                                                        </div>
                                                        <div className="rp-stat-value">{activeEmployeeCount > 0 ? activeEmployeeCount : '--'}</div>
                                                        <div className="rp-stat-meta">Will be calculated on run</div>
                                                    </div>
                                                    <div className="rp-stat-box">
                                                        <div className="rp-stat-header">
                                                            <span>Compliance</span>
                                                            <ShieldCheck size={16} className="text-brand" />
                                                        </div>
                                                        <div className="rp-stat-value">100%</div>
                                                        <div className="rp-stat-meta">Tax Rules 2024</div>
                                                    </div>
                                                </div>

                                                <div className="rp-control-panel">
                                                    <div className="rp-control-header">
                                                        <Sliders size={18} className="text-brand" />
                                                        <h3>Adjustments Control (Simulation)</h3>
                                                    </div>
                                                    <div className="rp-slider-group">
                                                        <div className="rp-slider-labels">
                                                            <span>Bonus Pool Allocation</span>
                                                            <span className="rp-mono-val">{bonusPool}%</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="20" step="1"
                                                            value={bonusPool}
                                                            onChange={(e) => setBonusPool(Number(e.target.value))}
                                                            className="rp-slider"
                                                        />
                                                    </div>
                                                </div>
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
                                                        <p className="rp-pin-label">ENTER SECURITY PIN (1234)</p>
                                                        <div className="rp-pin-inputs">
                                                            {securityPin.map((digit, idx) => (
                                                                <input
                                                                    key={idx}
                                                                    id={`pin-${idx}`}
                                                                    type="password"
                                                                    maxLength={1}
                                                                    value={digit}
                                                                    onChange={(e) => handlePinChange(idx, e.target.value)}
                                                                    className="rp-pin-input"
                                                                />
                                                            ))}
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
                                                    disabled={!isPinVerified || processing}
                                                    className={`rp-btn-execute ${isPinVerified && !processing ? 'ready' : 'disabled'}`}
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
