'use client';

import { useState } from 'react';
import {
    Clock, AlertTriangle, CheckCircle, Settings, Save,
    Calendar, UserCheck, FileText, Bell, Shield, Timer
} from 'lucide-react';
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

    // Overtime Settings
    const [overtimeSettings, setOvertimeSettings] = useState({
        enableOvertime: true,
        minOvertimeMinutes: 30,
        requirePreApproval: false,
        maxOvertimePerDay: 4,
        maxOvertimePerWeek: 20,
        overtimeMultiplier: 1.5,
        weekendMultiplier: 2.0,
        holidayMultiplier: 2.5
    });

    const [notification, setNotification] = useState(null);
    const [activeSection, setActiveSection] = useState('late');

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = (section) => {
        showNotification(`${section} settings saved successfully`, 'success');
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
                        <button className="att-btn-primary" onClick={() => handleSave('Late coming')}>
                            <Save size={16} />
                            Save Changes
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
                        <button className="att-btn-primary" onClick={() => handleSave('Early going')}>
                            <Save size={16} />
                            Save Changes
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
                        <button className="att-btn-primary" onClick={() => handleSave('Attendance request')}>
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Overtime Section */}
            {activeSection === 'overtime' && (
                <div className="att-card">
                    <div className="att-card-header">
                        <Calendar size={18} />
                        <h3>Overtime Configuration</h3>
                    </div>
                    <div className="att-card-body">
                        <div className="att-toggle-row">
                            <div className="att-toggle-item wide">
                                <div className="toggle-info">
                                    <span className="toggle-label">Enable Overtime Tracking</span>
                                    <span className="toggle-desc">Track and calculate overtime hours</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={overtimeSettings.enableOvertime}
                                        onChange={(e) => setOvertimeSettings({ ...overtimeSettings, enableOvertime: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {overtimeSettings.enableOvertime && (
                            <>
                                <div className="att-field-row">
                                    <div className="att-field">
                                        <label>Min Overtime (minutes)</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.minOvertimeMinutes}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, minOvertimeMinutes: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                        <span className="field-hint">Minimum to count as OT</span>
                                    </div>
                                    <div className="att-field">
                                        <label>Max OT Per Day (hours)</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.maxOvertimePerDay}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, maxOvertimePerDay: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                    </div>
                                    <div className="att-field">
                                        <label>Max OT Per Week (hours)</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.maxOvertimePerWeek}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, maxOvertimePerWeek: parseInt(e.target.value) })}
                                            className="att-input"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="att-field-row">
                                    <div className="att-field">
                                        <label>Regular OT Multiplier</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.overtimeMultiplier}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, overtimeMultiplier: parseFloat(e.target.value) })}
                                            className="att-input"
                                            step="0.1"
                                            min="1"
                                        />
                                        <span className="field-hint">e.g., 1.5x regular rate</span>
                                    </div>
                                    <div className="att-field">
                                        <label>Weekend Multiplier</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.weekendMultiplier}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, weekendMultiplier: parseFloat(e.target.value) })}
                                            className="att-input"
                                            step="0.1"
                                            min="1"
                                        />
                                    </div>
                                    <div className="att-field">
                                        <label>Holiday Multiplier</label>
                                        <input
                                            type="number"
                                            value={overtimeSettings.holidayMultiplier}
                                            onChange={(e) => setOvertimeSettings({ ...overtimeSettings, holidayMultiplier: parseFloat(e.target.value) })}
                                            className="att-input"
                                            step="0.1"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="att-toggle-row">
                                    <div className="att-toggle-item">
                                        <span>Require Pre-Approval</span>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={overtimeSettings.requirePreApproval}
                                                onChange={(e) => setOvertimeSettings({ ...overtimeSettings, requirePreApproval: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="att-card-footer">
                        <button className="att-btn-primary" onClick={() => handleSave('Overtime')}>
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
