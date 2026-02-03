'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Save, Check, AlertCircle, Key, Fingerprint, ChevronRight, X, Delete } from 'lucide-react';
import { getSecurityProfile, updateSecurityProfile, setSecurityPin } from '@/api/api_clientadmin';
import './SecuritySettings.css';

export default function SecuritySettings() {
    const [notification, setNotification] = useState(null);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [ipWhitelist, setIpWhitelist] = useState('');
    const [strongPassword, setStrongPassword] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(false);

    // PIN & Clearance State
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [clearanceLevel, setClearanceLevel] = useState(1);
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState(1); // 1: Enter, 2: Confirm
    const [hasExistingPin, setHasExistingPin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSecurityProfile();
    }, []);

    const fetchSecurityProfile = async () => {
        try {
            setLoading(true);
            const response = await getSecurityProfile();
            if (response.data.success) {
                const profile = response.data.profile;
                setIsPinEnabled(profile.is_pin_enabled);
                setClearanceLevel(profile.clearance_level);
                setHasExistingPin(profile.has_pin);
            }
        } catch (error) {
            console.error('Error fetching security profile:', error);
            showNotification('Failed to load security profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = () => {
        showNotification('Security settings saved successfully', 'success');
    };

    const handleKeypadPress = (num) => {
        if (pinStep === 1) {
            if (pin.length < 4) setPin(prev => prev + num);
        } else {
            if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        if (pinStep === 1) {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
    };

    const finalizePin = async () => {
        if (pinStep === 1) {
            if (pin.length === 4) setPinStep(2);
        } else {
            if (pin === confirmPin) {
                try {
                    const response = await setSecurityPin({ pin, confirm_pin: confirmPin });
                    if (response.data.success) {
                        setIsPinEnabled(true);
                        setHasExistingPin(true);
                        setIsSettingPin(false);
                        setPin('');
                        setConfirmPin('');
                        setPinStep(1);
                        showNotification('Security PIN updated successfully');
                    }
                } catch (error) {
                    console.error('Error setting PIN:', error);
                    const errorMsg = error.response?.data?.pin?.[0] || error.response?.data?.non_field_errors?.[0] || 'Failed to update PIN';
                    showNotification(errorMsg, 'error');
                }
            } else {
                showNotification('PINs do not match. Please try again.', 'error');
                setConfirmPin('');
            }
        }
    };

    const handleClearanceChange = async (level) => {
        try {
            const response = await updateSecurityProfile({ clearance_level: level });
            if (response.data.success) {
                setClearanceLevel(level);
                showNotification(`Clearance level updated to Level ${level}`);
            }
        } catch (error) {
            console.error('Error updating clearance level:', error);
            showNotification('Failed to update clearance level', 'error');
        }
    };

    const togglePin = async (enabled) => {
        if (enabled && !hasExistingPin) {
            setIsSettingPin(true);
        } else {
            try {
                const response = await updateSecurityProfile({ is_pin_enabled: enabled });
                if (response.data.success) {
                    setIsPinEnabled(enabled);
                    showNotification(enabled ? 'Security PIN enabled' : 'Security PIN disabled');
                }
            } catch (error) {
                console.error('Error toggling PIN:', error);
                showNotification('Failed to update PIN status', 'error');
            }
        }
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

            {/* PIN & Clearance */}
            <div className="sec-card">
                <div className="sec-card-header">
                    <Key size={18} />
                    <h3>Security Clearance & PIN</h3>
                </div>
                <div className="sec-card-body">
                    <div className="sec-toggle-item">
                        <div className="sec-toggle-info">
                            <span className="sec-toggle-label">4-Digit Security PIN</span>
                            <span className="sec-toggle-desc">Require PIN for approvals and sensitive actions</span>
                        </div>
                        <label className="sec-toggle-switch">
                            <input
                                type="checkbox"
                                checked={isPinEnabled}
                                onChange={(e) => togglePin(e.target.checked)}
                            />
                            <span className="sec-toggle-slider"></span>
                        </label>
                    </div>

                    {isPinEnabled && (
                        <div className="sec-pin-status verified">
                            <Check size={14} /> Security PIN is active and protecting your account
                            <button
                                className="sec-btn-text"
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => { setIsSettingPin(true); setPinStep(1); setPin(''); setConfirmPin(''); }}
                            >
                                Change PIN
                            </button>
                        </div>
                    )}

                    {isSettingPin ? (
                        <div className="sec-pin-container">
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {pinStep === 1 ? 'Enter New 4-Digit PIN' : 'Confirm Your PIN'}
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Pins are used for quick authorization of sensitive tasks
                                </p>
                            </div>

                            <div className="sec-pin-display">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`sec-pin-dot ${(pinStep === 1 ? pin.length : confirmPin.length) > i ? 'filled' : ''
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="sec-pin-keypad">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button key={num} onClick={() => handleKeypadPress(num)} className="sec-keypad-btn">
                                        {num}
                                    </button>
                                ))}
                                <button className="sec-keypad-btn action" onClick={() => setIsSettingPin(false)}>
                                    <X size={18} />
                                </button>
                                <button onClick={() => handleKeypadPress(0)} className="sec-keypad-btn">0</button>
                                <button className="sec-keypad-btn action" onClick={handleBackspace}>
                                    <Delete size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="sec-btn-outline"
                                    style={{ flex: 1 }}
                                    onClick={() => { setIsSettingPin(false); setPinStep(1); setPin(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="sec-btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={pinStep === 1 ? pin.length !== 4 : confirmPin.length !== 4}
                                    onClick={finalizePin}
                                >
                                    {pinStep === 1 ? 'Next' : 'Set PIN'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sec-clearance-levels">
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                Clearance Level
                            </label>
                            {[
                                { level: 1, name: 'Basic', desc: 'Standard read-write access' },
                                { level: 2, name: 'Standard', desc: 'Can process payroll and leaves' },
                                { level: 3, name: 'High', desc: 'Can approve financial transactions' },
                                { level: 4, name: 'Critical', desc: 'Full administrative clearance' }
                            ].map(item => (
                                <div
                                    key={item.level}
                                    className={`sec-clearance-item ${clearanceLevel === item.level ? 'active' : ''}`}
                                    onClick={() => handleClearanceChange(item.level)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="sec-clearance-icon">
                                        {item.level === 4 ? <Shield size={16} /> : <Fingerprint size={16} />}
                                    </div>
                                    <div className="sec-clearance-info">
                                        <span className="sec-clearance-name">Level {item.level} - {item.name}</span>
                                        <span className="sec-clearance-desc">{item.desc}</span>
                                    </div>
                                    {clearanceLevel === item.level && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--brand-primary)' }} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
