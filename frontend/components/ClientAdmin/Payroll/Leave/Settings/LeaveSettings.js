import { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Info, Settings, Calendar, RefreshCcw, Banknote, CheckCircle } from 'lucide-react';
import { getLeaveTypes, getLeaveSettings, updateLeaveSettings } from '@/api/api_clientadmin';
import './LeaveSettings.css';

export default function LeaveSettings() {
    const [settings, setSettings] = useState({
        fiscal_year_start: '04-01',
        default_probation_months: 6,
        allow_negative_balance: false,
        is_encashment_enabled: true,
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
            const [typesRes, settingsRes] = await Promise.all([
                getLeaveTypes(),
                getLeaveSettings(),
            ]);
            setLeaveTypes(typesRes.data.results || typesRes.data || []);
            setSettings(settingsRes.data);
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
            setError(null);
            await updateLeaveSettings(settings);
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3500);
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
                <div className="settings-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="settings-alert success">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                </div>
            )}

            <div className="settings-grid">

                {/* ── General Rules ───────────────────────────── */}
                <div className="settings-card">
                    <div className="card-header">
                        <Settings size={20} />
                        <h3>General Rules</h3>
                    </div>
                    <div className="card-body">
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Fiscal Year Start</label>
                                <span>The date when leave balances reset for the fiscal year cycle (MM-DD).</span>
                            </div>
                            <input
                                type="text"
                                placeholder="MM-DD"
                                value={settings.fiscal_year_start || ''}
                                onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })}
                                className="setting-input"
                                maxLength={5}
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Default Probation Period</label>
                                <span>Leaves may be restricted during this period after joining (months).</span>
                            </div>
                            <input
                                type="number"
                                min={0}
                                value={settings.default_probation_months ?? 6}
                                onChange={(e) => setSettings({ ...settings, default_probation_months: parseInt(e.target.value) || 0 })}
                                className="setting-input"
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Allow Negative Balance</label>
                                <span>Permit employees to take more leave than currently accrued (Advance Leave).</span>
                            </div>
                            <div className="setting-toggle">
                                <label className="ls-switch">
                                    <input
                                        type="checkbox"
                                        checked={!!settings.allow_negative_balance}
                                        onChange={() => toggle('allow_negative_balance')}
                                    />
                                    <span className="ls-slider" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Leave Encashment Toggle ──────────────────── */}
                <div className={`settings-card encashment-toggle-card ${settings.is_encashment_enabled ? 'enabled' : 'disabled'}`}>
                    <div className="card-header">
                        <Banknote size={20} />
                        <h3>Leave Encashment</h3>
                        <span className={`encashment-badge ${settings.is_encashment_enabled ? 'badge-on' : 'badge-off'}`}>
                            {settings.is_encashment_enabled ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="setting-item encashment-main-toggle">
                            <div className="setting-info">
                                <label className="encashment-label">Enable Leave Encashment Module</label>
                                <span>
                                    When enabled, employees can request to convert their unused leave balances
                                    into a monetary payout based on their daily salary rate.
                                </span>
                            </div>
                            <div className="setting-toggle">
                                <label className="ls-switch ls-switch--lg">
                                    <input
                                        type="checkbox"
                                        checked={!!settings.is_encashment_enabled}
                                        onChange={() => toggle('is_encashment_enabled')}
                                    />
                                    <span className="ls-slider" />
                                </label>
                            </div>
                        </div>

                        <div className={`encashment-info-box ${settings.is_encashment_enabled ? 'info-active' : 'info-inactive'}`}>
                            {settings.is_encashment_enabled ? (
                                <>
                                    <CheckCircle size={16} className="info-icon-active" />
                                    <p>
                                        Leave Encashment is <strong>active</strong>. Employees can request encashment for
                                        leave types where encashment is enabled. Admins can approve, reject, or mark
                                        requests as paid from the <em>Encashment</em> tab.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={16} className="info-icon-inactive" />
                                    <p>
                                        Leave Encashment is <strong>disabled</strong>. Employees will see a notice that
                                        this feature is unavailable. Existing requests are preserved.
                                        Toggle ON to re-enable the module.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Accrual Overview ────────────────────────── */}
                <div className="settings-card">
                    <div className="card-header">
                        <RefreshCcw size={20} />
                        <h3>Accrual Overview</h3>
                    </div>
                    <div className="card-body">
                        <div className="accrual-list">
                            {leaveTypes.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    No leave types configured yet.
                                </p>
                            ) : leaveTypes.map(type => (
                                <div key={type.id} className="accrual-item">
                                    <div className="accrual-info">
                                        <span className="type-name">{type.name}</span>
                                        <span className="type-meta">
                                            {type.days_per_year} days/year • {type.accrual_type || 'Full Year'}
                                            {type.is_encashable && <span className="encashable-tag">Encashable</span>}
                                        </span>
                                    </div>
                                    <div className={`accrual-status ${type.is_active ? 'active' : 'inactive'}`}>
                                        {type.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="helper-text">
                            <Info size={14} />
                            Manage encashability per leave type in the <strong>Leave Types</strong> tab.
                        </p>
                    </div>
                </div>

                {/* ── Automation ──────────────────────────────── */}
                <div className="settings-card full-width">
                    <div className="card-header">
                        <Calendar size={20} />
                        <h3>Automation &amp; Notifications</h3>
                    </div>
                    <div className="card-body grid-2">
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Auto-approve Short Leaves</label>
                                <span>Automatically approve leave requests of 1 day or less.</span>
                            </div>
                            <div className="setting-toggle">
                                <label className="ls-switch">
                                    <input type="checkbox" defaultChecked={false} readOnly />
                                    <span className="ls-slider" />
                                </label>
                            </div>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <label>Notify Manager on High Usage</label>
                                <span>Send alert if an employee&apos;s leave usage exceeds 80% of quota.</span>
                            </div>
                            <div className="setting-toggle">
                                <label className="ls-switch">
                                    <input type="checkbox" defaultChecked={true} readOnly />
                                    <span className="ls-slider" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
