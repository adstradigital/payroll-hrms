'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader, AlertCircle, Check } from 'lucide-react';
import { getPayrollSettings, updatePayrollSettings } from '../../../../api/api_clientadmin';
import './EmailSettings.css';

export default function EmailSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [settings, setSettings] = useState({
        email_host: '',
        email_port: 587,
        email_host_user: '',
        email_host_password: '',
        email_use_tls: true,
        default_from_email: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await getPayrollSettings();
            if (response.data) {
                setSettings({
                    email_host: response.data.email_host || '',
                    email_port: response.data.email_port || 587,
                    email_host_user: response.data.email_host_user || '',
                    email_host_password: response.data.email_host_password || '',
                    email_use_tls: response.data.email_use_tls ?? true,
                    default_from_email: response.data.default_from_email || ''
                });
            }
        } catch (error) {
            console.error('Error fetching email settings:', error);
            showNotification('Failed to load email settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await updatePayrollSettings(settings);
            showNotification('Email settings updated successfully');
        } catch (error) {
            console.error('Error updating email settings:', error);
            const msg = error.response?.data?.error || error.message;
            showNotification(`Failed to update settings: ${msg}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="email-settings">
            {notification && (
                <div className={`gs-notification ${notification.type} fixed bottom-8 right-8 z-50`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="gs-header">
                <h2>Email Configuration</h2>
                <p>Configure outgoing SMTP settings for system notifications and payslips</p>
            </div>

            <div className="gs-card">
                <div className="gs-card-header">
                    <Mail size={18} />
                    <h3>SMTP Server Settings</h3>
                </div>
                <div className="gs-card-body">
                    <div className="settings-form-grid">
                        <div className="gs-form-group">
                            <label className="gs-label">SMTP Host</label>
                            <input
                                type="text"
                                className="gs-input"
                                placeholder="smtp.gmail.com"
                                value={settings.email_host}
                                onChange={(e) => setSettings({ ...settings, email_host: e.target.value })}
                            />
                        </div>
                        <div className="gs-form-group">
                            <label className="gs-label">SMTP Port</label>
                            <input
                                type="number"
                                className="gs-input"
                                placeholder="587"
                                value={settings.email_port}
                                onChange={(e) => setSettings({ ...settings, email_port: parseInt(e.target.value) || '' })}
                            />
                        </div>
                        <div className="gs-form-group">
                            <label className="gs-label">Email Address (User)</label>
                            <input
                                type="email"
                                className="gs-input"
                                placeholder="your-email@gmail.com"
                                value={settings.email_host_user}
                                onChange={(e) => setSettings({ ...settings, email_host_user: e.target.value })}
                            />
                        </div>
                        <div className="gs-form-group">
                            <label className="gs-label">App Password</label>
                            <input
                                type="password"
                                className="gs-input"
                                placeholder="•••• •••• •••• ••••"
                                value={settings.email_host_password}
                                onChange={(e) => setSettings({ ...settings, email_host_password: e.target.value })}
                            />
                        </div>
                        <div className="gs-form-group">
                            <label className="gs-label">Default From Email</label>
                            <input
                                type="text"
                                className="gs-input"
                                placeholder="NexusHRMS <noreply@nexushrms.com>"
                                value={settings.default_from_email}
                                onChange={(e) => setSettings({ ...settings, default_from_email: e.target.value })}
                            />
                        </div>
                        <div className="gs-toggle-item pt-4">
                            <div className="gs-toggle-info">
                                <span className="gs-toggle-label">Use TLS</span>
                                <span className="gs-toggle-desc">Recommended for most SMTP providers</span>
                            </div>
                            <label className="gs-toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.email_use_tls}
                                    onChange={(e) => setSettings({ ...settings, email_use_tls: e.target.checked })}
                                />
                                <span className="gs-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-4">
                        <AlertCircle className="text-indigo-500 shrink-0" size={20} />
                        <div>
                            <h4 className="font-bold text-sm text-indigo-400">Security Note</h4>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                For Gmail, use an <strong>App Password</strong> instead of your regular account password.
                                Make sure 2-Step Verification is enabled in your Google Account.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="gs-card-footer">
                    <button
                        className="gs-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
