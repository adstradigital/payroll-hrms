import React, { useState } from 'react';
import {
    Building2,
    Globe,
    Mail,
    Shield,
    Zap,
    Briefcase,
    CheckCircle2,
    ArrowRight,
    Clock,
    Send
} from 'lucide-react';
import './CreateOrganization.css';

const CreateOrganization = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        orgName: '',
        domain: '',
        industry: '',
        employeeScale: '1-50',
        adminName: '',
        adminEmail: '',
        plan: 'enterprise'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production, this would call an API to create the pending organization
        console.log('Organization Registration Submitted:', formData);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="create-org-wrapper animate-slide-up">
                <div className="success-container">
                    <div className="success-card">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                        </div>
                        <h2>Registration Submitted Successfully!</h2>
                        <p className="success-message">
                            The organization <strong>{formData.orgName}</strong> has been queued for approval.
                        </p>

                        <div className="workflow-steps">
                            <div className="step completed">
                                <div className="step-icon"><CheckCircle2 size={20} /></div>
                                <span>Registration Received</span>
                            </div>
                            <ArrowRight size={16} className="step-arrow" />
                            <div className="step pending">
                                <div className="step-icon"><Clock size={20} /></div>
                                <span>Awaiting Admin Approval</span>
                            </div>
                            <ArrowRight size={16} className="step-arrow" />
                            <div className="step future">
                                <div className="step-icon"><Send size={20} /></div>
                                <span>Credentials Sent via Email</span>
                            </div>
                        </div>

                        <div className="info-box">
                            <Mail size={18} />
                            <p>Once approved, login credentials will be automatically sent to <strong>{formData.adminEmail}</strong></p>
                        </div>

                        <button className="btn-register-another" onClick={() => setIsSubmitted(false)}>
                            Register Another Organization
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="create-org-wrapper animate-slide-up">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-heading">Register New Organization</h1>
                    <p className="page-subheading">Onboard a new client company. Upon approval, login credentials will be automatically emailed to the designated admin.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="create-org-form-container">
                    <div className="form-card-premium">
                        <div className="form-section">
                            <h3 className="section-title">Company Profile</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Organization Name *</label>
                                    <div className="input-with-icon">
                                        <Building2 size={16} />
                                        <input
                                            type="text"
                                            name="orgName"
                                            value={formData.orgName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Acme Corp"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Primary Domain</label>
                                    <div className="input-with-icon">
                                        <Globe size={16} />
                                        <input
                                            type="text"
                                            name="domain"
                                            value={formData.domain}
                                            onChange={handleInputChange}
                                            placeholder="acme.com"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Industry Vertical</label>
                                    <select name="industry" value={formData.industry} onChange={handleInputChange}>
                                        <option value="">Select Industry</option>
                                        <option value="technology">Technology</option>
                                        <option value="healthcare">Healthcare</option>
                                        <option value="finance">Finance</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="retail">Retail</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Employee Scale</label>
                                    <select name="employeeScale" value={formData.employeeScale} onChange={handleInputChange}>
                                        <option value="1-50">1-50 Employees</option>
                                        <option value="51-200">51-200 Employees</option>
                                        <option value="201-500">201-500 Employees</option>
                                        <option value="500+">500+ Employees</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section section-divider">
                            <h3 className="section-title">Client Admin Account</h3>
                            <p className="section-description">This person will be the primary administrator for the organization. No password is needed – credentials will be auto-generated and emailed upon approval.</p>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Admin Full Name *</label>
                                    <input
                                        type="text"
                                        name="adminName"
                                        value={formData.adminName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. John Smith"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Admin Email *</label>
                                    <div className="input-with-icon">
                                        <Mail size={16} />
                                        <input
                                            type="email"
                                            name="adminEmail"
                                            value={formData.adminEmail}
                                            onChange={handleInputChange}
                                            placeholder="admin@company.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-section section-divider">
                            <h3 className="section-title">Subscription Plan</h3>
                            <div className="plan-selector">
                                <label className={`plan-option ${formData.plan === 'enterprise' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="plan"
                                        value="enterprise"
                                        checked={formData.plan === 'enterprise'}
                                        onChange={handleInputChange}
                                    />
                                    <div className="plan-details">
                                        <span className="plan-name">Enterprise Platinum</span>
                                        <span className="plan-price">$499/mo</span>
                                    </div>
                                    <Zap size={18} className="plan-icon-amber" />
                                </label>
                                <label className={`plan-option ${formData.plan === 'pro' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="plan"
                                        value="pro"
                                        checked={formData.plan === 'pro'}
                                        onChange={handleInputChange}
                                    />
                                    <div className="plan-details">
                                        <span className="plan-name">Business Pro</span>
                                        <span className="plan-price">$199/mo</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="form-footer">
                            <button type="submit" className="btn-save-org">
                                <Send size={18} />
                                <span>Submit for Approval</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-info-sidebar">
                        <div className="info-card-glass highlight">
                            <div className="info-icon-wrapper">
                                <Shield size={24} className="text-amber-500" />
                            </div>
                            <h4>How It Works</h4>
                            <ol className="workflow-list">
                                <li>You submit the registration request</li>
                                <li>Request appears in the Approvals queue</li>
                                <li>Super Admin reviews and approves</li>
                                <li>System auto-generates secure credentials</li>
                                <li>Login details are emailed to the admin</li>
                            </ol>
                        </div>
                        <div className="info-card-glass">
                            <div className="info-icon-wrapper">
                                <Briefcase size={24} className="text-blue-500" />
                            </div>
                            <h4>What's Provisioned</h4>
                            <p>Upon approval, a dedicated workspace, database schema, and storage bucket will be automatically configured for the organization.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateOrganization;
