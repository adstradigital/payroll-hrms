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
    ArrowRight as ArrowRightIcon,
    Mail as MailIcon,
    ShieldCheck as ShieldIcon,
    RefreshCw
} from 'lucide-react';
import { login as apiLogin, apiVerify2FA } from '@/api/api_clientadmin';
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
    
    // --- 2FA State ---
    const [loginStep, setLoginStep] = useState(1); // 1: Credentials, 2: OTP, 3: Password Expired
    const [otp, setOtp] = useState('');
    const [twoFactorData, setTwoFactorData] = useState(null); // { user_id, email }
    const [resetData, setResetData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

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

            console.log('[Login] ✅ Login response:', response.data);
            
            // Check for Password Expiry
            if (response.data.password_expired) {
                console.log('[Login] ⚠️ Password Expired. Transitioning to reset step.');
                setLoginStep(3);
                setStatus('idle');
                return;
            }

            // Check for 2FA
            if (response.data.two_factor_required) {
                console.log('[Login] 🔐 2FA Required. Transitioning to step 2.');
                setTwoFactorData({
                    userId: response.data.user_id,
                    email: response.data.email
                });
                setLoginStep(2);
                setStatus('idle');
                return;
            }

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

    const handleResetExpiredPassword = async (e) => {
        e.preventDefault();
        if (resetData.newPassword !== resetData.confirmPassword) {
            setStatus('error');
            setErrorMessage('Passwords do not match.');
            return;
        }

        setStatus('loading');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/accounts/security/password/reset-expired/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    old_password: formData.password,
                    new_password: resetData.newPassword,
                    confirm_password: resetData.confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('[Login] ✅ Password reset successfully');
                alert('Password reset successfully. Please login with your new password.');
                setLoginStep(1);
                setFormData(prev => ({ ...prev, password: '' }));
                setResetData({ newPassword: '', confirmPassword: '' });
                setStatus('idle');
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('[Login] ❌ Password reset failed:', err);
            setStatus('error');
            setErrorMessage('Connection error. Please try again.');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        
        setStatus('loading');
        try {
            const response = await apiVerify2FA({
                user_id: twoFactorData.userId,
                otp_code: otp
            });

            console.log('[Login] ✅ 2FA Verification successful');
            const { access, refresh, user } = response.data;

            // Standard Login Success logic
            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);
            
            login({
                email: user.email,
                ...user
            });

            // Auto Check-in logic
            try {
                const date = new Date();
                const dashboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/my_dashboard/?month=${date.getMonth() + 1}&year=${date.getFullYear()}`, {
                    headers: { 'Authorization': `Bearer ${access}` }
                });

                if (dashboardRes.ok) {
                    const dashboardData = await dashboardRes.json();
                    if (dashboardData.employee?.id) {
                        localStorage.setItem('employeeId', dashboardData.employee.id);
                    }
                }
            } catch (e) {
                console.error('[Login] ⚠️ 2FA Auto-ID capture failed:', e);
            }

            setStatus('success');
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);

        } catch (err) {
            console.error('[Login] ❌ 2FA failed:', err);
            setStatus('error');
            setErrorMessage(err.response?.data?.error || 'Invalid or expired code.');
        }
    };

    const handleResendOTP = async () => {
        setStatus('loading');
        try {
            await apiLogin({
                username: formData.email,
                password: formData.password
            });
            setStatus('idle');
            setOtp('');
            alert('A new verification code has been sent to your email.');
        } catch (err) {
            setStatus('error');
            setErrorMessage('Failed to resend code. Please try logging in again.');
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
                        <h1 className="auth-header__title">
                            {loginStep === 1 ? 'Welcome back' : 
                             loginStep === 2 ? 'Verify your identity' : 
                             'Password Expired'}
                        </h1>
                        <p className="auth-header__subtitle">
                            {loginStep === 1 
                                ? 'Please enter your credentials to access the dashboard.' 
                                : loginStep === 2
                                ? `We've sent a 6-digit code to ${twoFactorData?.email || 'your email'}.`
                                : 'Your password has expired. For security reasons, please create a new one.'
                            }
                        </p>
                    </div>

                    <form onSubmit={loginStep === 1 ? handleSubmit : handleVerifyOTP} className="auth-form">
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

                        {loginStep === 1 ? (
                            <>
                                <div className="auth-form__group">
                                    <label className="auth-form__label">Email Address</label>
                                    <div className="auth-input-wrapper">
                                        <MailIcon size={18} className="auth-input-icon" />
                                        <input
                                            type="email"
                                            name="email"
                                            className="auth-input"
                                            placeholder="admin@nexus.com"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="auth-form__group">
                                    <div className="auth-form__label-row">
                                        <label className="auth-form__label">Password</label>
                                        <Link href="/forgot-password" title="Recover password" className="auth-forgot-password">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="auth-input-wrapper">
                                        <LockIcon size={18} className="auth-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            className="auth-input"
                                            placeholder="••••••••"
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                        />
                                        <button
                                            type="button"
                                            className="auth-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="auth-form__options">
                                    <label className="auth-remember-me">
                                        <input
                                            type="checkbox"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleInputChange}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-submit-btn"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <div className="auth-loader"></div>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRightIcon size={18} />
                                        </>
                                    )}
                                </button>
                            </>
                        ) : loginStep === 2 ? (
                            <>
                                <div className="auth-form__group">
                                    <label className="auth-form__label">Verification Code</label>
                                    <div className="auth-input-wrapper">
                                        <ShieldIcon size={18} className="auth-input-icon" />
                                        <input
                                            type="text"
                                            className="auth-input"
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <p className="auth-form__help-text">
                                        Didn't receive the code? 
                                        <button 
                                            type="button" 
                                            className="auth-resend-link"
                                            onClick={handleResendOTP}
                                            disabled={status === 'loading'}
                                        >
                                            {status === 'loading' ? 'Sending...' : 'Resend Code'}
                                        </button>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    onClick={handleVerifyOTP}
                                    className="auth-submit-btn"
                                    disabled={status === 'loading' || otp.length !== 6}
                                >
                                    {status === 'loading' ? (
                                        <div className="auth-loader"></div>
                                    ) : (
                                        <>
                                            Verify & Continue
                                            <ArrowRightIcon size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="auth-back-btn"
                                    onClick={() => setLoginStep(1)}
                                >
                                    Back to login
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="auth-form__group">
                                    <label className="auth-form__label">New Password</label>
                                    <div className="auth-input-wrapper">
                                        <LockIcon size={18} className="auth-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="auth-input"
                                            placeholder="Minimum 8 characters"
                                            required
                                            value={resetData.newPassword}
                                            onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="auth-form__group">
                                    <label className="auth-form__label">Confirm New Password</label>
                                    <div className="auth-input-wrapper">
                                        <LockIcon size={18} className="auth-input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="auth-input"
                                            placeholder="Repeat new password"
                                            required
                                            value={resetData.confirmPassword}
                                            onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    onClick={handleResetExpiredPassword}
                                    className="auth-submit-btn"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <div className="auth-loader"></div>
                                    ) : (
                                        <>
                                            Update Password
                                            <ArrowRightIcon size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className="auth-back-btn"
                                    onClick={() => setLoginStep(1)}
                                >
                                    Back to login
                                </button>
                            </>
                        )}
                    </form>

                    <div className="auth-footer">
                        <p className="auth-footer__text">
                            New to Nexus HRMS? <Link href="/register">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
