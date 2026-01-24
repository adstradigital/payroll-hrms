import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminLogin } from '@/api/api_superadmin';
import { Shield, Lock, User, Loader2, AlertTriangle } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await superAdminLogin(credentials);
            const { user, access, refresh } = response.data;

            if (user && user.is_superuser) {
                // Store tokens and user info (matching axiosInstance expected keys)
                localStorage.setItem('accessToken', access);
                localStorage.setItem('refreshToken', refresh);
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect to Super Admin Dashboard
                router.push('/super-admin/dashboard');
            } else {
                setError('Access Denied: Super Admin privileges required.');
                // Optional: Logout immediately if we don't want to keep the session
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data?.detail || 'Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="icon-wrapper">
                        <Shield size={40} className="text-primary" />
                    </div>
                    <h2>Super Admin</h2>
                    <p>Secure Access Portal</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Username</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="superadmin"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login to Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Protected area. Authorized personnel only.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
