'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Info, Settings, Calendar, RefreshCcw } from 'lucide-react';
import { getLeaveTypes, updateLeaveType, getGlobalLeaveSettings, updateGlobalLeaveSettings, getLeaveSettings, updateLeaveSettings } from '@/api/api_clientadmin';
import './LeaveSettings.css';

export default function LeaveSettings() {
    const [settings, setSettings] = useState({
        fiscalYearStart: '04-01',
        defaultProbationMonths: 6,
        allowNegativeBalance: false,
        autoApproveShortLeave: false,
        isEncashmentEnabled: false,
    });

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, globalRes, encashmentRes] = await Promise.all([
                getLeaveTypes(),
                getGlobalLeaveSettings().catch(() => ({ data: {} })),
                getLeaveSettings().catch(() => ({ data: {} }))
            ]);
            
            setLeaveTypes(typesRes.data.results || typesRes.data || []);
            
            const globalData = globalRes.data || {};
            const encashmentData = encashmentRes.data || {};
            
            setSettings({
                fiscalYearStart: globalData.fiscal_year_start || '04-01',
                defaultProbationMonths: globalData.default_probation_months || 6,
                allowNegativeBalance: globalData.allow_negative_balance || false,
                autoApproveShortLeave: globalData.auto_approve_short_leave || false,
                isEncashmentEnabled: encashmentData.is_encashment_enabled || false,
            });
            
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load leave settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccess(null);
            
            await Promise.all([
                updateGlobalLeaveSettings({
                    fiscal_year_start: settings.fiscalYearStart,
                    default_probation_months: settings.defaultProbationMonths,
                    allow_negative_balance: settings.allowNegativeBalance,
                    auto_approve_short_leave: settings.autoApproveShortLeave,
                }),
                updateLeaveSettings({
                    is_encashment_enabled: settings.isEncashmentEnabled
                })
            ]);
            
            setSuccess('Settings updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError(err.response?.data?.error || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const toggle = (field) =>
        setSettings(prev => ({ ...prev, [field]: !prev[field] }));

    if (loading) {
        return (
            <div className="settings-loading-modern">
                <Loader2 size={48} className="animate-spin spinner-modern" />
                <p>Loading leave policies...</p>
            </div>
        );
    }

    return (
        <div className="leave-settings-modern">
            <div className="settings-header-glass">
                <div className="header-info">
                    <h2>Leave Policies &amp; Settings</h2>
                    <p>Configure global leave rules and feature toggles for your organization.</p>
                </div>
                <button
                    className="settings-btn settings-btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {error && (
                <div className="settings-alert-modern error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="settings-alert-modern success">
                    <Info size={18} />
                    <span>{success}</span>
                </div>
            )}

            <div className="settings-grid-modern">
                {/* Global Rules */}
                <div className="settings-card-glass">
                    <div className="card-header-modern">
                        <Settings size={20} />
                        <h3>General Rules</h3>
                    </div>
                    <div className="card-body-modern">
                        <div className="setting-item-modern">
                            <div className="setting-info-modern">
                                <label>Fiscal Year Start</label>
                                <span>The date when leave balances reset for the fiscal year cycle (MM-DD).</span>
                            </div>
                            <input
                                type="text"
                                placeholder="MM-DD"
                                value={settings.fiscalYearStart}
                                onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                                className="setting-input-modern"
                            />
                        </div>

                        <div className="setting-item-modern">
                            <div className="setting-info-modern">
                                <label>Default Probation Period</label>
                                <span>Leaves may be restricted during this period after joining (months).</span>
                            </div>
                            <input
                                type="number"
                                value={settings.defaultProbationMonths}
                                onChange={(e) => setSettings({ ...settings, defaultProbationMonths: parseInt(e.target.value) })}
                                className="setting-input-modern"
                            />
                        </div>

                        <div className="setting-item-modern">
                            <div className="setting-info-modern">
                                <label>Allow Negative Balance</label>
                                <span>Permit employees to take more leave than currently accrued (Advance Leave).</span>
                            </div>
                            <div className="setting-toggle-modern">
                                <input
                                    type="checkbox"
                                    checked={settings.allowNegativeBalance}
                                    onChange={(e) => setSettings({ ...settings, allowNegativeBalance: e.target.checked })}
                                />
                                <span className="toggle-slider-modern" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accrual Configuration Summary */}
                <div className="settings-card-glass">
                    <div className="card-header-modern">
                        <RefreshCcw size={20} />
                        <h3>Accrual Overview</h3>
                    </div>
                    <div className="card-body-modern">
                        <div className="accrual-list-modern">
                            {leaveTypes.map(type => (
                                <div key={type.id} className="accrual-item-modern">
                                    <div className="accrual-info-modern">
                                        <span className="type-name-modern">{type.name}</span>
                                        <span className="type-meta-modern">
                                            {type.days_per_year} days/year • {type.accrual_type || 'Full Year'}
                                            {type.is_encashable && <span className="encashable-tag">Encashable</span>}
                                        </span>
                                    </div>
                                    <div className={`accrual-status-modern ${type.is_active ? 'active' : 'inactive'}`}>
                                        {type.is_active ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="helper-text-modern">
                            <Info size={14} />
                            Manage encashability per leave type in the <strong>Leave Types</strong> tab.
                        </p>
                    </div>
                </div>

                {/* Automation */}
                <div className="settings-card-glass full-width">
                    <div className="card-header-modern">
                        <Calendar size={20} />
                        <h3>Automation & Notifications</h3>
                    </div>
                    <div className="card-body-modern grid-2">
                        <div className="setting-item-modern">
                            <div className="setting-info-modern">
                                <label>Auto-approve Short Leaves</label>
                                <span>Automatically approve leave requests of 1 day or less.</span>
                            </div>
                            <div className="setting-toggle-modern">
                                <input
                                    type="checkbox"
                                    checked={settings.autoApproveShortLeave}
                                    onChange={(e) => setSettings({ ...settings, autoApproveShortLeave: e.target.checked })}
                                />
                                <span className="toggle-slider-modern" />
                            </div>
                        </div>

                        <div className="setting-item-modern">
                            <div className="setting-info-modern">
                                <label>Enable Leave Encashment</label>
                                <span>Allow employees to encash their unused leaves at year end.</span>
                            </div>
                            <div className="setting-toggle-modern">
                                <input
                                    type="checkbox"
                                    checked={settings.isEncashmentEnabled}
                                    onChange={(e) => setSettings({ ...settings, isEncashmentEnabled: e.target.checked })}
                                />
                                <span className="toggle-slider-modern" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
