'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/auth/login', {
            //   method: 'POST',
            //   body: JSON.stringify(formData)
            // });

            // Simulate login for now
            await new Promise(resolve => setTimeout(resolve, 1000));

            // On success, redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Logo */}
                <div className="login__logo">
                    <div className="login__logo-icon">H</div>
                    <span className="login__logo-text">HR Nexus</span>
                </div>

                <div className="login__card">
                    <h1 className="login__title">Welcome Back</h1>
                    <p className="login__subtitle">Sign in to your account to continue</p>

                    {error && (
                        <div className="login__error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login__form">
                        {/* Email Field */}
                        <div className="login__field">
                            <label className="login__label">Email Address</label>
                            <div className="login__input-wrapper">
                                <Mail size={18} className="login__input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className="login__input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="login__field">
                            <label className="login__label">Password</label>
                            <div className="login__input-wrapper">
                                <Lock size={18} className="login__input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="login__input"
                                    required
                                />
                                <button
                                    type="button"
                                    className="login__password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="login__options">
                            <label className="login__remember">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <a href="/forgot-password" className="login__forgot">Forgot password?</a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="login__submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="login__register-link">
                        Don't have an account? <a href="/register">Create account</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
