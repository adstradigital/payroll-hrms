import React, { useState, useEffect } from 'react';
import { Calculator, IndianRupee, TrendingUp, Download, PieChart, Info, RefreshCw } from 'lucide-react';
import axiosInstance from '../../../../../api/axiosInstance';
import './CTCCalculator.css';

const CTCCalculator = () => {
    const [monthlyGross, setMonthlyGross] = useState('');
    const [annualCTC, setAnnualCTC] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleCalculate = (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let mGross = parseFloat(monthlyGross) || 0;
            const aCtc = parseFloat(annualCTC) || 0;

            if (mGross === 0 && aCtc === 0) {
                throw new Error("Please enter a valid amount.");
            }

            // Standard Indian Payroll Statutory Rates
            const pfRateEmployer = 0.12;
            const pfRateEmployee = 0.12;
            const pfRateEps = 0.0833;
            const pfRateEpfEmployer = 0.0367;
            const pfAdminRate = 0.005;
            const edliRate = 0.005;

            const esiRateEmployer = 0.0325;
            const esiRateEmployee = 0.0075;
            const esiThreshold = 21000;
            const pfCeiling = 15000;

            // Reverse-calculate Gross if Annual CTC is provided
            if (aCtc > 0 && mGross === 0) {
                // Approximate reverse calculation including PF Admin & EDLI
                let employerRate = pfRateEmployer + pfAdminRate + edliRate;
                let testGross = (aCtc / 12) / (1 + employerRate);
                if (testGross <= esiThreshold) {
                    employerRate += esiRateEmployer;
                    testGross = (aCtc / 12) / (1 + employerRate);
                }
                mGross = testGross;
            }

            // Salary Components
            const basic = mGross * 0.50;
            const pfBase = Math.min(basic, pfCeiling);
            const hra = basic * 0.40;
            const conveyance = 1600;
            const medical = 1250;
            let other = mGross - (basic + hra + conveyance + medical);
            if (other < 0) other = 0;

            // Employer Contributions
            const employerPfTotal = pfBase * pfRateEmployer;
            const employerEps = pfBase * pfRateEps;
            const employerEpf = employerPfTotal - employerEps;
            const employerPfAdmin = pfBase * pfAdminRate;
            const employerEdli = pfBase * edliRate;

            const employerEsi = mGross <= esiThreshold ? mGross * esiRateEmployer : 0;

            // Employee Deductions
            const employeePf = pfBase * pfRateEmployee;
            const employeeEsi = mGross <= esiThreshold ? mGross * esiRateEmployee : 0;
            const pt = 200;

            // Simplified TDS Estimation (per typical Indian slabs)
            const annualTaxable = (mGross * 12) - 50000;
            let estimatedAnnualTds = 0;
            if (annualTaxable > 1500000) {
                estimatedAnnualTds = (annualTaxable - 1500000) * 0.3 + 150000;
            } else if (annualTaxable > 1200000) {
                estimatedAnnualTds = (annualTaxable - 1200000) * 0.2 + 90000;
            } else if (annualTaxable > 900000) {
                estimatedAnnualTds = (annualTaxable - 900000) * 0.15 + 45000;
            }
            const monthlyTds = estimatedAnnualTds > 0 ? estimatedAnnualTds / 12 : 0;

            // Totals
            const totalEmployerCost = mGross + employerPfTotal + employerPfAdmin + employerEdli + employerEsi;
            const totalDeductions = employeePf + employeeEsi + pt + monthlyTds;
            const takeHome = mGross - totalDeductions;

            setResult({
                monthly: {
                    gross_earnings: mGross,
                    breakdown: [
                        { name: 'Basic Salary', amount: basic },
                        { name: 'HRA', amount: hra },
                        { name: 'Conveyance Allowance', amount: conveyance },
                        { name: 'Medical Allowance', amount: medical },
                        { name: 'Other Allowances', amount: other },
                    ],
                    employer_contributions: [
                        { name: 'Employer EPF (3.67%)', amount: employerEpf },
                        { name: 'Employer Pension (EPS 8.33%)', amount: employerEps },
                        { name: 'PF Admin Charges (0.5%)', amount: employerPfAdmin },
                        { name: 'EDLI Charges (0.5%)', amount: employerEdli },
                        { name: 'Employer ESI (3.25%)', amount: employerEsi },
                    ],
                    deductions: [
                        { name: 'Employee PF (12%)', amount: employeePf },
                        { name: 'Employee ESI (0.75%)', amount: employeeEsi },
                        { name: 'Professional Tax', amount: pt },
                        { name: 'Estimated TDS', amount: monthlyTds },
                    ],
                    total_employer_cost: totalEmployerCost,
                    total_deductions: totalDeductions,
                    net_take_home: takeHome,
                },
                annual: {
                    ctc: totalEmployerCost * 12,
                    gross: mGross * 12,
                    take_home: takeHome * 12,
                }
            });

        } catch (err) {
            setError(err.message || 'Calculation failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="ctc-calculator-container">
            <div className="ctc-header">
                <div className="ctc-header__info">
                    <div className="ctc-header__icon">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1>CTC Calculator</h1>
                        <p>Calculate Cost to Company and Take-home Salary breakdown</p>
                    </div>
                </div>
            </div>

            <div className="ctc-grid">
                <div className="ctc-panel ctc-input-panel">
                    <form onSubmit={handleCalculate}>
                        <div className="form-group">
                            <label>Monthly Gross Salary (₹)</label>
                            <div className="input-with-icon">
                                <IndianRupee size={18} />
                                <input
                                    type="number"
                                    placeholder="Enter monthly gross"
                                    value={monthlyGross}
                                    onChange={(e) => {
                                        setMonthlyGross(e.target.value);
                                        setAnnualCTC('');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="ctc-divider">OR</div>

                        <div className="form-group">
                            <label>Annual CTC (₹)</label>
                            <div className="input-with-icon">
                                <TrendingUp size={18} />
                                <input
                                    type="number"
                                    placeholder="Enter annual CTC"
                                    value={annualCTC}
                                    onChange={(e) => {
                                        setAnnualCTC(e.target.value);
                                        setMonthlyGross('');
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="calculate-btn"
                            disabled={loading || (!monthlyGross && !annualCTC)}
                        >
                            {loading ? <RefreshCw className="spin" size={20} /> : 'Calculate Breakdown'}
                        </button>
                    </form>

                    {error && <div className="ctc-error">{error}</div>}

                    <div className="ctc-info-card">
                        <Info size={16} />
                        <p>Calculations are based on your organization's Payroll Settings (PF/ESI rates).</p>
                    </div>
                </div>

                <div className="ctc-panel ctc-result-panel">
                    {!result ? (
                        <div className="ctc-empty-state">
                            <PieChart size={64} strokeWidth={1} />
                            <h3>No Calculation Yet</h3>
                            <p>Enter a salary amount to see the full CTC and take-home breakdown.</p>
                        </div>
                    ) : (
                        <div className="ctc-results">
                            <div className="results-summary">
                                <div className="summary-item main">
                                    <label>Annual CTC</label>
                                    <div className="value">{formatCurrency(result.annual.ctc)}</div>
                                </div>
                                <div className="summary-item secondary">
                                    <label>Monthly Take-home</label>
                                    <div className="value success">{formatCurrency(result.monthly.net_take_home)}</div>
                                </div>
                            </div>

                            <div className="results-sections">
                                <div className="results-section">
                                    <h4>Earnings Breakdown (Monthly)</h4>
                                    <div className="breakdown-list">
                                        {result.monthly.breakdown.map((item, idx) => (
                                            <div key={idx} className="breakdown-item">
                                                <span>{item.name}</span>
                                                <span className="price">{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="breakdown-total">
                                            <span>Monthly Gross</span>
                                            <span>{formatCurrency(result.monthly.gross_earnings)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="results-section">
                                    <h4>Deductions & Benefits</h4>
                                    <div className="breakdown-list">
                                        <div className="sub-heading">Employee Deductions</div>
                                        {result.monthly.deductions.map((item, idx) => (
                                            <div key={idx} className="breakdown-item deduction">
                                                <span>{item.name}</span>
                                                <span className="price">-{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}

                                        <div className="sub-heading">Employer Contributions</div>
                                        {result.monthly.employer_contributions.map((item, idx) => (
                                            <div key={idx} className="breakdown-item benefit">
                                                <span>{item.name}</span>
                                                <span className="price">{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button className="download-report-btn">
                                <Download size={18} />
                                Export Breakdown
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CTCCalculator;
