'use client';

import { useState, useEffect } from 'react';
import {
    Clock, Plus, Edit2, Trash2, Save, X, Sun, Moon, Coffee,
    AlertCircle, Check, Copy, Users, Loader2
} from 'lucide-react';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import axiosInstance from '@/api/axiosInstance';
import './WorkShiftSettings.css';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Map day names to indices (0=Monday to 6=Sunday)
const dayToIndex = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
const indexToDay = { 0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun' };

export default function WorkShiftSettings() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [notification, setNotification] = useState(null);
    const [policyId, setPolicyId] = useState(null);

    // General settings (from attendance policy)
    const [settings, setSettings] = useState({
        enableShiftSystem: true,
        allowFlexibleHours: false,
        graceMinutes: 15,
        overtimeAfterMinutes: 480,
        autoAssignShift: true,
        trackBreakTime: true
    });

    // Fetch shifts and policy on mount
    useEffect(() => {
        fetchShifts();
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        try {
            const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICIES);
            const policies = response.data.results || response.data || [];
            const activePolicy = policies.find(p => p.is_active && p.policy_type === 'company');

            if (activePolicy) {
                setPolicyId(activePolicy.id);
                setSettings({
                    enableShiftSystem: activePolicy.enable_shift_system !== undefined ? activePolicy.enable_shift_system : true,
                    allowFlexibleHours: activePolicy.allow_flexible_hours || false,
                    graceMinutes: activePolicy.grace_period_minutes || 15,
                    overtimeAfterMinutes: activePolicy.overtime_after_minutes || 480,
                    autoAssignShift: true,
                    trackBreakTime: activePolicy.track_break_time !== undefined ? activePolicy.track_break_time : true,
                    workingDays: {
                        'Mon': activePolicy.monday,
                        'Tue': activePolicy.tuesday,
                        'Wed': activePolicy.wednesday,
                        'Thu': activePolicy.thursday,
                        'Fri': activePolicy.friday,
                        'Sat': activePolicy.saturday,
                        'Sun': activePolicy.sunday
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching policy:', error);
        }
    };

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.SHIFTS);
            const shiftsData = response.data.results || response.data || [];

            // Transform API data to frontend format
            const transformedShifts = shiftsData.map(shift => ({
                id: shift.id,
                name: shift.name,
                code: shift.code,
                startTime: shift.start_time?.substring(0, 5) || '09:00',
                endTime: shift.end_time?.substring(0, 5) || '17:00',
                breakDuration: shift.break_duration_minutes || 60,
                gracePeriod: shift.grace_period_minutes || 15,
                workingDays: (shift.working_days || []).map(idx => indexToDay[idx]),
                isDefault: shift.is_default || false,
                isActive: shift.is_active !== undefined ? shift.is_active : true,
                color: shift.color_code || '#f59e0b',
                shiftType: shift.shift_type || 'general',
                icon: getIconFromType(shift.shift_type),
                earlyDepartureGrace: shift.early_departure_grace_minutes || 0,
                bufferBefore: shift.buffer_before_minutes || 30,
                bufferAfter: shift.buffer_after_minutes || 30
            }));

            setShifts(transformedShifts);
        } catch (error) {
            console.error('Error fetching shifts:', error);
            showNotification('Failed to load shifts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getIconFromType = (type) => {
        switch (type) {
            case 'morning': return 'sun';
            case 'night': return 'moon';
            case 'evening': return 'coffee';
            default: return 'clock';
        }
    };

    const getTypeFromIcon = (icon) => {
        switch (icon) {
            case 'sun': return 'morning';
            case 'moon': return 'night';
            case 'coffee': return 'evening';
            default: return 'general';
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddShift = () => {
        setEditingShift(null);
        setShowModal(true);
    };

    const handleEditShift = (shift) => {
        setEditingShift(shift);
        setShowModal(true);
    };

    const handleDeleteShift = async (id) => {
        if (!confirm('Are you sure you want to delete this shift?')) return;

        try {
            await axiosInstance.delete(CLIENTADMIN_ENDPOINTS.SHIFT_DETAIL(id));
            setShifts(shifts.filter(s => s.id !== id));
            showNotification('Shift deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting shift:', error);
            showNotification('Failed to delete shift', 'error');
        }
    };

    const handleSaveShift = async (shiftData) => {
        setSaving(true);

        // Transform frontend data to API format
        const apiData = {
            name: shiftData.name,
            code: shiftData.code,
            start_time: shiftData.startTime + ':00',
            end_time: shiftData.endTime + ':00',
            break_duration_minutes: shiftData.breakDuration,
            grace_period_minutes: shiftData.gracePeriod || 15,
            working_days: shiftData.working_days || shiftData.workingDays.map(day => dayToIndex[day]),
            is_active: true,
            color_code: shiftData.color,
            shift_type: getTypeFromIcon(shiftData.icon),
            early_departure_grace_minutes: shiftData.earlyDepartureGrace,
            buffer_before_minutes: shiftData.bufferBefore,
            buffer_after_minutes: shiftData.bufferAfter,
            is_default: shiftData.isDefault
        };

        try {
            if (editingShift) {
                // Update existing shift
                const response = await axiosInstance.put(
                    CLIENTADMIN_ENDPOINTS.SHIFT_DETAIL(editingShift.id),
                    apiData
                );
                setShifts(shifts.map(s => s.id === editingShift.id ? {
                    ...s,
                    ...shiftData,
                    id: editingShift.id
                } : s));

                // Auto-calculate overtime if Default OR if it's the only shift
                if (shiftData.isDefault || (shifts.length === 1 && shifts[0].id === editingShift.id)) {
                    const startMin = parseInt(shiftData.startTime.split(':')[0]) * 60 + parseInt(shiftData.startTime.split(':')[1]);
                    const endMin = parseInt(shiftData.endTime.split(':')[0]) * 60 + parseInt(shiftData.endTime.split(':')[1]);
                    let duration = endMin - startMin;
                    if (duration < 0) duration += 24 * 60;
                    const workDuration = duration - (shiftData.breakDuration || 0);

                    if (workDuration > 0) {
                        setSettings(prev => ({ ...prev, overtimeAfterMinutes: workDuration }));
                    }
                }

                showNotification('Shift updated successfully', 'success');
            } else {
                // Create new shift
                const response = await axiosInstance.post(CLIENTADMIN_ENDPOINTS.SHIFTS, apiData);
                const newShift = {
                    ...shiftData,
                    id: response.data.id,
                    isActive: true
                };
                setShifts([...shifts, newShift]);

                // Auto-calculate overtime if Default OR if it's the first shift
                if (shiftData.isDefault || shifts.length === 0) {
                    const startMin = parseInt(shiftData.startTime.split(':')[0]) * 60 + parseInt(shiftData.startTime.split(':')[1]);
                    const endMin = parseInt(shiftData.endTime.split(':')[0]) * 60 + parseInt(shiftData.endTime.split(':')[1]);
                    let duration = endMin - startMin;
                    if (duration < 0) duration += 24 * 60;
                    const workDuration = duration - (shiftData.breakDuration || 0);

                    if (workDuration > 0) {
                        setSettings(prev => ({ ...prev, overtimeAfterMinutes: workDuration }));
                    }
                }

                showNotification('Shift created successfully', 'success');
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error saving shift:', error);
            const errorMsg = error.response?.data?.detail ||
                error.response?.data?.code?.[0] ||
                'Failed to save shift';
            showNotification(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const apiData = {
                enable_shift_system: settings.enableShiftSystem,
                track_break_time: settings.trackBreakTime,
                allow_flexible_hours: settings.allowFlexibleHours,
                grace_period_minutes: settings.graceMinutes,
                overtime_after_minutes: settings.overtimeAfterMinutes,
                name: 'Standard Policy',
                policy_type: 'company',
                is_active: true,
                effective_from: new Date().toISOString().split('T')[0],
            };

            if (!policyId) {
                // Create new policy if it doesn't exist
                const response = await axiosInstance.post(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICIES, apiData);
                setPolicyId(response.data.id);
            } else {
                // Update existing policy
                await axiosInstance.patch(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICY_DETAIL(policyId), apiData);
            }
            showNotification('Configuration saved successfully', 'success');
        } catch (error) {
            console.error('Error saving policy:', error);
            const errorMsg = error.response?.data?.detail ||
                (error.response?.data && typeof error.response.data === 'object' ? Object.values(error.response.data)[0] : null) ||
                'Failed to save configuration';
            showNotification(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const calculateTotalHours = (start, end) => {
        if (!start || !end) return '0h 0m';
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        let hours = endHour - startHour;
        let mins = endMin - startMin;
        if (hours < 0) hours += 24;
        if (mins < 0) { hours -= 1; mins += 60; }
        return `${hours}h ${mins}m`;
    };

    const getShiftIcon = (iconName) => {
        switch (iconName) {
            case 'sun': return <Sun size={16} />;
            case 'moon': return <Moon size={16} />;
            case 'coffee': return <Coffee size={16} />;
            default: return <Clock size={16} />;
        }
    };

    if (loading) {
        return (
            <div className="workshift-settings">
                <div className="loading-state">
                    <Loader2 size={32} className="spin" />
                    <p>Loading shifts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="workshift-settings">
            {/* Notification */}
            {notification && (
                <div className={`shift-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="workshift-header">
                <div>
                    <h2>Work Shift Settings</h2>
                    <p>Configure work hours and shift schedules for your organization</p>
                </div>
                {settings.enableShiftSystem && (
                    <button className="shift-btn-primary" onClick={handleAddShift}>
                        <Plus size={18} />
                        Add New Shift
                    </button>
                )}
            </div>

            {/* Shift System Status Alert */}
            {!settings.enableShiftSystem && (
                <div className="shift-card" style={{ borderLeft: '4px solid var(--brand-primary)', background: 'var(--brand-primary-light)' }}>
                    <div className="shift-card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Info size={24} color="var(--brand-primary)" />
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--brand-primary)' }}>Multi-Shift System is Disabled</h4>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                The organization-wide policy currently allows only one default work shift.
                                To enable multiple shifts, visit <strong style={{ color: 'var(--brand-primary)' }}>Work Schedules</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* General Configuration */}
            <div className="shift-card">
                <div className="shift-card-header">
                    <Clock size={18} />
                    <h3>Work Time Configuration</h3>
                </div>
                <div className="shift-config-grid">
                    <div className="shift-toggle-row">
                        <div className="shift-toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Enable Shift System</span>
                                <span className="toggle-desc">Allow multiple work shifts</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.enableShiftSystem}
                                    onChange={(e) => handleSettingChange('enableShiftSystem', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="shift-toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Allow Flexible Hours</span>
                                <span className="toggle-desc">Employees can adjust timing</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.allowFlexibleHours}
                                    onChange={(e) => handleSettingChange('allowFlexibleHours', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="shift-toggle-item">
                            <div className="toggle-info">
                                <span className="toggle-label">Track Break Time</span>
                                <span className="toggle-desc">Record break duration</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.trackBreakTime}
                                    onChange={(e) => handleSettingChange('trackBreakTime', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div className="shift-input-grid">
                        <div className="shift-field">
                            <label>Grace Period (minutes)</label>
                            <input
                                type="number"
                                value={settings.graceMinutes}
                                onChange={(e) => handleSettingChange('graceMinutes', parseInt(e.target.value))}
                                className="shift-input"
                                min="0"
                                max="60"
                            />
                        </div>
                        <div className="shift-field">
                            <label>Overtime After (minutes)</label>
                            <input
                                type="number"
                                value={settings.overtimeAfterMinutes}
                                onChange={(e) => handleSettingChange('overtimeAfterMinutes', parseInt(e.target.value))}
                                className="shift-input"
                                min="0"
                            />
                        </div>
                    </div>
                </div>
                <div className="shift-card-footer">
                    <button className="shift-btn-primary" onClick={handleSaveSettings} disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Shifts List */}
            <div className="shift-card">
                <div className="shift-card-header">
                    <Users size={18} />
                    <h3>Work Shifts</h3>
                    <span className="shift-count">{shifts.length} shifts</span>
                </div>
                <div className="shifts-list">
                    {shifts.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <h4>No Shifts Configured</h4>
                            <p>Create your first work shift to get started</p>
                            <button className="shift-btn-primary" onClick={handleAddShift}>
                                <Plus size={16} />
                                Add Shift
                            </button>
                        </div>
                    ) : (
                        shifts.map((shift) => (
                            <div key={shift.id} className={`shift-item ${shift.isDefault ? 'default' : ''}`}>
                                <div className="shift-item-left">
                                    <div
                                        className="shift-icon"
                                        style={{ backgroundColor: shift.color + '20', color: shift.color }}
                                    >
                                        {getShiftIcon(shift.icon)}
                                    </div>
                                    <div className="shift-info">
                                        <div className="shift-name-row">
                                            <h4>{shift.name}</h4>
                                            <span className="shift-code">{shift.code}</span>
                                            {shift.isDefault && <span className="default-badge">Default</span>}
                                        </div>
                                        <div className="shift-time">
                                            <Clock size={12} />
                                            <span>{shift.startTime} - {shift.endTime}</span>
                                            <span className="shift-duration">
                                                ({calculateTotalHours(shift.startTime, shift.endTime)})
                                            </span>
                                        </div>
                                        <div className="shift-days">
                                            {daysOfWeek.map(day => (
                                                <span
                                                    key={day}
                                                    className={`day-chip ${shift.workingDays?.includes(day) ? 'active' : ''}`}
                                                >
                                                    {day.charAt(0)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="shift-item-right">
                                    <div className="shift-meta">
                                        <span className="meta-item">
                                            <Coffee size={12} />
                                            {shift.breakDuration}min break
                                        </span>
                                    </div>
                                    <div className="shift-actions">
                                        <button
                                            className="shift-action-btn"
                                            onClick={() => handleEditShift(shift)}
                                            title="Edit Shift"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        {settings.enableShiftSystem && !shift.isDefault && (
                                            <button
                                                className="shift-action-btn delete"
                                                onClick={() => handleDeleteShift(shift.id)}
                                                title="Delete Shift"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <ShiftModal
                        shift={editingShift}
                        policy={settings} // Pass policy settings
                        onSave={handleSaveShift}
                        onClose={() => setShowModal(false)}
                        saving={saving}
                    />
                )
            }
        </div >
    );
}

// Shift Modal Component
function ShiftModal({ shift, policy, onSave, onClose, saving }) {
    const [formData, setFormData] = useState({
        name: shift?.name || '',
        code: shift?.code || '',
        startTime: shift?.startTime || '09:00',
        endTime: shift?.endTime || '17:00',
        breakDuration: shift?.breakDuration || 60,
        gracePeriod: shift?.gracePeriod || 15,
        workingDays: shift?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        isDefault: shift?.isDefault || false,
        color: shift?.color || '#f59e0b',
        icon: shift?.icon || 'sun',
        earlyDepartureGrace: shift?.earlyDepartureGrace || 0,
        bufferBefore: shift?.bufferBefore || 30,
        bufferAfter: shift?.bufferAfter || 30
    });

    const toggleDay = (day) => {
        if (formData.workingDays.includes(day)) {
            setFormData({ ...formData, workingDays: formData.workingDays.filter(d => d !== day) });
        } else {
            setFormData({ ...formData, workingDays: [...formData.workingDays, day] });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const iconOptions = [
        { value: 'sun', label: 'Morning', icon: <Sun size={16} /> },
        { value: 'moon', label: 'Night', icon: <Moon size={16} /> },
        { value: 'coffee', label: 'Flexible', icon: <Coffee size={16} /> },
        { value: 'clock', label: 'Standard', icon: <Clock size={16} /> }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="shift-modal" onClick={(e) => e.stopPropagation()}>
                <div className="shift-modal-header">
                    <h3>{shift ? 'Edit Work Shift' : 'Create New Shift'}</h3>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="shift-modal-body">
                        <div className="shift-field-row">
                            <div className="shift-field">
                                <label>Shift Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="shift-input"
                                    required
                                    placeholder="e.g., Morning Shift"
                                />
                            </div>
                            <div className="shift-field small">
                                <label>Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="shift-input"
                                    required
                                    placeholder="MS"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="shift-field-row">
                            <div className="shift-field">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="shift-input"
                                    required
                                />
                            </div>
                            <div className="shift-field">
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="shift-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="shift-field-row">
                            <div className="shift-field">
                                <label>Late Coming Grace (min)</label>
                                <input
                                    type="number"
                                    value={formData.gracePeriod}
                                    onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                                    className="shift-input"
                                    min="0"
                                    max="60"
                                    placeholder={`Company: ${policy.graceMinutes}m`}
                                />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Default: {policy.graceMinutes}m (leave empty to use company default)
                                </span>
                            </div>
                            <div className="shift-field">
                                <label>Early Going Grace (min)</label>
                                <input
                                    type="number"
                                    value={formData.earlyDepartureGrace}
                                    onChange={(e) => setFormData({ ...formData, earlyDepartureGrace: parseInt(e.target.value) })}
                                    className="shift-input"
                                    min="0"
                                    max="60"
                                />
                            </div>
                        </div>

                        <div className="shift-field-row">
                            <div className="shift-field">
                                <label>Early Come Buffer (min)</label>
                                <input
                                    type="number"
                                    value={formData.bufferBefore}
                                    onChange={(e) => setFormData({ ...formData, bufferBefore: parseInt(e.target.value) })}
                                    className="shift-input"
                                    min="0"
                                    max="120"
                                    title="How many minutes before shift start employees can check in"
                                />
                            </div>
                            <div className="shift-field">
                                <label>Late Going Buffer (min)</label>
                                <input
                                    type="number"
                                    value={formData.bufferAfter}
                                    onChange={(e) => setFormData({ ...formData, bufferAfter: parseInt(e.target.value) })}
                                    className="shift-input"
                                    min="0"
                                    max="120"
                                    title="How many minutes after shift end employees can check out"
                                />
                            </div>
                            <div className="shift-field small">
                                <label>Break (min)</label>
                                <input
                                    type="number"
                                    value={formData.breakDuration}
                                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
                                    className="shift-input"
                                    min="0"
                                    max="120"
                                />
                            </div>
                        </div>

                        <div className="shift-field">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                />
                                <span>Set as default shift for the company</span>
                            </label>
                        </div>

                        <div className="shift-field">
                            <label>Working Days</label>
                            <div className="days-selector">
                                {daysOfWeek.map(day => {
                                    const isPolicyOff = policy.workingDays && policy.workingDays[day] === false;
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            className={`day-btn ${formData.workingDays.includes(day) ? 'active' : ''} ${isPolicyOff ? 'policy-off' : ''}`}
                                            onClick={() => !isPolicyOff && toggleDay(day)}
                                            title={isPolicyOff ? `${day} is marked as OFF in company schedule` : ''}
                                            disabled={isPolicyOff}
                                            style={isPolicyOff ? { opacity: 0.5, cursor: 'not-allowed', textDecoration: 'line-through' } : {}}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            {Object.values(policy.workingDays || {}).includes(false) && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                    Note: You cannot enable days that are disabled in the global <strong>Work Schedule</strong>.
                                </span>
                            )}
                        </div>

                        <div className="shift-field-row">
                            <div className="shift-field">
                                <label>Icon</label>
                                <div className="icon-selector">
                                    {iconOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`icon-btn ${formData.icon === opt.value ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, icon: opt.value })}
                                            title={opt.label}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="shift-field">
                                <label>Color</label>
                                <div className="color-picker-row">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="color-picker"
                                    />
                                    <span className="color-value">{formData.color}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="shift-modal-footer">
                        <button type="button" onClick={onClose} className="shift-btn-secondary" disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="shift-btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            {shift ? 'Update Shift' : 'Create Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
