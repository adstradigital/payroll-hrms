'use client';

import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Users, Save, Check, AlertCircle, Layers, Search
} from 'lucide-react';
import { getOrganization, updateOrganizationSettings } from '@/api/api_clientadmin';
import './GeneralSettings.css';

export default function GeneralSettings() {
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expireDays, setExpireDays] = useState('360');
    const [pagination, setPagination] = useState('50');
    const [restrictLogin, setRestrictLogin] = useState(false);
    const [restrictEdit, setRestrictEdit] = useState(false);
    const [resignationRequest, setResignationRequest] = useState(true);
    const [enableGlobalSearch, setEnableGlobalSearch] = useState(true);
    const [enableTaxManagement, setEnableTaxManagement] = useState(true);

    // Fetch organization settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            console.log('⚙️ === FETCHING SETTINGS ===');
            try {
                const response = await getOrganization();
                console.log('⚙️ Full API response:', response);

                const org = response.data?.organization;
                console.log('⚙️ Organization object:', org);

                if (org) {
                    const globalSearch = org.enable_global_search ?? true;
                    const taxMgmt = org.enable_tax_management ?? true;

                    console.log('⚙️ enable_global_search from API:', org.enable_global_search);
                    console.log('⚙️ enable_tax_management from API:', org.enable_tax_management);
                    console.log('⚙️ Setting enableGlobalSearch to:', globalSearch);
                    console.log('⚙️ Setting enableTaxManagement to:', taxMgmt);

                    setEnableGlobalSearch(globalSearch);
                    setEnableTaxManagement(taxMgmt);
                }
            } catch (error) {
                console.error('⚙️ ❌ Failed to fetch organization settings:', error);
                showNotification('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = async () => {
        console.log('💾 === SAVE SETTINGS STARTED ===');
        console.log('💾 Current enableGlobalSearch:', enableGlobalSearch);
        console.log('💾 Current enableTaxManagement:', enableTaxManagement);

        setSaving(true);
        try {
            const settingsPayload = {
                enable_global_search: enableGlobalSearch,
                enable_tax_management: enableTaxManagement
            };

            console.log('💾 Payload to send:', settingsPayload);

            const response = await updateOrganizationSettings(settingsPayload);

            console.log('💾 API Response:', response);
            console.log('💾 Response data:', response.data);

            showNotification('Settings saved successfully', 'success');

            // Reload page after a short delay to apply changes
            setTimeout(() => {
                console.log('💾 Reloading page in 1 second...');
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('💾 ❌ Failed to save settings:', error);
            console.error('💾 ❌ Error response:', error.response);
            console.error('💾 ❌ Error data:', error.response?.data);
            showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
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
                            <span className="gs-toggle-label">Enable Global Search</span>
                            <span className="gs-toggle-desc">Show global search bar in the header for all users</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={enableGlobalSearch}
                                onChange={(e) => setEnableGlobalSearch(e.target.checked)}
                                disabled={loading || saving}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
                    <div className="gs-toggle-item">
                        <div className="gs-toggle-info">
                            <span className="gs-toggle-label">Enable Tax Management</span>
                            <span className="gs-toggle-desc">Enable tax management features and calculations</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={enableTaxManagement}
                                onChange={(e) => setEnableTaxManagement(e.target.checked)}
                                disabled={loading || saving}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
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
                <div className="gs-card-footer">
                    <button
                        className="gs-btn-primary"
                        onClick={handleSave}
                        disabled={loading || saving}
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
