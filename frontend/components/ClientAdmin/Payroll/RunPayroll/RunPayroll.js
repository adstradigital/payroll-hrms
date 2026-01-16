'use client';

import { useState } from 'react';
import { Play, Calendar, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import './RunPayroll.css';

export default function RunPayroll() {
    const [step, setStep] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState('2026-01');
    const [processing, setProcessing] = useState(false);

    const payrollSummary = {
        totalEmployees: 156,
        eligibleEmployees: 152,
        onHold: 4,
        estimatedGross: 4850000,
        estimatedDeductions: 582000,
        estimatedNet: 4268000,
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleRunPayroll = () => {
        setProcessing(true);
        // Simulate processing
        setTimeout(() => {
            setProcessing(false);
            setStep(3);
        }, 3000);
    };

    return (
        <div className="run-payroll">
            {/* Progress Steps */}
            <div className="payroll-steps">
                <div className={`payroll-step ${step >= 1 ? 'payroll-step--active' : ''}`}>
                    <span className="payroll-step__number">1</span>
                    <span className="payroll-step__label">Select Period</span>
                </div>
                <div className="payroll-step__line"></div>
                <div className={`payroll-step ${step >= 2 ? 'payroll-step--active' : ''}`}>
                    <span className="payroll-step__number">2</span>
                    <span className="payroll-step__label">Review</span>
                </div>
                <div className="payroll-step__line"></div>
                <div className={`payroll-step ${step >= 3 ? 'payroll-step--active' : ''}`}>
                    <span className="payroll-step__number">3</span>
                    <span className="payroll-step__label">Complete</span>
                </div>
            </div>

            {/* Step 1: Select Period */}
            {step === 1 && (
                <div className="payroll-content">
                    <h2 className="payroll-title">Select Payroll Period</h2>
                    <div className="period-selector">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="period-input"
                        />
                    </div>
                    <div className="summary-preview">
                        <div className="summary-item">
                            <Users size={20} />
                            <span>{payrollSummary.totalEmployees} Total Employees</span>
                        </div>
                        <div className="summary-item">
                            <CheckCircle size={20} className="text-success" />
                            <span>{payrollSummary.eligibleEmployees} Eligible</span>
                        </div>
                        <div className="summary-item">
                            <AlertCircle size={20} className="text-warning" />
                            <span>{payrollSummary.onHold} On Hold</span>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                        Continue to Review
                    </button>
                </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
                <div className="payroll-content">
                    <h2 className="payroll-title">Review Payroll Summary</h2>
                    <div className="review-cards">
                        <div className="review-card">
                            <span className="review-card__label">Gross Salary</span>
                            <span className="review-card__value">{formatCurrency(payrollSummary.estimatedGross)}</span>
                        </div>
                        <div className="review-card">
                            <span className="review-card__label">Total Deductions</span>
                            <span className="review-card__value text-danger">{formatCurrency(payrollSummary.estimatedDeductions)}</span>
                        </div>
                        <div className="review-card review-card--highlight">
                            <span className="review-card__label">Net Payable</span>
                            <span className="review-card__value text-success">{formatCurrency(payrollSummary.estimatedNet)}</span>
                        </div>
                    </div>
                    <div className="payroll-actions">
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleRunPayroll}
                            disabled={processing}
                        >
                            {processing ? (
                                <>Processing...</>
                            ) : (
                                <><Play size={18} /> Run Payroll</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
                <div className="payroll-content payroll-complete">
                    <div className="complete-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h2 className="payroll-title">Payroll Processed Successfully!</h2>
                    <p className="complete-message">
                        Payroll for January 2026 has been generated for {payrollSummary.eligibleEmployees} employees.
                    </p>
                    <div className="complete-actions">
                        <button className="btn btn-secondary">View Payslips</button>
                        <button className="btn btn-primary">Download Report</button>
                    </div>
                </div>
            )}
        </div>
    );
}
