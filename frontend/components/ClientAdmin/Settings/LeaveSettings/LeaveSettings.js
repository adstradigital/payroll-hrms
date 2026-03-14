'use client';

import { useState } from 'react';
import {
    Settings, Save
} from 'lucide-react';
import './LeaveSettings.css';

export default function LeaveSettings() {
    // General settings
    const [settings, setSettings] = useState({
        leaveYearStart: '01-01',
        maxConsecutiveDays: 15,
        minDaysBeforeRequest: 3,
        allowHalfDay: true,
        requireApproval: true,
        autoApproveAfterDays: 0,
        showLeaveBalance: true
    });

    const handleSettingChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
    };

    return (
        <div className="leave-settings">
            {/* Header */}
            <div className="leave-settings-header">
                <div>
                    <h2>Leave Settings</h2>
                    <p>Configure leave policies for your organization</p>
                </div>
            </div>

            {/* General Settings Card */}
            <div className="leave-card">
                <div className="leave-card-header">
                    <Settings size={20} />
                    <h3>General Leave Configuration</h3>
                </div>
                <div className="leave-settings-grid">
                    <div className="leave-field">
                        <label>Leave Year Start</label>
                        <input
                            type="text"
                            value={settings.leaveYearStart}
                            onChange={(e) => handleSettingChange('leaveYearStart', e.target.value)}
                            placeholder="MM-DD"
                            className="leave-input"
                        />
                    </div>
                    <div className="leave-field">
                        <label>Max Consecutive Days</label>
                        <input
                            type="number"
                            value={settings.maxConsecutiveDays}
                            onChange={(e) => handleSettingChange('maxConsecutiveDays', e.target.value)}
                            className="leave-input"
                        />
                    </div>
                    <div className="leave-field">
                        <label>Min Days Before Request</label>
                        <input
                            type="number"
                            value={settings.minDaysBeforeRequest}
                            onChange={(e) => handleSettingChange('minDaysBeforeRequest', e.target.value)}
                            className="leave-input"
                        />
                    </div>
                    <div className="leave-field">
                        <label>Auto-Approve After Days</label>
                        <input
                            type="number"
                            value={settings.autoApproveAfterDays}
                            onChange={(e) => handleSettingChange('autoApproveAfterDays', e.target.value)}
                            className="leave-input"
                            placeholder="0 = disabled"
                        />
                    </div>
                </div>
                <div className="leave-toggle-row">
                    <div className="leave-toggle-item">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.allowHalfDay}
                                onChange={(e) => handleSettingChange('allowHalfDay', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>Allow Half-Day Leave</span>
                    </div>
                    <div className="leave-toggle-item">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.requireApproval}
                                onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>Require Manager Approval</span>
                    </div>
                    <div className="leave-toggle-item">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.showLeaveBalance}
                                onChange={(e) => handleSettingChange('showLeaveBalance', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>Show Leave Balance to Employees</span>
                    </div>
                </div>
                <div className="leave-card-footer">
                    <button className="leave-btn-primary">
                        <Save size={16} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
