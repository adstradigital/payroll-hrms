'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle, ArrowRight, ArrowLeft, Shield, Zap, Globe } from 'lucide-react';
import './Register.css';

export default function Register() {
    const router = useRouter();
    const { login } = useAuth();
    const [step, setStep] = useState(1); // 1: Company, 2: Admin User
    const [formData, setFormData] = useState({
        // Company Details
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        gstin: '',

        // Admin User Details
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',

        // Subscription
        plan: 'payroll', // payroll, hrms, both
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // On success, use AuthContext's login and redirect
            login({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                company: formData.companyName,
                subscription_plan: formData.plan,
                role: 'owner'
            });
            router.push('/dashboard');
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Logo */}
                <div className="register__logo">
                    <div className="register__logo-icon">H</div>
                    <span className="register__logo-text">HR Nexus</span>
                </div>

                <div className="register__card">
                    <h1 className="register__title">Create Account</h1>
                    <p className="register__subtitle">
                        {step === 1 ? 'Enter your company details' : 'Create your admin account'}
                    </p>

                    {/* Progress Steps */}
                    <div className="register__steps">
                        <div className={`register__step ${step >= 1 ? 'register__step--active' : ''}`}>
                            <span className="register__step-number">1</span>
                            <span className="register__step-label">Company</span>
                        </div>
                        <div className="register__step-line"></div>
                        <div className={`register__step ${step >= 2 ? 'register__step--active' : ''}`}>
                            <span className="register__step-number">2</span>
                            <span className="register__step-label">Admin</span>
                        </div>
                    </div>

                    {error && (
                        <div className="register__error">{error}</div>
                    )}

                    {/* Step 1: Company Details */}
                    {step === 1 && (
                        <form onSubmit={handleNextStep} className="register__form">
                            <div className="register__field">
                                <label className="register__label">Company Name</label>
                                <div className="register__input-wrapper">
                                    <Building2 size={18} className="register__input-icon" />
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Enter company name"
                                        className="register__input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">Company Email</label>
                                <div className="register__input-wrapper">
                                    <Mail size={18} className="register__input-icon" />
                                    <input
                                        type="email"
                                        name="companyEmail"
                                        value={formData.companyEmail}
                                        onChange={handleChange}
                                        placeholder="company@example.com"
                                        className="register__input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">Phone Number</label>
                                <div className="register__input-wrapper">
                                    <Phone size={18} className="register__input-icon" />
                                    <input
                                        type="tel"
                                        name="companyPhone"
                                        value={formData.companyPhone}
                                        onChange={handleChange}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="register__input"
                                    />
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">GSTIN (Optional)</label>
                                <div className="register__input-wrapper">
                                    <Building2 size={18} className="register__input-icon" />
                                    <input
                                        type="text"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        placeholder="22AAAAA0000A1Z5"
                                        className="register__input"
                                    />
                                </div>
                            </div>

                            {/* Subscription Plan */}
                            <div className="register__field">
                                <label className="register__label">Select Plan</label>
                                <div className="register__plans">
                                    <label className={`register__plan ${formData.plan === 'payroll' ? 'register__plan--selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="plan"
                                            value="payroll"
                                            checked={formData.plan === 'payroll'}
                                            onChange={handleChange}
                                        />
                                        <span className="register__plan-name">Payroll Only</span>
                                    </label>
                                    <label className={`register__plan ${formData.plan === 'hrms' ? 'register__plan--selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="plan"
                                            value="hrms"
                                            checked={formData.plan === 'hrms'}
                                            onChange={handleChange}
                                        />
                                        <span className="register__plan-name">HRMS Only</span>
                                    </label>
                                    <label className={`register__plan ${formData.plan === 'both' ? 'register__plan--selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="plan"
                                            value="both"
                                            checked={formData.plan === 'both'}
                                            onChange={handleChange}
                                        />
                                        <span className="register__plan-name">HRMS + Payroll</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="register__submit">
                                Continue
                            </button>
                        </form>
                    )}

                    {/* Step 2: Admin Account */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="register__form">
                            <div className="register__row">
                                <div className="register__field">
                                    <label className="register__label">First Name</label>
                                    <div className="register__input-wrapper">
                                        <User size={18} className="register__input-icon" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="First name"
                                            className="register__input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="register__field">
                                    <label className="register__label">Last Name</label>
                                    <div className="register__input-wrapper">
                                        <User size={18} className="register__input-icon" />
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Last name"
                                            className="register__input"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">Admin Email</label>
                                <div className="register__input-wrapper">
                                    <Mail size={18} className="register__input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="admin@company.com"
                                        className="register__input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">Password</label>
                                <div className="register__input-wrapper">
                                    <Lock size={18} className="register__input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password"
                                        className="register__input"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        className="register__password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="register__field">
                                <label className="register__label">Confirm Password</label>
                                <div className="register__input-wrapper">
                                    <Lock size={18} className="register__input-icon" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                        className="register__input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="register__actions">
                                <button
                                    type="button"
                                    className="register__back"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="register__submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Login Link */}
                    <p className="register__login-link">
                        Already have an account? <a href="/login">Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
