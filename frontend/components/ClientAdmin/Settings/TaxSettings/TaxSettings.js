'use client';

import { useState, useEffect } from 'react';
import {
    Save, Check, AlertCircle, FileText
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { usePermissions } from '@/context/PermissionContext';
import './TaxSettings.css';

export default function TaxSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [enableTaxManagement, setEnableTaxManagement] = useState(true);
    const { refetchPermissions } = usePermissions();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/account/organization/');
            if (response.data?.organization) {
                setEnableTaxManagement(response.data.organization.enable_tax_management ?? true);
            }
        } catch (error) {
            console.error('Failed to fetch tax settings:', error);
            showNotification('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axiosInstance.patch('/account/organization/', {
                enable_tax_management: enableTaxManagement
            });

            showNotification('Tax settings saved successfully', 'success');

            // Refresh permissions to update sidebar immediately
            if (refetchPermissions) {
                refetchPermissions();
            }

        } catch (error) {
            console.error('Failed to save tax settings:', error);
            showNotification(
                error.response?.data?.error || 'Failed to save settings',
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="tax-settings">
            {notification && (
                <div className={`gs-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="gs-header">
                <h2>Tax Settings</h2>
                <p>Configure tax management module visibility and defaults</p>
            </div>

            {/* Application Modules */}
            <div className="gs-card">
                <div className="gs-card-header">
                    <FileText size={18} />
                    <h3>Module Visibility</h3>
                </div>
                <div className="gs-card-body">
                    <div className="gs-toggle-item">
                        <div className="gs-toggle-info">
                            <span className="gs-toggle-label">Enable Tax Management</span>
                            <span className="gs-toggle-desc">Show the Tax Management section in the sidebar and allow access to tax declaration features.</span>
                        </div>
                        <label className="gs-toggle-switch">
                            <input
                                type="checkbox"
                                checked={enableTaxManagement}
                                onChange={(e) => setEnableTaxManagement(e.target.checked)}
                            />
                            <span className="gs-toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div className="gs-card-footer">
                    <button
                        className="gs-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <span className="animate-spin mr-2">⟳</span>
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
