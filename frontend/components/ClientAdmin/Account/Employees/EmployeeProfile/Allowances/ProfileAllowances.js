'use client';

import { useState, useEffect } from 'react';
import {
    Calculator, DollarSign, TrendingUp, TrendingDown,
    Info, CreditCard, ChevronRight, PieChart,
    ArrowUpRight, ArrowDownRight, MoreVertical
} from 'lucide-react';
import { getCurrentEmployeeSalary } from '@/api/api_clientadmin';
import './ProfileAllowances.css';

export default function ProfileAllowances({ employeeId }) {
    const [salary, setSalary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (employeeId) {
            fetchSalary();
        }
    }, [employeeId]);

    const fetchSalary = async () => {
        setLoading(true);
        try {
            const res = await getCurrentEmployeeSalary({ employee: employeeId });
            setSalary(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching allowances:', err);
            if (err.response?.status === 404) {
                setError('No salary record configured for this employee.');
            } else {
                setError('Failed to load allowance and deduction details.');
            }
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="allowance-loading">
                <div className="spinner"></div>
                <p>Fetching salary breakup...</p>
            </div>
        );
    }

    if (error || !salary) {
        return (
            <div className="allowance-error-state">
                <PieChart size={48} />
                <h3>{error || 'Salary Not Configured'}</h3>
                <p>Details for allowances and deductions will appear once the employee's salary structure is finalized.</p>
            </div>
        );
    }

    const earnings = salary.components?.filter(c => c.component_type === 'earning') || [];
    const deductions = salary.components?.filter(c => c.component_type === 'deduction') || [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="profile-allowance-container animate-fade-in">
            {/* Header Summary Cards */}
            <div className="salary-summary-grid">
                <div className="summary-card gross">
                    <div className="summary-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="summary-details">
                        <span className="summary-label">Gross Salary</span>
                        <h2 className="summary-value">{formatCurrency(salary.gross_salary)}</h2>
                    </div>
                    <div className="summary-indicator">/ Month</div>
                </div>

                <div className="summary-card basic">
                    <div className="summary-icon">
                        <Calculator size={24} />
                    </div>
                    <div className="summary-details">
                        <span className="summary-label">Basic Salary</span>
                        <h2 className="summary-value">{formatCurrency(salary.basic_salary)}</h2>
                    </div>
                    <div className="summary-indicator">{((salary.basic_salary / salary.gross_salary) * 100).toFixed(0)}% of Gross</div>
                </div>

                <div className="summary-card net">
                    <div className="summary-icon">
                        <CreditCard size={24} />
                    </div>
                    <div className="summary-details">
                        <span className="summary-label">Net Take Home</span>
                        <h2 className="summary-value">{formatCurrency(salary.net_salary)}</h2>
                    </div>
                    <div className="summary-indicator">Approx.</div>
                </div>
            </div>

            <div className="allowance-content-grid">
                {/* Earnings Section */}
                <section className="allowance-section">
                    <div className="section-header">
                        <div className="header-title">
                            <span className="icon-badge earning">
                                <ArrowUpRight size={16} />
                            </span>
                            <h3>Earnings & Allowances</h3>
                        </div>
                        <span className="count-badge">{earnings.length} Items</span>
                    </div>

                    <div className="component-list">
                        {earnings.length > 0 ? (
                            earnings.map((comp) => (
                                <div key={comp.id} className="component-item">
                                    <div className="component-info">
                                        <span className="component-name">{comp.component_name}</span>
                                        <span className="component-code">Fixed Allowance</span>
                                    </div>
                                    <div className="component-amount earning">
                                        +{formatCurrency(comp.amount)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-section-info">No additional earnings listed.</div>
                        )}
                    </div>
                </section>

                {/* Deductions Section */}
                <section className="allowance-section">
                    <div className="section-header">
                        <div className="header-title">
                            <span className="icon-badge deduction">
                                <ArrowDownRight size={16} />
                            </span>
                            <h3>Deductions</h3>
                        </div>
                        <span className="count-badge">{deductions.length} Items</span>
                    </div>

                    <div className="component-list">
                        {deductions.length > 0 ? (
                            deductions.map((comp) => (
                                <div key={comp.id} className="component-item">
                                    <div className="component-info">
                                        <span className="component-name">{comp.component_name}</span>
                                        <span className="component-code">Statutory / Fixed</span>
                                    </div>
                                    <div className="component-amount deduction">
                                        -{formatCurrency(comp.amount)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-section-info">No deductions configured.</div>
                        )}

                        <div className="component-item total-deduction-row">
                            <span className="label">Total Deductions</span>
                            <span className="value">-{formatCurrency(salary.gross_salary - salary.net_salary)}</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Info Note */}
            <div className="salary-info-alert">
                <Info size={18} />
                <p>
                    These figures are based on the current <strong>{salary.structure_name || 'Standard'}</strong> salary structure
                    effective since <strong>{new Date(salary.effective_from).toLocaleDateString()}</strong>.
                </p>
            </div>
        </div>
    );
}
