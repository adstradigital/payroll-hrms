import React, { useState, useEffect } from 'react';
import {
    Calculator, ArrowRight, ShieldCheck,
    AlertCircle, TrendingDown, Info,
    CheckCircle2, IndianRupee, HelpCircle
} from 'lucide-react';
import { getTaxComparison } from '@/api/api_clientadmin';
import './RegimeComparison.css';

const RegimeComparison = ({ employeeId }) => {
    const [income, setIncome] = useState(1200000);
    const [deductions, setDeductions] = useState(150000);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchComparison = async () => {
        setLoading(true);
        try {
            const res = await getTaxComparison({
                annual_income: income,
                declaration_amount: deductions
            });
            setComparison(res.data);
        } catch (err) {
            console.error('Failed to fetch comparison', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchComparison();
        }, 500);
        return () => clearTimeout(timer);
    }, [income, deductions]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="regime-comparison-container animate-fade-in">
            <div className="comparison-inputs">
                <div className="input-group">
                    <label>
                        <IndianRupee size={16} />
                        Estimated Annual Income
                    </label>
                    <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="e.g. 12,00,000"
                    />
                    <span className="input-hint">Gross total income before any exemptions</span>
                </div>

                <div className="input-group">
                    <label>
                        <ShieldCheck size={16} />
                        Old Regime Deductions (80C, HRA, etc.)
                    </label>
                    <input
                        type="number"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                        placeholder="e.g. 1,50,000"
                    />
                    <span className="input-hint">Only applicable for Old Regime</span>
                </div>
            </div>

            {loading && (
                <div className="comparison-loading">
                    <div className="spinner"></div>
                    <span>Calculating tax implications...</span>
                </div>
            )}

            {!loading && comparison && (
                <div className="comparison-results">
                    <div className="recommendation-banner">
                        <div className="recommendation-icon">
                            <TrendingDown size={24} />
                        </div>
                        <div className="recommendation-text">
                            <h3>Better Choice: <span>{comparison.recommendation}</span></h3>
                            <p>You save approximately <strong>{formatCurrency(comparison.savings)}</strong> per year with this regime.</p>
                        </div>
                    </div>

                    <div className="comparison-grid">
                        {/* Old Regime Card */}
                        <div className={`regime-card ${comparison.recommendation === 'Old Regime' ? 'highlight' : ''}`}>
                            <div className="regime-header">
                                <h4>Old Regime</h4>
                                {comparison.recommendation === 'Old Regime' && <CheckCircle2 size={18} className="recommended-badge" />}
                            </div>
                            <div className="regime-body">
                                <div className="detail-row">
                                    <span>Gross Income</span>
                                    <span>{formatCurrency(comparison.old_regime.gross_income)}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Std. Deduction</span>
                                    <span className="deduction">- ₹50,000</span>
                                </div>
                                <div className="detail-row">
                                    <span>Other Deductions</span>
                                    <span className="deduction">- {formatCurrency(comparison.old_regime.gross_income - comparison.old_regime.taxable_income - 50000)}</span>
                                </div>
                                <div className="detail-row taxable">
                                    <span>Taxable Income</span>
                                    <span>{formatCurrency(comparison.old_regime.taxable_income)}</span>
                                </div>
                                <div className="divider"></div>
                                <div className="detail-row">
                                    <span>Tax Before Cess</span>
                                    <span>{formatCurrency(comparison.old_regime.tax_before_cess)}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Cess (4%)</span>
                                    <span>{formatCurrency(comparison.old_regime.cess)}</span>
                                </div>
                                <div className="detail-row total">
                                    <span>Total Tax Payable</span>
                                    <span>{formatCurrency(comparison.old_regime.total_tax)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="comparison-vs">VS</div>

                        {/* New Regime Card */}
                        <div className={`regime-card ${comparison.recommendation === 'New Regime' ? 'highlight' : ''}`}>
                            <div className="regime-header">
                                <h4>New Regime</h4>
                                {comparison.recommendation === 'New Regime' && <CheckCircle2 size={18} className="recommended-badge" />}
                            </div>
                            <div className="regime-body">
                                <div className="detail-row">
                                    <span>Gross Income</span>
                                    <span>{formatCurrency(comparison.new_regime.gross_income)}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Std. Deduction</span>
                                    <span className="deduction">- ₹75,000</span>
                                </div>
                                <div className="detail-row">
                                    <span>Other Deductions</span>
                                    <span className="deduction">Nil</span>
                                </div>
                                <div className="detail-row taxable">
                                    <span>Taxable Income</span>
                                    <span>{formatCurrency(comparison.new_regime.taxable_income)}</span>
                                </div>
                                <div className="divider"></div>
                                <div className="detail-row">
                                    <span>Tax Before Cess</span>
                                    <span>{formatCurrency(comparison.new_regime.tax_before_cess)}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Cess (4%)</span>
                                    <span>{formatCurrency(comparison.new_regime.cess)}</span>
                                </div>
                                <div className="detail-row total">
                                    <span>Total Tax Payable</span>
                                    <span>{formatCurrency(comparison.new_regime.total_tax)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="disclaimer-text">
                        <Info size={14} />
                        <span>Calculations are based on current FY 2024-25 tax rates. Marginal relief is applied where applicable. Final tax liability may vary.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegimeComparison;
