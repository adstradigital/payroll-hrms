'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon, Users, Save, Check, AlertCircle, Layers
} from 'lucide-react';
import './GeneralSettings.css';

export default function GeneralSettings() {
    const [notification, setNotification] = useState(null);
    const [expireDays, setExpireDays] = useState('360');
    const [pagination, setPagination] = useState('50');
    const [restrictLogin, setRestrictLogin] = useState(false);
    const [restrictEdit, setRestrictEdit] = useState(false);
    const [resignationRequest, setResignationRequest] = useState(true);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = () => {
        showNotification('Settings saved successfully', 'success');
    };

    return (
        <div className="general-settings">
            {notification && (
                <div className={`gs-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="gs-header">
                <h2>General Settings</h2>
                <p>Configure general application settings and defaults</p>
            </div>

            {/* System Defaults */}
            <div className="gs-card">
                <div className="gs-card-header">
                    <SettingsIcon size={18} />
                    <h3>System Defaults</h3>
                </div>
                <div className="gs-card-body">
                    <div className="gs-field-row">
                        <div className="gs-field">
                            <label>
                                Default Expire Days
                                <span className="gs-info" title="Days after which announcements expire">ⓘ</span>
                            </label>
                            <input
                                type="number"
                                value={expireDays}
                                onChange={(e) => setExpireDays(e.target.value)}
                                className="gs-input"
                            />
                        </div>
                        <div className="gs-field">
                            <label>
                                Pagination Limit
                                <span className="gs-info" title="Number of records shown per page">ⓘ</span>
                            </label>
                            <input
                                type="number"
                                value={pagination}
                                onChange={(e) => setPagination(e.target.value)}
                                className="gs-input"
                            />
                        </div>
                    </div>
                </div>
                <div className="gs-card-footer">
                    <button className="gs-btn-primary" onClick={handleSave}>
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Employee Restrictions */}
            <div className="gs-card">
                <div className="gs-card-header">
                    <Users size={18} />
                    <h3>Employee Restrictions</h3>
                </div>
                <div className="gs-card-body">
                    <div className="gs-toggle-item">
                        <div className="gs-toggle-info">
                            <span className="gs-toggle-label">Restrict Login Account</span>
                            <span className="gs-toggle-desc">Prevent all employees from logging into the portal</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={restrictLogin}
                                onChange={(e) => setRestrictLogin(e.target.checked)}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
                    <div className="gs-toggle-item">
                        <div className="gs-toggle-info">
                            <span className="gs-toggle-label">Restrict Profile Edit</span>
                            <span className="gs-toggle-desc">Prevent employees from editing their personal information</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={restrictEdit}
                                onChange={(e) => setRestrictEdit(e.target.checked)}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="gs-card">
                <div className="gs-card-header">
                    <Layers size={18} />
                    <h3>Features</h3>
                </div>
                <div className="gs-card-body">
                    <div className="gs-toggle-item">
                        <div className="gs-toggle-info">
                            <span className="gs-toggle-label">Enable Resignation Requests</span>
                            <span className="gs-toggle-desc">Allow employees to submit resignation requests via portal</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={resignationRequest}
                                onChange={(e) => setResignationRequest(e.target.checked)}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
