'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Clock, AlertTriangle, CheckCircle, Settings, Save,
    Calendar, UserCheck, FileText, Bell, Shield, Timer,
    Globe, Lock, Power
} from 'lucide-react';
import OverTimeSettings from '../OverTimeRule/OverTimeSettings';
import { getAttendancePolicies, updateAttendancePolicy, createAttendancePolicy } from '@/api/api_clientadmin';
import './AttendanceSettings.css';

export default function AttendanceSettings() {
    // Late Coming Settings
    const [lateSettings, setLateSettings] = useState({
        enableLateTracking: true,
        graceMinutes: 15,
        lateThresholds: [
            { id: 1, minMinutes: 1, maxMinutes: 15, penalty: 'none', deduction: 0 },
            { id: 2, minMinutes: 16, maxMinutes: 30, penalty: 'warning', deduction: 0 },
            { id: 3, minMinutes: 31, maxMinutes: 60, penalty: 'half_day', deduction: 0.5 },
            { id: 4, minMinutes: 61, maxMinutes: 999, penalty: 'full_day', deduction: 1 }
        ],
        countLateAsLeave: true,
        maxLatePerMonth: 3,
        notifyManager: true,
        notifyEmployee: true
    });

    // Early Going Settings
    const [earlySettings, setEarlySettings] = useState({
        enableEarlyTracking: true,
        graceMinutes: 10,
        earlyThresholds: [
            { id: 1, minMinutes: 1, maxMinutes: 15, penalty: 'none', deduction: 0 },
            { id: 2, minMinutes: 16, maxMinutes: 30, penalty: 'warning', deduction: 0 },
            { id: 3, minMinutes: 31, maxMinutes: 60, penalty: 'half_day', deduction: 0.5 },
            { id: 4, minMinutes: 61, maxMinutes: 999, penalty: 'full_day', deduction: 1 }
        ],
        requireApproval: true,
        notifyManager: true
    });

    // Attendance Request Settings
    const [requestSettings, setRequestSettings] = useState({
        enableAttendanceRequests: true,
        allowCheckInCorrection: true,
        allowCheckOutCorrection: true,
        allowMissedAttendance: true,
        maxRequestsPerMonth: 5,
        requestDeadlineDays: 7,
        requireProof: false,
        autoApproveAfterDays: 0,
        approvalLevels: 1,
        notifyOnRequest: true,
        notifyOnApproval: true
    });

    // Advanced Settings
    const [advancedSettings, setAdvancedSettings] = useState({
        ipRestrictionEnabled: false,
        allowedIps: '',
        autoClockoutEnabled: false,
        autoClockoutTime: '22:00',
        maxRegularizationAttempts: 5,
        enableGeoFencing: false,
        officeLatitude: '',
        officeLongitude: '',
        geoFenceRadiusMeters: 100
    });

    const [notification, setNotification] = useState(null);
    const [activeSection, setActiveSection] = useState('late');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [policyId, setPolicyId] = useState(null);

    const fetchPolicy = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAttendancePolicies({ is_active: 'true' });
            if (response.data && response.data.length > 0) {
                const policy = response.data[0];
                setPolicyId(policy.id);
                
                // Map Backend to Frontend State
                setLateSettings(prev => ({
                    ...prev,
                    graceMinutes: policy.grace_period_minutes || 0,
                    lateThresholds: policy.late_thresholds || prev.lateThresholds
                }));

                setEarlySettings(prev => ({
                    ...prev,
                    earlyThresholds: policy.early_thresholds || prev.earlyThresholds
                }));

                setAdvancedSettings({
                    ipRestrictionEnabled: policy.ip_restriction_enabled || false,
                    allowedIps: policy.allowed_ips || '',
                    autoClockoutEnabled: policy.auto_clockout_enabled || false,
                    autoClockoutTime: policy.auto_clockout_time || '22:00',
                    maxRegularizationAttempts: policy.max_regularization_attempts_per_month || 5,
                    enableGeoFencing: policy.enable_geo_fencing || false,
                    officeLatitude: policy.office_latitude || '',
                    officeLongitude: policy.office_longitude || '',
                    geoFenceRadiusMeters: policy.geo_fence_radius_meters || 100
                });

                setRequestSettings({
                    enableAttendanceRequests: policy.enable_attendance_requests ?? true,
                    allowCheckInCorrection: policy.allow_checkin_correction ?? true,
                    allowCheckOutCorrection: policy.allow_checkout_correction ?? true,
                    allowMissedAttendance: policy.allow_missed_attendance ?? true,
                    requireProof: policy.require_proof ?? false,
                    maxRequestsPerMonth: policy.max_requests_per_month ?? 5,
                    requestDeadlineDays: policy.request_deadline_days ?? 7,
                    autoApproveAfterDays: policy.auto_approve_after_days ?? 0,
                    notifyManager: true, // Default local only for now if not in model
                    notifyEmployee: true
                });
            }
        } catch (error) {
            console.error('Failed to fetch attendance policy:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            showNotification('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicy();
    }, [fetchPolicy]);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = async (section) => {
        try {
            setSaving(true);
            const data = {
                name: 'Default Attendance Policy',
                policy_type: 'company',
                working_days: '5_days',
                work_start_time: '09:00:00',
                work_end_time: '18:00:00',
                effective_from: new Date().toISOString().split('T')[0],
                grace_period_minutes: lateSettings.graceMinutes,
                late_thresholds: lateSettings.lateThresholds,
                early_thresholds: earlySettings.earlyThresholds,
                ip_restriction_enabled: advancedSettings.ipRestrictionEnabled,
                allowed_ips: advancedSettings.allowedIps,
                auto_clockout_enabled: advancedSettings.autoClockoutEnabled,
                auto_clockout_time: advancedSettings.autoClockoutTime,
                max_regularization_attempts_per_month: advancedSettings.maxRegularizationAttempts,
                
                // Geofencing
                enable_geo_fencing: advancedSettings.enableGeoFencing,
                office_latitude: advancedSettings.officeLatitude,
                office_longitude: advancedSettings.officeLongitude,
                geo_fence_radius_meters: advancedSettings.geoFenceRadiusMeters,
                
                // Add Request Settings
                enable_attendance_requests: requestSettings.enableAttendanceRequests,
                allow_checkin_correction: requestSettings.allowCheckInCorrection,
                allow_checkout_correction: requestSettings.allowCheckOutCorrection,
                allow_missed_attendance: requestSettings.allowMissedAttendance,
                require_proof: requestSettings.requireProof,
                max_requests_per_month: requestSettings.maxRequestsPerMonth,
                request_deadline_days: requestSettings.requestDeadlineDays,
                auto_approve_after_days: requestSettings.autoApproveAfterDays
            };

            if (policyId) {
                await updateAttendancePolicy(policyId, data);
                showNotification(`${section} settings updated successfully`, 'success');
            } else {
                const response = await createAttendancePolicy(data);
                if (response.data && response.data.id) {
                    setPolicyId(response.data.id);
                    showNotification(`${section} settings initialized successfully`, 'success');
                }
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            let errorMessage = 'Failed to save changes';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    const firstVal = data[firstKey];
                    errorMessage = Array.isArray(firstVal) ? firstVal[0] : (data.error || String(firstVal));
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }
            showNotification(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const penaltyOptions = [
        { value: 'none', label: 'No Penalty' },
        { value: 'warning', label: 'Warning Only' },
        { value: 'half_day', label: 'Half Day Deduction' },
        { value: 'full_day', label: 'Full Day Deduction' }
    ];

    return (
        <div className="attendance-settings">
            {/* Notification */}
            {notification && (
                <div className={`att-notification ${notification.type}`}>
                    <CheckCircle size={16} />
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="att-header">
                <div>
                    <h2>Attendance Settings</h2>
                    <p>Configure attendance policies, penalties, and request workflows</p>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="att-tabs">
                <button
                    className={`att-tab ${activeSection === 'late' ? 'active' : ''}`}
                    onClick={() => setActiveSection('late')}
                >
                    <Clock size={16} />
                    Late Coming
                </button>
                <button
                    className={`att-tab ${activeSection === 'early' ? 'active' : ''}`}
                    onClick={() => setActiveSection('early')}
                >
                    <Timer size={16} />
                    Early Going
                </button>
                <button
                    className={`att-tab ${activeSection === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveSection('requests')}
                >
                    <FileText size={16} />
                    Change Requests
                </button>
                <button
                    className={`att-tab ${activeSection === 'overtime' ? 'active' : ''}`}
                    onClick={() => setActiveSection('overtime')}
                >
                    <Calendar size={16} />
                    Overtime
                </button>
                <button
                    className={`att-tab ${activeSection === 'advanced' ? 'active' : ''}`}
                    onClick={() => setActiveSection('advanced')}
                >
                    <Shield size={16} />
                    Advanced Rules
                </button>
            </div>

            {/* Late Coming Section */}
            {activeSection === 'late' && (
                <div className="att-card">
                    <div className="att-card-header">
                        <Clock size={18} />
                        <h3>Late Coming Configuration</h3>
                    </div>
                    <div className="att-card-body">
                        {/* Enable/Disable */}
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <span className="toggle-label">Enable Late Tracking</span>
                                    <span className="toggle-desc">Track and apply penalties for late arrivals</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={lateSettings.enableLateTracking}
                                        onChange={(e) => setLateSettings({ ...lateSettings, enableLateTracking: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {lateSettings.enableLateTracking && (
                            <>
                                {/* Grace Period & Max Late */}
                                <div className="att-field-row">
                                    <div className="att-field">
                                        <label>Grace Period (minutes)</label>
                                        <input
                                            type="number"
                                            value={lateSettings.graceMinutes}
                                            onChange={(e) => setLateSettings({ ...lateSettings, graceMinutes: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                            max="60"
                                        />
                                        <span className="field-hint">No penalty within this period</span>
                                    </div>
                                    <div className="att-field">
                                        <label>Max Late Per Month</label>
                                        <input
                                            type="number"
                                            value={lateSettings.maxLatePerMonth}
                                            onChange={(e) => setLateSettings({ ...lateSettings, maxLatePerMonth: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                        <span className="field-hint">Before escalation</span>
                                    </div>
                                </div>

                                {/* Thresholds Table */}
                                <div className="threshold-section">
                                    <h4>Late Penalty Thresholds</h4>
                                    <div className="threshold-table">
                                        <div className="threshold-header">
                                            <span>Minutes Late</span>
                                            <span>Penalty Type</span>
                                            <span>Day Deduction</span>
                                        </div>
                                        {lateSettings.lateThresholds.map((threshold, idx) => (
                                            <div key={threshold.id} className="threshold-row">
                                                <span className="threshold-range">
                                                    {threshold.minMinutes} - {threshold.maxMinutes === 999 ? '∞' : threshold.maxMinutes} min
                                                </span>
                                                <select
                                                    value={threshold.penalty}
                                                    onChange={(e) => {
                                                        const updated = [...lateSettings.lateThresholds];
                                                        updated[idx].penalty = e.target.value;
                                                        setLateSettings({ ...lateSettings, lateThresholds: updated });
                                                    }}
                                                    className="att-select"
                                                >
                                                    {penaltyOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={threshold.deduction}
                                                    onChange={(e) => {
                                                        const updated = [...lateSettings.lateThresholds];
                                                        updated[idx].deduction = parseFloat(e.target.value);
                                                        setLateSettings({ ...lateSettings, lateThresholds: updated });
                                                    }}
                                                    className="att-input small"
                                                    step="0.5"
                                                    min="0"
                                                    max="1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notification Settings */}
                                <div className="att-toggle-row">
                                    <div className="att-toggle-item">
                                        <span>Notify Manager</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={lateSettings.notifyManager}
                                                onChange={(e) => setLateSettings({ ...lateSettings, notifyManager: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Notify Employee</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={lateSettings.notifyEmployee}
                                                onChange={(e) => setLateSettings({ ...lateSettings, notifyEmployee: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Count as Leave</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={lateSettings.countLateAsLeave}
                                                onChange={(e) => setLateSettings({ ...lateSettings, countLateAsLeave: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="att-card-footer">
                        <button 
                            className="att-btn-primary" 
                            onClick={() => handleSave('Late coming')}
                            disabled={loading || saving}
                        >
                            {saving ? 'Saving...' : <><Save size={16} /> {policyId ? 'Save Changes' : 'Initialize Settings'}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Early Going Section */}
            {activeSection === 'early' && (
                <div className="att-card">
                    <div className="att-card-header">
                        <Timer size={18} />
                        <h3>Early Going Configuration</h3>
                    </div>
                    <div className="att-card-body">
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <span className="toggle-label">Enable Early Going Tracking</span>
                                    <span className="toggle-desc">Track and apply penalties for early departures</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={earlySettings.enableEarlyTracking}
                                        onChange={(e) => setEarlySettings({ ...earlySettings, enableEarlyTracking: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {earlySettings.enableEarlyTracking && (
                            <>
                                <div className="att-field-row">
                                    <div className="att-field">
                                        <label>Grace Period (minutes)</label>
                                        <input
                                            type="number"
                                            value={earlySettings.graceMinutes}
                                            onChange={(e) => setEarlySettings({ ...earlySettings, graceMinutes: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                            max="60"
                                        />
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Require Approval</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={earlySettings.requireApproval}
                                                onChange={(e) => setEarlySettings({ ...earlySettings, requireApproval: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="threshold-section">
                                    <h4>Early Going Penalty Thresholds</h4>
                                    <div className="threshold-table">
                                        <div className="threshold-header">
                                            <span>Minutes Early</span>
                                            <span>Penalty Type</span>
                                            <span>Day Deduction</span>
                                        </div>
                                        {earlySettings.earlyThresholds.map((threshold, idx) => (
                                            <div key={threshold.id} className="threshold-row">
                                                <span className="threshold-range">
                                                    {threshold.minMinutes} - {threshold.maxMinutes === 999 ? '∞' : threshold.maxMinutes} min
                                                </span>
                                                <select
                                                    value={threshold.penalty}
                                                    onChange={(e) => {
                                                        const updated = [...earlySettings.earlyThresholds];
                                                        updated[idx].penalty = e.target.value;
                                                        setEarlySettings({ ...earlySettings, earlyThresholds: updated });
                                                    }}
                                                    className="att-select"
                                                >
                                                    {penaltyOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={threshold.deduction}
                                                    onChange={(e) => {
                                                        const updated = [...earlySettings.earlyThresholds];
                                                        updated[idx].deduction = parseFloat(e.target.value);
                                                        setEarlySettings({ ...earlySettings, earlyThresholds: updated });
                                                    }}
                                                    className="att-input small"
                                                    step="0.5"
                                                    min="0"
                                                    max="1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="att-card-footer">
                        <button 
                            className="att-btn-primary" 
                            onClick={() => handleSave('Early going')}
                            disabled={loading || saving}
                        >
                            {saving ? 'Saving...' : <><Save size={16} /> {policyId ? 'Save Changes' : 'Initialize Settings'}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Attendance Requests Section */}
            {activeSection === 'requests' && (
                <div className="att-card">
                    <div className="att-card-header">
                        <FileText size={18} />
                        <h3>Attendance Change Request Settings</h3>
                    </div>
                    <div className="att-card-body">
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <span className="toggle-label">Enable Attendance Requests</span>
                                    <span className="toggle-desc">Allow employees to request attendance corrections</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={requestSettings.enableAttendanceRequests}
                                        onChange={(e) => setRequestSettings({ ...requestSettings, enableAttendanceRequests: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {requestSettings.enableAttendanceRequests && (
                            <>
                                {/* Request Types */}
                                <div className="request-types-grid">
                                    <div className="att-toggle-item">
                                        <span>Check-In Correction</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.allowCheckInCorrection}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, allowCheckInCorrection: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Check-Out Correction</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.allowCheckOutCorrection}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, allowCheckOutCorrection: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Missed Attendance</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.allowMissedAttendance}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, allowMissedAttendance: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Require Proof/Attachment</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.requireProof}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, requireProof: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="att-field-row">
                                    <div className="att-field">
                                        <label>Max Requests Per Month</label>
                                        <input
                                            type="number"
                                            value={requestSettings.maxRequestsPerMonth}
                                            onChange={(e) => setRequestSettings({ ...requestSettings, maxRequestsPerMonth: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                    </div>
                                    <div className="att-field">
                                        <label>Request Deadline (days)</label>
                                        <input
                                            type="number"
                                            value={requestSettings.requestDeadlineDays}
                                            onChange={(e) => setRequestSettings({ ...requestSettings, requestDeadlineDays: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="1"
                                        />
                                        <span className="field-hint">Days after attendance date</span>
                                    </div>
                                    <div className="att-field">
                                        <label>Auto-Approve After (days)</label>
                                        <input
                                            type="number"
                                            value={requestSettings.autoApproveAfterDays}
                                            onChange={(e) => setRequestSettings({ ...requestSettings, autoApproveAfterDays: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                        <span className="field-hint">0 = disabled</span>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="att-toggle-row">
                                    <div className="att-toggle-item">
                                        <span>Notify on Request</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.notifyOnRequest}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, notifyOnRequest: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="att-toggle-item">
                                        <span>Notify on Approval</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={requestSettings.notifyOnApproval}
                                                onChange={(e) => setRequestSettings({ ...requestSettings, notifyOnApproval: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="att-card-footer">
                        <button 
                            className="att-btn-primary" 
                            onClick={() => handleSave('Attendance request')}
                            disabled={loading || saving}
                        >
                            {saving ? 'Saving...' : <><Save size={16} /> {policyId ? 'Save Changes' : 'Initialize Settings'}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Overtime Section */}
            {activeSection === 'overtime' && (
                <div className="animate-fade-in">
                    <OverTimeSettings standalone={false} />
                </div>
            )}

            {/* Advanced Rules Section */}
            {activeSection === 'advanced' && (
                <div className="att-card">
                    <div className="att-card-header">
                        <Shield size={18} />
                        <h3>Advanced Attendance Security</h3>
                    </div>
                    <div className="att-card-body">
                        {/* IP Restriction */}
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <div className="flex items-center gap-2">
                                        <Lock size={16} className="text-blue-500" />
                                        <span className="toggle-label">IP Restriction (Network Whitelist)</span>
                                    </div>
                                    <span className="toggle-desc">Limit check-ins to approved office IP addresses only</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={advancedSettings.ipRestrictionEnabled}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, ipRestrictionEnabled: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {advancedSettings.ipRestrictionEnabled && (
                            <div className="att-field full-width animate-fade-in">
                                <label>Allowed IP Addresses</label>
                                <textarea
                                    value={advancedSettings.allowedIps}
                                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, allowedIps: e.target.value })}
                                    placeholder="e.g. 192.168.1.1, 103.24.56.2"
                                    className="att-input att-textarea"
                                    rows="3"
                                />
                                <span className="field-hint">Comma-separated list of static WAN IPs. Leave empty to allow all (though enabled).</span>
                            </div>
                        )}

                        <div className="att-divider" />

                        {/* Auto-Clockout */}
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <div className="flex items-center gap-2">
                                        <Power size={16} className="text-red-500" />
                                        <span className="toggle-label">Automated Clock-Out</span>
                                    </div>
                                    <span className="toggle-desc">Automatically end shifts for employees who forget to clock out</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={advancedSettings.autoClockoutEnabled}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, autoClockoutEnabled: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {advancedSettings.autoClockoutEnabled && (
                            <div className="att-field-row animate-fade-in">
                                <div className="att-field">
                                    <label>Daily Cut-off Time</label>
                                    <input
                                        type="time"
                                        value={advancedSettings.autoClockoutTime}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, autoClockoutTime: e.target.value })}
                                        className="att-input"
                                    />
                                    <span className="field-hint">Usually end of the day (e.g. 22:00)</span>
                                </div>
                            </div>
                        )}

                        <div className="att-divider" />

                        {/* Limits */}
                        <div className="att-field-row">
                            <div className="att-field">
                                <label>Max Regularization Attempts</label>
                                <input
                                    type="number"
                                    value={advancedSettings.maxRegularizationAttempts}
                                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, maxRegularizationAttempts: parseInt(e.target.value) })}
                                    className="att-input"
                                    min="0"
                                />
                                <span className="field-hint">Max requests allowed per employee per month</span>
                            </div>
                        </div>

                        <div className="att-divider" />

                        {/* GPS Geofencing */}
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} className="text-green-500" />
                                        <span className="toggle-label">GPS Geofencing Enforcement</span>
                                    </div>
                                    <span className="toggle-desc">Require employees to be within a specific radius of the office to clock in</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={advancedSettings.enableGeoFencing}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, enableGeoFencing: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {advancedSettings.enableGeoFencing && (
                            <div className="att-field-row animate-fade-in">
                                <div className="att-field">
                                    <label>Office Latitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={advancedSettings.officeLatitude}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, officeLatitude: e.target.value })}
                                        placeholder="e.g. 23.8103"
                                        className="att-input"
                                    />
                                </div>
                                <div className="att-field">
                                    <label>Office Longitude</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={advancedSettings.officeLongitude}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, officeLongitude: e.target.value })}
                                        placeholder="e.g. 90.4125"
                                        className="att-input"
                                    />
                                </div>
                                <div className="att-field">
                                    <label>Allowed Radius (Meters)</label>
                                    <input
                                        type="number"
                                        value={advancedSettings.geoFenceRadiusMeters}
                                        onChange={(e) => setAdvancedSettings({ ...advancedSettings, geoFenceRadiusMeters: parseInt(e.target.value) })}
                                        className="att-input"
                                        min="10"
                                    />
                                    <span className="field-hint">Radius from office center</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="att-card-footer">
                        <button 
                            className="att-btn-primary" 
                            onClick={() => handleSave('Advanced rules')}
                            disabled={loading || saving}
                        >
                            {saving ? 'Saving...' : <><Save size={16} /> {policyId ? 'Save Changes' : 'Initialize Settings'}</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
