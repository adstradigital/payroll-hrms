import React from 'react';
import { CreditCard, Landmark, IndianRupee, FileText } from 'lucide-react';
import './ProfilePayroll.css';

export default function ProfilePayroll({ employee }) {
    if (!employee) return null;

    const bankDetails = [
        { label: 'Bank Name', value: employee.bank_name || 'Not provided' },
        { label: 'Account Number', value: employee.bank_account_number ? '•••• ' + employee.bank_account_number.slice(-4) : 'Not provided' },
        { label: 'IFSC Code', value: employee.bank_ifsc_code || 'Not provided' },
        { label: 'Branch', value: employee.bank_branch || 'Not provided' },
    ];

    const salaryDetails = [
        { label: 'Basic Salary', value: employee.basic_salary ? `₹${Number(employee.basic_salary).toLocaleString()}` : 'Not set' },
        { label: 'Current CTC', value: employee.current_ctc ? `₹${Number(employee.current_ctc).toLocaleString()}` : 'Not set' },
        { label: 'Salary Status', value: 'Active', color: 'green' }, // Mock status for now
    ];

    return (
        <div className="profile-payroll animate-fade-in">
            <div className="payroll-grid">

                {/* Bank Account Section */}
                <div className="payroll-card">
                    <div className="card-header">
                        <div className="header-icon blue">
                            <Landmark size={20} />
                        </div>
                        <h3 className="card-title">Bank Account Details</h3>
                    </div>
                    <div className="card-content">
                        <div className="detail-list">
                            {bankDetails.map((item, i) => (
                                <div key={i} className="detail-item">
                                    <span className="detail-label">{item.label}</span>
                                    <span className="detail-value">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Salary Structure Section */}
                <div className="payroll-card">
                    <div className="card-header">
                        <div className="header-icon green">
                            <IndianRupee size={20} />
                        </div>
                        <h3 className="card-title">Salary Information</h3>
                    </div>
                    <div className="card-content">
                        <div className="detail-list">
                            {salaryDetails.map((item, i) => (
                                <div key={i} className="detail-item">
                                    <span className="detail-label">{item.label}</span>
                                    <span className={`detail-value ${item.color ? 'text-' + item.color : ''}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Recent Payslips Placeholder - Can be implemented later with API */}
            <div className="payslips-section mt-6">
                <h4 className="section-subtitle">Recent Payslips</h4>
                <div className="empty-payslips">
                    <FileText size={32} />
                    <p>Payslip history will appear here once payroll is processed.</p>
                </div>
            </div>
        </div>
    );
}
