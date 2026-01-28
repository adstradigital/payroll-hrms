'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Gift, Briefcase, Plus, Edit2, Trash2,
    Settings, ChevronDown, Save, X, AlertCircle
} from 'lucide-react';
import './LeaveSettings.css';

// Mock data for leave types
const defaultLeaveTypes = [
    { id: 1, name: 'Annual Leave', code: 'AL', days: 20, carryForward: true, paidLeave: true, color: '#4f46e5' },
    { id: 2, name: 'Sick Leave', code: 'SL', days: 10, carryForward: false, paidLeave: true, color: '#10b981' },
    { id: 3, name: 'Casual Leave', code: 'CL', days: 5, carryForward: false, paidLeave: true, color: '#f59e0b' },
    { id: 4, name: 'Maternity Leave', code: 'ML', days: 90, carryForward: false, paidLeave: true, color: '#ec4899' },
    { id: 5, name: 'Paternity Leave', code: 'PL', days: 10, carryForward: false, paidLeave: true, color: '#3b82f6' },
    { id: 6, name: 'Unpaid Leave', code: 'UL', days: 30, carryForward: false, paidLeave: false, color: '#6b7280' }
];

export default function LeaveSettings() {
    const [leaveTypes, setLeaveTypes] = useState(defaultLeaveTypes);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [notification, setNotification] = useState(null);

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

    const handleAddLeaveType = () => {
        setEditingType(null);
        setShowModal(true);
    };

    const handleEditLeaveType = (type) => {
        setEditingType(type);
        setShowModal(true);
    };

    const handleDeleteLeaveType = (id) => {
        setLeaveTypes(leaveTypes.filter(type => type.id !== id));
        showNotification('Leave type deleted successfully', 'success');
    };

    const handleSaveType = (typeData) => {
        if (editingType) {
            setLeaveTypes(leaveTypes.map(t => t.id === editingType.id ? { ...t, ...typeData } : t));
            showNotification('Leave type updated successfully', 'success');
        } else {
            setLeaveTypes([...leaveTypes, { ...typeData, id: Date.now() }]);
            showNotification('Leave type added successfully', 'success');
        }
        setShowModal(false);
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSettingChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
    };

    return (
        <div className="leave-settings">
            {/* Notification */}
            {notification && (
                <div className={`leave-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="leave-settings-header">
                <div>
                    <h2>Leave Settings</h2>
                    <p>Configure leave policies and leave types for your organization</p>
                </div>
                <button className="leave-btn-primary" onClick={handleAddLeaveType}>
                    <Plus size={18} />
                    Add Leave Type
                </button>
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

            {/* Leave Types Card */}
            <div className="leave-card">
                <div className="leave-card-header">
                    <Calendar size={20} />
                    <h3>Leave Types</h3>
                </div>
                <div className="leave-types-grid">
                    {leaveTypes.map(type => (
                        <div key={type.id} className="leave-type-card">
                            <div className="leave-type-header">
                                <div
                                    className="leave-type-color"
                                    style={{ backgroundColor: type.color }}
                                ></div>
                                <div className="leave-type-info">
                                    <h4>{type.name}</h4>
                                    <span className="leave-type-code">{type.code}</span>
                                </div>
                                <div className="leave-type-actions">
                                    <button onClick={() => handleEditLeaveType(type)} className="leave-action-btn">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteLeaveType(type.id)} className="leave-action-btn delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="leave-type-details">
                                <div className="leave-type-stat">
                                    <span className="stat-value">{type.days}</span>
                                    <span className="stat-label">Days/Year</span>
                                </div>
                                <div className="leave-type-badges">
                                    {type.paidLeave && <span className="badge badge-success">Paid</span>}
                                    {!type.paidLeave && <span className="badge badge-muted">Unpaid</span>}
                                    {type.carryForward && <span className="badge badge-info">Carry Forward</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <LeaveTypeModal
                    leaveType={editingType}
                    onSave={handleSaveType}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

// Leave Type Modal Component
function LeaveTypeModal({ leaveType, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: leaveType?.name || '',
        code: leaveType?.code || '',
        days: leaveType?.days || 0,
        carryForward: leaveType?.carryForward || false,
        paidLeave: leaveType?.paidLeave || true,
        color: leaveType?.color || '#4f46e5'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                <div className="leave-modal-header">
                    <h3>{leaveType ? 'Edit Leave Type' : 'Add Leave Type'}</h3>
                    <button onClick={onClose} className="modal-close">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="leave-modal-body">
                        <div className="leave-field">
                            <label>Leave Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="leave-input"
                                required
                                placeholder="e.g., Annual Leave"
                            />
                        </div>
                        <div className="leave-field-row">
                            <div className="leave-field">
                                <label>Leave Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="leave-input"
                                    required
                                    placeholder="e.g., AL"
                                    maxLength={3}
                                />
                            </div>
                            <div className="leave-field">
                                <label>Days Per Year *</label>
                                <input
                                    type="number"
                                    value={formData.days}
                                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                                    className="leave-input"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="leave-field">
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
                        <div className="leave-toggle-row">
                            <div className="leave-toggle-item">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.paidLeave}
                                        onChange={(e) => setFormData({ ...formData, paidLeave: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span>Paid Leave</span>
                            </div>
                            <div className="leave-toggle-item">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.carryForward}
                                        onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <span>Allow Carry Forward</span>
                            </div>
                        </div>
                    </div>
                    <div className="leave-modal-footer">
                        <button type="button" onClick={onClose} className="leave-btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="leave-btn-primary">
                            <Save size={16} />
                            {leaveType ? 'Update' : 'Create'} Leave Type
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
