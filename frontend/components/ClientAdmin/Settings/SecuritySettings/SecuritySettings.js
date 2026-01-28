'use client';

import { useState } from 'react';
import { Shield, Lock, Save, Check, AlertCircle } from 'lucide-react';
import './SecuritySettings.css';

export default function SecuritySettings() {
    const [notification, setNotification] = useState(null);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [ipWhitelist, setIpWhitelist] = useState('');
    const [strongPassword, setStrongPassword] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(false);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = () => {
        showNotification('Security settings saved successfully', 'success');
    };

    return (
        <div className="security-settings">
            {notification && (
                <div className={`sec-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="sec-header">
                <h2>Security & Access</h2>
                <p>Configure security protocols and audit access</p>
            </div>

            {/* Login Security */}
            <div className="sec-card">
                <div className="sec-card-header">
                    <Shield size={18} />
                    <h3>Login Security</h3>
                </div>
                <div className="sec-card-body">
                    <div className="sec-toggle-item">
                        <div className="sec-toggle-info">
                            <span className="sec-toggle-label">Two-Factor Authentication (2FA)</span>
                            <span className="sec-toggle-desc">Enforce 2FA for all administrator accounts</span>
                        </div>
                        <label className="sec-toggle-switch">
                            <input
                                type="checkbox"
                                checked={twoFactorEnabled}
                                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            />
                            <span className="sec-toggle-slider"></span>
                        </label>
                    </div>

                    <div className="sec-field">
                        <label>Session Timeout (Minutes)</label>
                        <input
                            type="number"
                            className="sec-input"
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            style={{ maxWidth: '150px' }}
                        />
                        <span className="sec-hint">
                            Automatically log out users after inactivity
                        </span>
                    </div>
                </div>
            </div>

            {/* IP Restrictions */}
            <div className="sec-card">
                <div className="sec-card-header">
                    <Lock size={18} />
                    <h3>IP Restrictions</h3>
                </div>
                <div className="sec-card-body">
                    <div className="sec-field">
                        <label>Whitelisted IP Addresses</label>
                        <textarea
                            className="sec-textarea"
                            rows={4}
                            placeholder="192.168.1.1&#10;10.0.0.5&#10;Enter one IP per line..."
                            value={ipWhitelist}
                            onChange={(e) => setIpWhitelist(e.target.value)}
                        ></textarea>
                        <span className="sec-hint">
                            Leave empty to allow access from anywhere. One IP address per line.
                        </span>
                    </div>
                </div>
                <div className="sec-card-footer">
                    <button className="sec-btn-primary" onClick={handleSave}>
                        <Save size={16} />
                        Save Security Rules
                    </button>
                </div>
            </div>

            {/* Password Policy */}
            <div className="sec-card">
                <div className="sec-card-header">
                    <Lock size={18} />
                    <h3>Password Policy</h3>
                </div>
                <div className="sec-card-body">
                    <div className="sec-toggle-item">
                        <div className="sec-toggle-info">
                            <span className="sec-toggle-label">Require Strong Passwords</span>
                            <span className="sec-toggle-desc">Minimum 8 characters with uppercase, lowercase, number, and symbol</span>
                        </div>
                        <label className="sec-toggle-switch">
                            <input
                                type="checkbox"
                                checked={strongPassword}
                                onChange={(e) => setStrongPassword(e.target.checked)}
                            />
                            <span className="sec-toggle-slider"></span>
                        </label>
                    </div>

                    <div className="sec-toggle-item">
                        <div className="sec-toggle-info">
                            <span className="sec-toggle-label">Password Expiry</span>
                            <span className="sec-toggle-desc">Force password change every 90 days</span>
                        </div>
                        <label className="sec-toggle-switch">
                            <input
                                type="checkbox"
                                checked={passwordExpiry}
                                onChange={(e) => setPasswordExpiry(e.target.checked)}
                            />
                            <span className="sec-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
