'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Eye,
    EyeOff,
    Lock as LockIcon,
    Briefcase as BriefcaseIcon,
    CheckCircle as CheckCircleIcon,
    AlertCircle as AlertCircleIcon,
    Building2 as Building2Icon,
    ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { login as apiLogin } from '@/api/api_clientadmin';
import { useAuth } from '@/context/AuthContext';
import './Login.css';

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        console.log('[Login] 📤 Attempting login with:', { email: formData.email });

        try {
            // Call real API
            const response = await apiLogin({
                username: formData.email,
                password: formData.password
            });

            console.log('[Login] ✅ Login successful');
            console.log('[Login] 📦 Full response:', response.data);

            // Store JWT tokens
            const { access, refresh } = response.data;
            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);

            // Log user info
            const user = response.data.user;
            console.log('[Login] 👤 User Info:');
            console.log('  - ID:', user.id);
            console.log('  - Email:', user.email);
            console.log('  - Name:', user.name);
            console.log('  - Role:', user.role);
            console.log('  - Role Name:', user.role_name);
            console.log('  - Is Admin:', user.is_admin);
            console.log('  - Is Org Creator:', user.is_org_creator);

            if (response.data.organization) {
                console.log('[Login] 🏢 Organization:', response.data.organization);
            }

            // Update AuthContext
            login({
                email: formData.email,
                ...response.data.user
            });

            if (formData.rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            // --- AUTO CLOCK-IN LOGIC ---
            try {
                // 1. Fetch Dashboard to get Employee ID
                const date = new Date();
                const dashboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/my_dashboard/?month=${date.getMonth() + 1}&year=${date.getFullYear()}`, {
                    headers: { 'Authorization': `Bearer ${access}` }
                });

                if (dashboardRes.ok) {
                    const dashboardData = await dashboardRes.json();
                    const employeeId = dashboardData.employee?.id;

                    if (employeeId) {
                        // Store locally for logout use
                        localStorage.setItem('employeeId', employeeId);

                        // 2. Auto Check-in
                        if (!dashboardData.today?.check_in) {
                            console.log('[Login] 🕒 Auto Clock-in triggered...');
                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-in/`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${access}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ employee: employeeId })
                            });
                            console.log('[Login] ✅ Auto Clock-in successful');
                        } else {
                            console.log('[Login] ℹ️ Already clocked in today');
                        }
                    }
                }
            } catch (clockErr) {
                console.error('[Login] ⚠️ Auto clock-in failed (non-blocking):', clockErr);
            }
            // ---------------------------

            setStatus('success');
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (err) {
            console.error('[Login] ❌ Login failed:', err);
            console.error('[Login] Error response:', err.response?.data);
            console.error('[Login] Error status:', err.response?.status);

            setStatus('error');
            const errorMsg = err.response?.data?.detail ||
                err.response?.data?.error ||
                'Invalid email or password. Please try again.';
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
                            Streamline Your Payroll & Workforce Management
                        </h2>
                        <p className="auth-hero__subtitle">
                            Experience the next generation of employee management. Secure, efficient, and designed for modern enterprises.
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
                <div className="auth-form-wrapper">
                    {/* Mobile Header */}
                    <div className="auth-mobile-header">
                        <div className="auth-mobile-header__logo">
                            <Building2Icon size={24} />
                        </div>
                        <span className="auth-mobile-header__text">Nexus HRMS</span>
                    </div>

                    <div className="auth-header">
                        <h1 className="auth-header__title">Welcome back</h1>
                        <p className="auth-header__subtitle">
                            Please enter your credentials to access the dashboard.
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
                            {/* Email Field */}
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
                                <div className="auth-field__header">
                                    <label htmlFor="password" className="auth-field__label">Password</label>
                                    <Link href="/forgot-password" className="auth-field__link">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="auth-field__input-wrapper">
                                    <div className="auth-field__icon">
                                        <LockIcon size={20} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        className="auth-field__input auth-field__input--password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="auth-field__toggle"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="auth-checkbox">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    name="rememberMe"
                                    className="auth-checkbox__input"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="rememberMe" className="auth-checkbox__label">
                                    Remember this device
                                </label>
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
                                    <span>Sign In</span>
                                    <ArrowRightIcon size={20} />
                                </>
                            )}
                        </button>

                        {/* Navigation Links */}
                        <div className="auth-links">
                            <p className="auth-links__text">
                                New to Nexus?
                            </p>
                            <Link href="/register" className="auth-links__link">
                                Register Company
                            </Link>

                            <div className="auth-links__divider">
                                <span>OR</span>
                            </div>

                            <Link href="/" className="auth-links__secondary">
                                Have an invite code? Activate Account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
