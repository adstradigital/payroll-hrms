'use client';

'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Save, Check, AlertCircle, Key, X, Delete, Users } from 'lucide-react';
import { getSecurityProfile, updateSecurityProfile, setSecurityPin, getAllEmployees, getOrganization, updateOrganizationSettings, adminSetSecurityPin } from '@/api/api_clientadmin';
import './SecuritySettings.css';

export default function SecuritySettings() {
    const [notification, setNotification] = useState(null);
    const [localError, setLocalError] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [ipWhitelist, setIpWhitelist] = useState('');
    const [strongPassword, setStrongPassword] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(false);

    // PIN & Clearance State
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [clearanceLevel] = useState(1);
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState(1); // 1: Enter, 2: Confirm
    const [hasExistingPin, setHasExistingPin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    // Admin managing other user PIN
    const [managingUser, setManagingUser] = useState(null);
    const [adminNewPin, setAdminNewPin] = useState('');
    const [adminConfirmPin, setAdminConfirmPin] = useState('');
    const [adminPinStep, setAdminPinStep] = useState(1);

    useEffect(() => {
        fetchSecurityProfile();
        fetchUsers();
        fetchOrgSettings();
    }, []);

    const fetchSecurityProfile = async () => {
        try {
            setLoading(true);
            const response = await getSecurityProfile();
            if (response.data.success) {
                const profile = response.data.profile;
                setIsPinEnabled(profile.is_pin_enabled);
                setHasExistingPin(profile.has_pin);
            }
        } catch (error) {
            console.error('Error fetching security profile:', error);
            showNotification('Failed to load security profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrgSettings = async () => {
        try {
            const response = await getOrganization();
            if (response.data.success) {
                const settings = response.data.organization?.settings || {};
                setTwoFactorEnabled(settings.two_factor_enabled || false);
                setSessionTimeout(settings.session_timeout || 30);
                setIpWhitelist(settings.ip_whitelist || '');
                setStrongPassword(settings.strong_password !== false);
                setPasswordExpiry(settings.password_expiry || false);
            }
        } catch (error) {
            console.error('Error fetching organization settings:', error);
        }
    };


    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type === 'error') setLocalError(message);
        setTimeout(() => {
            setNotification(null);
            setLocalError('');
        }, 3000);
    };

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const res = await getAllEmployees();
            const list = res?.data?.results || res?.data?.employees || res?.data || [];
            setUsers(list);
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification('Failed to load users list', 'error');
        } finally {
            setUsersLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const settings = {
                two_factor_enabled: twoFactorEnabled,
                session_timeout: parseInt(sessionTimeout) || 30,
                ip_whitelist: ipWhitelist,
                strong_password: strongPassword,
                password_expiry: passwordExpiry
            };
            const response = await updateOrganizationSettings(settings);
            if (response.data.success) {
                showNotification('Security settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to save security settings', 'error');
        }
    };


    const handleKeypadPress = (num) => {
        setLocalError(''); // Clear error on new input
        if (pinStep === 1) {
            if (pin.length < 4) setPin(prev => prev + num);
        } else {
            if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setLocalError(''); // Clear error on new input
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

    const handleAdminKeypadPress = (num) => {
        setLocalError(''); // Clear error on new input
        if (adminPinStep === 1) {
            if (adminNewPin.length < 4) setAdminNewPin(prev => prev + num);
        } else {
            if (adminConfirmPin.length < 4) setAdminConfirmPin(prev => prev + num);
        }
    };

    const handleAdminBackspace = () => {
        setLocalError(''); // Clear error on new input
        if (adminPinStep === 1) {
            setAdminNewPin(prev => prev.slice(0, -1));
        } else {
            setAdminConfirmPin(prev => prev.slice(0, -1));
        }
    };

    const finalizeAdminPin = async () => {
        if (adminPinStep === 1) {
            if (adminNewPin.length === 4) setAdminPinStep(2);
        } else {
            if (adminNewPin === adminConfirmPin) {
                try {
                        const response = await adminSetSecurityPin({
                            user_id: managingUser.user,
                            employee_id: managingUser.id,
                            pin: adminNewPin,
                            confirm_pin: adminConfirmPin
                        });
                    if (response.data.success) {
                        showNotification(`PIN for ${managingUser.full_name || 'user'} updated successfully`);
                        setManagingUser(null);
                        setAdminNewPin('');
                        setAdminConfirmPin('');
                        setAdminPinStep(1);
                        fetchUsers(); // Refresh to show new PIN status
                    }
                } catch (error) {
                    console.error('Admin PIN error:', error);
                    const errorMsg = error.response?.data?.error || 'Failed to update user PIN';
                    showNotification(errorMsg, 'error');
                }
            } else {
                showNotification('PINs do not match', 'error');
                setAdminConfirmPin('');
            }
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
                                <div className={`sec-pin-dots ${localError ? 'shake' : ''}`}>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`sec-pin-dot ${(pinStep === 1 ? pin : confirmPin).length > i ? 'active' : ''}`} />
                                    ))}
                                </div>

                                {localError && (
                                    <div className="sec-modal-error-text">
                                        <AlertCircle size={14} />
                                        {localError}
                                    </div>
                                )}
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
                    ) : null}
                </div>
            </div>

            {/* Users List */}
            <div className="sec-card">
                <div className="sec-card-header">
                    <Users size={18} />
                    <h3>Users & PIN Status</h3>
                </div>
                <div className="sec-card-body">
                    {usersLoading ? (
                        <div className="sec-hint">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="sec-hint">No users found.</div>
                    ) : (
                        <div className="sec-users-list">
                            {users.map((u) => {
                                const name = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'User';
                                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <div key={u.id} className="sec-user-row">
                                        <div className="sec-user-left">
                                            <div className="sec-user-avatar">{initials}</div>
                                            <div className="sec-user-info">
                                                <div className="sec-user-name">{name}</div>
                                                <div className="sec-user-meta">
                                                    <span>{u.email || '—'}</span>
                                                    {u.designation_name && <span>• {u.designation_name}</span>}
                                                    {u.user ? (
                                                        <span className={`sec-pin-indicator ${u.has_security_pin ? 'set' : 'not-set'}`}>
                                                            {u.has_security_pin ? 'PIN Set' : 'No PIN'}
                                                        </span>
                                                    ) : (
                                                        <span className="sec-pin-indicator warning">
                                                            No Account
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                            <div className="sec-user-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span className={`sec-user-badge ${u.is_admin ? 'admin' : 'user'}`}>
                                                    {u.is_admin ? 'Admin' : 'User'}
                                                </span>
                                                <button
                                                    className="sec-btn-text"
                                                    style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 600, 
                                                        color: u.user ? 'var(--brand-primary)' : 'var(--text-muted)', 
                                                        background: 'none', 
                                                        border: 'none', 
                                                        cursor: u.user ? 'pointer' : 'not-allowed',
                                                        opacity: u.user ? 1 : 0.6
                                                    }}
                                                    disabled={!u.user}
                                                    onClick={() => {
                                                        setManagingUser(u);
                                                        setAdminPinStep(1);
                                                        setAdminNewPin('');
                                                        setAdminConfirmPin('');
                                                    }}
                                                    title={!u.user ? 'This employee has no active account. Please invite them first.' : ''}
                                                >
                                                    Manage PIN
                                                </button>
                                            </div>
                                    </div>
                                );
                            })}
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
                <div className="sec-card-footer">
                    <button className="sec-btn-primary" onClick={handleSave}>
                        <Save size={16} />
                        Save Login Security
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
                <div className="sec-card-footer">
                    <button className="sec-btn-primary" onClick={handleSave}>
                        <Save size={16} />
                        Save Password Policy
                    </button>
                </div>
            </div>

            {/* Admin PIN Management Modal */}
            {managingUser && (
                <div className="sec-modal-overlay">
                    <div className="sec-modal-content">
                        <div className="sec-modal-header">
                            <div>
                                <h3>Manage Security PIN</h3>
                                <p>Setting PIN for {managingUser.full_name}</p>
                            </div>
                            <button className="sec-modal-close" onClick={() => setManagingUser(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="sec-modal-body">
                            <div className="sec-pin-container">
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                        {adminPinStep === 1 ? 'Enter New 4-Digit PIN' : 'Confirm New PIN'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        The user will be able to use this PIN immediately
                                    </p>
                                </div>

                                <div className="sec-pin-display">
                                    <div className={`sec-pin-dots ${localError ? 'shake' : ''}`}>
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className={`sec-pin-dot ${(adminPinStep === 1 ? adminNewPin : adminConfirmPin).length > i ? 'active' : ''}`} />
                                        ))}
                                    </div>

                                    {localError && (
                                        <div className="sec-modal-error-text">
                                            <AlertCircle size={14} />
                                            {localError}
                                        </div>
                                    )}
                                </div>

                                <div className="sec-pin-keypad">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button key={num} onClick={() => handleAdminKeypadPress(num)} className="sec-keypad-btn">
                                            {num}
                                        </button>
                                    ))}
                                    <div className="sec-keypad-btn empty" />
                                    <button onClick={() => handleAdminKeypadPress(0)} className="sec-keypad-btn">0</button>
                                    <button className="sec-keypad-btn action" onClick={handleAdminBackspace}>
                                        <Delete size={18} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        className="sec-btn-outline"
                                        style={{ flex: 1 }}
                                        onClick={() => { setManagingUser(null); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="sec-btn-primary"
                                        style={{ flex: 1 }}
                                        disabled={adminPinStep === 1 ? adminNewPin.length !== 4 : adminConfirmPin.length !== 4}
                                        onClick={finalizeAdminPin}
                                    >
                                        {adminPinStep === 1 ? 'Next' : 'Update PIN'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
