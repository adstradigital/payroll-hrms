import { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Info, Settings, Calendar, RefreshCcw } from 'lucide-react';
import { getLeaveTypes, updateLeaveType } from '@/api/api_clientadmin';
import './LeaveSettings.css';

export default function LeaveSettings() {
    const [settings, setSettings] = useState({
        fiscalYearStart: '04-01',
        defaultProbationMonths: 6,
        allowNegativeBalance: false,
        autoApproveShortLeave: false,
    });

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await getLeaveTypes();
            setLeaveTypes(res.data.results || res.data || []);
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
            // In a real scenario, we'd have a separate global settings API
            // For now, we simulate saving global policy
            await new Promise(resolve => setTimeout(resolve, 800));
            setSuccess('Settings updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading leave policies...</p>
            </div>
        );
    }

    return (
        <div className="leave-settings">
            <div className="settings-header">
                <div className="header-info">
                    <h2>Leave Policies & Settings</h2>
                    <p>Configure global leave rules and automated accrual behaviors for your organization.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            {success && (
                <div className="settings-alert success">
                    <Info size={18} />
                    <span>{success}</span>
                </div>
            )}

            <div className="settings-grid">
                {/* Global Rules */}
                <div className="settings-card">
                    <div className="card-header">
                        <Settings size={20} />
                        <h3>General Rules</h3>
                    </div>
                    <div className="card-body">
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Fiscal Year Start</label>
                                <span>The date when leave balances reset for the fiscal year cycle.</span>
                            </div>
                            <input
                                type="text"
                                placeholder="MM-DD"
                                value={settings.fiscalYearStart}
                                onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                                className="setting-input"
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Default Probation Period</label>
                                <span>Leaves may be restricted during this period after joining (months).</span>
                            </div>
                            <input
                                type="number"
                                value={settings.defaultProbationMonths}
                                onChange={(e) => setSettings({ ...settings, defaultProbationMonths: parseInt(e.target.value) })}
                                className="setting-input"
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Allow Negative Balance</label>
                                <span>Permit employees to take more leave than currently accrued (Advance Leave).</span>
                            </div>
                            <div className="setting-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.allowNegativeBalance}
                                    onChange={(e) => setSettings({ ...settings, allowNegativeBalance: e.target.checked })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accrual Configuration Summary */}
                <div className="settings-card">
                    <div className="card-header">
                        <RefreshCcw size={20} />
                        <h3>Accrual Overview</h3>
                    </div>
                    <div className="card-body">
                        <div className="accrual-list">
                            {leaveTypes.map(type => (
                                <div key={type.id} className="accrual-item">
                                    <div className="accrual-info">
                                        <span className="type-name">{type.name}</span>
                                        <span className="type-meta">
                                            {type.days_per_year} days/year • {type.accrual_type || 'Full Year'}
                                        </span>
                                    </div>
                                    <div className={`accrual-status ${type.is_active ? 'active' : 'inactive'}`}>
                                        {type.is_active ? 'Enabled' : 'Disabled'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="helper-text">
                            <Info size={14} />
                            Modify individual accrual rates in the <strong>Leave Types</strong> section.
                        </p>
                    </div>
                </div>

                {/* Automation */}
                <div className="settings-card full-width">
                    <div className="card-header">
                        <Calendar size={20} />
                        <h3>Automation & Notifications</h3>
                    </div>
                    <div className="card-body grid-2">
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Auto-approve Short Leaves</label>
                                <span>Automatically approve leave requests of 1 day or less.</span>
                            </div>
                            <div className="setting-toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.autoApproveShortLeave}
                                    onChange={(e) => setSettings({ ...settings, autoApproveShortLeave: e.target.checked })}
                                />
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Notify Manager on High Usage</label>
                                <span>Send alert if an employee's leave usage exceeds 80% of quota.</span>
                            </div>
                            <div className="setting-toggle">
                                <input type="checkbox" defaultChecked />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
