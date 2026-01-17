'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { register as apiRegister } from '@/api/api_clientadmin';
import {
    User as UserIcon,
    CheckCircle as CheckCircleIcon,
    AlertCircle as AlertCircleIcon,
    Mail as MailIcon,
    Building2 as Building2Icon,
    ArrowRight as ArrowRightIcon,
    Briefcase as BriefcaseIcon,
    Phone as PhoneIcon,
    Users as UsersIcon,
    Plus as PlusIcon,
    Trash2 as TrashIcon,
    Building as BuildingIcon,
    Layers as LayersIcon,
    Lock as LockIcon
} from 'lucide-react';
import './Register.css';

export default function Register() {
    const router = useRouter();
    const { login } = useAuth();

    // UI State for registration mode: Default is Single Company (False)
    const [isMultiCompany, setIsMultiCompany] = useState(false);

    const [formData, setFormData] = useState({
        // Organization Registration
        organizationName: '',
        companies: [{ id: Date.now(), name: '' }],
        fullName: '',
        email: '',
        phone: '',
        employeeCount: '1-50',
        password: '',
    });


    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (status === 'error') {
            setStatus('idle');
            setErrorMessage('');
        }
    };

    // Handlers for Dynamic Company Fields
    const handleCompanyChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            companies: prev.companies.map(company =>
                company.id === id ? { ...company, name: value } : company
            )
        }));
    };

    const addCompanyField = () => {
        setFormData(prev => ({
            ...prev,
            companies: [...prev.companies, { id: Date.now(), name: '' }]
        }));
    };

    const removeCompanyField = (id) => {
        if (formData.companies.length > 1) {
            setFormData(prev => ({
                ...prev,
                companies: prev.companies.filter(company => company.id !== id)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // Validation
            const isOrgNameValid = formData.organizationName.trim().length > 0;
            const areCompaniesValid = isMultiCompany
                ? formData.companies.some(c => c.name.trim() !== '')
                : true;

            if (!isOrgNameValid) {
                throw new Error(isMultiCompany ? "Group Name is required." : "Company Name is required.");
            }
            if (isMultiCompany && !areCompaniesValid) {
                throw new Error("At least one subsidiary company name is required.");
            }
            if (!formData.email || !formData.fullName) {
                throw new Error("Please fill in all required fields.");
            }

            // Generate a temporary password if not provided
            const tempPassword = formData.password || Math.random().toString(36).slice(-8) + 'A1!';

            // Call real API
            const response = await apiRegister({
                email: formData.email,
                password: tempPassword,
                organizationName: formData.organizationName,
                fullName: formData.fullName,
                phone: formData.phone,
                employeeCount: formData.employeeCount,
                isMultiCompany: isMultiCompany,
                companies: isMultiCompany ? formData.companies.filter(c => c.name.trim()) : []
            });

            // Store JWT tokens
            const { access, refresh } = response.data.tokens;
            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);

            // On success, use AuthContext's login and redirect
            login({
                name: formData.fullName,
                email: formData.email,
                company: formData.organizationName,
                role: 'owner',
                ...response.data.user
            });

            setStatus('success');
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (err) {
            setStatus('error');
            const errorMsg = err.response?.data?.error ||
                err.message ||
                'Registration failed. Please try again.';
            setErrorMessage(errorMsg);
        }
    };

    const features = [
        "Automated Salary Processing",
        "Real-time Attendance Tracking",
        "Comprehensive Tax Management"
    ];

    return (
        <div className="auth-page">
            {/* Left Side - Visual & Branding */}
            <div className="auth-hero">
                <div className="auth-hero__bg"></div>
                <div className="auth-hero__shapes">
                    <div className="auth-hero__shape auth-hero__shape--1"></div>
                    <div className="auth-hero__shape auth-hero__shape--2"></div>
                </div>

                <div className="auth-hero__content">
                    <div className="auth-hero__logo">
                        <div className="auth-hero__logo-icon">
                            <Building2Icon size={28} />
                        </div>
                        <span className="auth-hero__logo-text">Nexus HRMS</span>
                    </div>

                    <div className="auth-hero__text">
                        <h2 className="auth-hero__title">
                            {isMultiCompany
                                ? "Multi-Company Payroll Management"
                                : "Unified HR Platform"}
                        </h2>
                        <p className="auth-hero__subtitle">
                            {isMultiCompany
                                ? "Manage multiple legal entities, subsidiaries, and branches under a single unified organization account."
                                : "Join over 5,000+ companies automating their payroll, attendance, and compliance with Nexus HRMS."}
                        </p>

                        <div className="auth-hero__features">
                            {features.map((feature, idx) => (
                                <div key={idx} className="auth-hero__feature">
                                    <div className="auth-hero__feature-icon">
                                        <CheckCircleIcon size={16} />
                                    </div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="auth-hero__footer">
                        © 2024 Nexus Systems Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="auth-form-container">
                <div className="auth-form-wrapper register-form-wrapper">
                    {/* Mobile Header */}
                    <div className="auth-mobile-header">
                        <div className="auth-mobile-header__logo">
                            <Building2Icon size={24} />
                        </div>
                        <span className="auth-mobile-header__text">Nexus HRMS</span>
                    </div>

                    <div className="auth-header">
                        <h1 className="auth-header__title">
                            {isMultiCompany ? "Register Group / Organization" : "Register Company"}
                        </h1>
                        <p className="auth-header__subtitle">
                            {isMultiCompany
                                ? "Create your master account and add your subsidiaries."
                                : "Create your company account to get started."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Alerts */}
                        {status === 'error' && (
                            <div className="auth-alert auth-alert--error">
                                <AlertCircleIcon size={20} className="auth-alert__icon" />
                                <span className="auth-alert__text">{errorMessage}</span>
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="auth-alert auth-alert--success">
                                <CheckCircleIcon size={20} className="auth-alert__icon" />
                                <span className="auth-alert__text">Success! Redirecting to dashboard...</span>
                            </div>
                        )}

                        <div className="auth-form__fields">
                            {/* Organization Name */}
                            <div className="auth-field">
                                <div className="auth-field__header">
                                    <label htmlFor="organizationName" className="auth-field__label">
                                        {isMultiCompany ? "Organization / Group Name" : "Company Name"}
                                    </label>
                                    {!isMultiCompany && (
                                        <span className="auth-field__hint">Legal Entity Name</span>
                                    )}
                                </div>
                                <div className="auth-field__input-wrapper">
                                    <div className="auth-field__icon">
                                        <Building2Icon size={20} />
                                    </div>
                                    <input
                                        id="organizationName"
                                        name="organizationName"
                                        type="text"
                                        required
                                        placeholder={isMultiCompany ? "e.g. Tata Group" : "e.g. Acme Corp"}
                                        className="auth-field__input"
                                        value={formData.organizationName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Multi-Company Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsMultiCompany(!isMultiCompany)}
                                className="register-toggle"
                            >
                                {isMultiCompany ? (
                                    <>
                                        <BuildingIcon size={14} />
                                        Single company? Switch to Standard Registration
                                    </>
                                ) : (
                                    <>
                                        <LayersIcon size={14} />
                                        Registering a Group with subsidiaries?
                                    </>
                                )}
                            </button>

                            {/* Dynamic Company List - Only Visible if isMultiCompany is true */}
                            {isMultiCompany && (
                                <div className="register-subsidiaries">
                                    <label className="auth-field__label">
                                        Subsidiaries / Operating Companies
                                    </label>

                                    {formData.companies.map((company, index) => (
                                        <div key={company.id} className="register-subsidiary">
                                            <div className="auth-field__input-wrapper">
                                                <div className="auth-field__icon">
                                                    <BuildingIcon size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder={`Subsidiary ${index + 1} Name`}
                                                    className="auth-field__input"
                                                    value={company.name}
                                                    onChange={(e) => handleCompanyChange(company.id, e.target.value)}
                                                />
                                            </div>
                                            {formData.companies.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCompanyField(company.id)}
                                                    className="register-subsidiary__remove"
                                                    title="Remove company"
                                                >
                                                    <TrashIcon size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addCompanyField}
                                        className="register-add-btn"
                                    >
                                        <PlusIcon size={16} />
                                        Add Subsidiary
                                    </button>
                                </div>
                            )}

                            <div className="register-divider"></div>

                            {/* Full Name */}
                            <div className="auth-field">
                                <label htmlFor="fullName" className="auth-field__label">Full Name</label>
                                <div className="auth-field__input-wrapper">
                                    <div className="auth-field__icon">
                                        <UserIcon size={20} />
                                    </div>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        required
                                        placeholder="John Doe"
                                        className="auth-field__input"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Phone and Employee Count Row */}
                            <div className="register-row">
                                <div className="auth-field">
                                    <label htmlFor="phone" className="auth-field__label">Phone</label>
                                    <div className="auth-field__input-wrapper">
                                        <div className="auth-field__icon">
                                            <PhoneIcon size={18} />
                                        </div>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+91..."
                                            className="auth-field__input"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="auth-field">
                                    <label htmlFor="employeeCount" className="auth-field__label">Total Size</label>
                                    <div className="auth-field__input-wrapper auth-field__input-wrapper--select">
                                        <div className="auth-field__icon">
                                            <UsersIcon size={18} />
                                        </div>
                                        <select
                                            id="employeeCount"
                                            name="employeeCount"
                                            className="auth-field__select"
                                            value={formData.employeeCount}
                                            onChange={handleInputChange}
                                        >
                                            <option value="1-50">1-50</option>
                                            <option value="51-200">51-200</option>
                                            <option value="201-1000">201-1000</option>
                                            <option value="1000+">1000+</option>
                                        </select>
                                        <div className="auth-field__select-arrow">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="email" className="auth-field__label">Work Email</label>
                                <div className="auth-field__input-wrapper">
                                    <div className="auth-field__icon">
                                        <BriefcaseIcon size={20} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@company.com"
                                        className="auth-field__input"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="auth-field">
                                <label htmlFor="password" className="auth-field__label">Create Password</label>
                                <div className="auth-field__input-wrapper">
                                    <div className="auth-field__icon">
                                        <LockIcon size={20} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="auth-field__input"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className={`auth-submit ${status === 'loading' ? 'auth-submit--loading' : ''} ${status === 'success' ? 'auth-submit--success' : ''}`}
                        >
                            {status === 'loading' ? (
                                <>
                                    <div className="auth-submit__spinner"></div>
                                    <span>Processing...</span>
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <CheckCircleIcon size={20} />
                                    <span>Success</span>
                                </>
                            ) : (
                                <>
                                    <span>{isMultiCompany ? "Create Organization" : "Create Account"}</span>
                                    <ArrowRightIcon size={20} />
                                </>
                            )}
                        </button>

                        {/* Login Link */}
                        <div className="auth-links">
                            <p className="auth-links__text">
                                Already have an account?{' '}
                                <Link href="/login" className="auth-links__link">
                                    Back to Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
