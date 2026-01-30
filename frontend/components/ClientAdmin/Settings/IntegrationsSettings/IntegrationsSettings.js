'use client';

import { useState } from 'react';
import { Cloud, Link, Fingerprint, Save, Check, AlertCircle } from 'lucide-react';
import './IntegrationsSettings.css';

export default function IntegrationsSettings() {
    const [notification, setNotification] = useState(null);
    const [gdrive, setGdrive] = useState({
        enabled: true,
        schedule: 'Daily',
        lastBackup: '2026-01-27 02:00 AM'
    });
    const [slack, setSlack] = useState({
        enabled: false,
        webhook: ''
    });
    const [biometric, setBiometric] = useState({
        enabled: true,
        ip: '192.168.1.100'
    });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleTestConnection = () => {
        showNotification('Connection test successful!', 'success');
    };

    const handleBackupNow = () => {
        showNotification('Backup started...', 'success');
    };

    const handleSave = () => {
        showNotification('Settings saved successfully', 'success');
    };

    return (
        <div className="integrations-settings">
            {notification && (
                <div className={`int-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="int-header">
                <h2>Integrations & Data</h2>
                <p>Manage external connections and data backups</p>
            </div>

            {/* Google Drive Backup */}
            <div className="int-card">
                <div className="int-card-header">
                    <Cloud size={18} />
                    <h3>Google Drive Backup</h3>
                </div>
                <div className="int-card-body">
                    <div className="int-toggle-item">
                        <div className="int-toggle-info">
                            <span className="int-toggle-label">Enable Cloud Backup</span>
                            <span className="int-toggle-desc">Automatically backup database to Google Drive</span>
                        </div>
                        <label className="int-toggle-switch">
                            <input
                                type="checkbox"
                                checked={gdrive.enabled}
                                onChange={(e) => setGdrive({ ...gdrive, enabled: e.target.checked })}
                            />
                            <span className="int-toggle-slider"></span>
                        </label>
                    </div>

                    {gdrive.enabled && (
                        <div className="int-field-row">
                            <div className="int-field">
                                <label>Backup Schedule</label>
                                <select
                                    className="int-input"
                                    value={gdrive.schedule}
                                    onChange={(e) => setGdrive({ ...gdrive, schedule: e.target.value })}
                                >
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                </select>
                            </div>
                            <div className="int-field">
                                <label>Last Backup</label>
                                <div className="int-status">
                                    <span className="int-status-value">{gdrive.lastBackup}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="int-card-footer">
                    <button className="int-btn-primary" onClick={handleBackupNow}>
                        <Cloud size={16} />
                        Backup Now
                    </button>
                </div>
            </div>

            {/* Communication Channels */}
            <div className="int-card">
                <div className="int-card-header">
                    <Link size={18} />
                    <h3>Communication Channels</h3>
                </div>
                <div className="int-card-body">
                    <div className="int-toggle-item">
                        <div className="int-toggle-info">
                            <span className="int-toggle-label">Slack Notifications</span>
                            <span className="int-toggle-desc">Send leave requests and announcements to Slack</span>
                        </div>
                        <label className="int-toggle-switch">
                            <input
                                type="checkbox"
                                checked={slack.enabled}
                                onChange={(e) => setSlack({ ...slack, enabled: e.target.checked })}
                            />
                            <span className="int-toggle-slider"></span>
                        </label>
                    </div>

                    {slack.enabled && (
                        <div className="int-field">
                            <label>Webhook URL</label>
                            <input
                                type="text"
                                className="int-input"
                                placeholder="https://hooks.slack.com/services/..."
                                value={slack.webhook}
                                onChange={(e) => setSlack({ ...slack, webhook: e.target.value })}
                            />
                        </div>
                    )}
                </div>
                <div className="int-card-footer">
                    <button className="int-btn-primary" onClick={handleSave}>
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Biometric Devices */}
            <div className="int-card">
                <div className="int-card-header">
                    <Fingerprint size={18} />
                    <h3>Biometric Devices</h3>
                </div>
                <div className="int-card-body">
                    <div className="int-toggle-item">
                        <div className="int-toggle-info">
                            <span className="int-toggle-label">Sync Biometric Data</span>
                            <span className="int-toggle-desc">Pull attendance logs from local devices</span>
                        </div>
                        <label className="int-toggle-switch">
                            <input
                                type="checkbox"
                                checked={biometric.enabled}
                                onChange={(e) => setBiometric({ ...biometric, enabled: e.target.checked })}
                            />
                            <span className="int-toggle-slider"></span>
                        </label>
                    </div>

                    {biometric.enabled && (
                        <div className="int-field-row">
                            <div className="int-field">
                                <label>Device IP Address</label>
                                <input
                                    type="text"
                                    className="int-input"
                                    value={biometric.ip}
                                    onChange={(e) => setBiometric({ ...biometric, ip: e.target.value })}
                                />
                            </div>
                            <div className="int-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="int-btn-secondary" onClick={handleTestConnection}>
                                    Test Connection
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
