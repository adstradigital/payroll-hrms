'use client';

import { useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import '../LeaveSettings/LeaveSettings.css';

const defaultLeaveTypes = [
    { id: 1, name: 'Annual Leave', code: 'AL', days: 20, carryForward: true, paidLeave: true, color: '#4f46e5' },
    { id: 2, name: 'Sick Leave', code: 'SL', days: 10, carryForward: false, paidLeave: true, color: '#10b981' },
    { id: 3, name: 'Casual Leave', code: 'CL', days: 5, carryForward: false, paidLeave: true, color: '#f59e0b' },
    { id: 4, name: 'Maternity Leave', code: 'ML', days: 90, carryForward: false, paidLeave: true, color: '#ec4899' },
    { id: 5, name: 'Paternity Leave', code: 'PL', days: 10, carryForward: false, paidLeave: true, color: '#3b82f6' },
    { id: 6, name: 'Unpaid Leave', code: 'UL', days: 30, carryForward: false, paidLeave: false, color: '#6b7280' }
];

export default function LeaveTypesSettings() {
    const [leaveTypes, setLeaveTypes] = useState(defaultLeaveTypes);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddLeaveType = () => {
        setEditingType(null);
        setShowModal(true);
    };

    const handleEditLeaveType = (type) => {
        setEditingType(type);
        setShowModal(true);
    };

    const handleDeleteLeaveType = (id) => {
        setLeaveTypes((prev) => (prev || []).filter((type) => type?.id !== id));
        showNotification('Leave type deleted successfully', 'success');
    };

    const handleSaveType = (typeData) => {
        if (editingType) {
            setLeaveTypes((prev) => (prev || []).map((t) => (t?.id === editingType?.id ? { ...t, ...typeData } : t)));
            showNotification('Leave type updated successfully', 'success');
        } else {
            setLeaveTypes((prev) => ([...(prev || []), { ...typeData, id: Date.now() }]));
            showNotification('Leave type added successfully', 'success');
        }
        setShowModal(false);
    };

    return (
        <div className="leave-settings">
            {notification && (
                <div className={`leave-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="leave-settings-header">
                <div>
                    <h2>Leave Types</h2>
                    <p>Manage leave types for your organization</p>
                </div>
                <button className="leave-btn-primary" onClick={handleAddLeaveType}>
                    <Plus size={18} />
                    Add Leave Type
                </button>
            </div>

            <div className="leave-card">
                <div className="leave-card-header">
                    <Calendar size={20} />
                    <h3>Leave Types</h3>
                </div>
                <div className="leave-types-grid">
                    {leaveTypes?.map((type) => (
                        <div key={type?.id} className="leave-type-card">
                            <div className="leave-type-header">
                                <div
                                    className="leave-type-color"
                                    style={{ backgroundColor: type?.color }}
                                />
                                <div className="leave-type-info">
                                    <h4>{type?.name || ''}</h4>
                                    <span className="leave-type-code">{type?.code || ''}</span>
                                </div>
                                <div className="leave-type-actions">
                                    <button onClick={() => handleEditLeaveType(type)} className="leave-action-btn">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteLeaveType(type?.id)} className="leave-action-btn delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="leave-type-details">
                                <div className="leave-type-stat">
                                    <span className="stat-value">{type?.days ?? 0}</span>
                                    <span className="stat-label">Days/Year</span>
                                </div>
                                <div className="leave-type-badges">
                                    {type?.paidLeave && <span className="badge badge-success">Paid</span>}
                                    {!type?.paidLeave && <span className="badge badge-muted">Unpaid</span>}
                                    {type?.carryForward && <span className="badge badge-info">Carry Forward</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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

function LeaveTypeModal({ leaveType, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: leaveType?.name || '',
        code: leaveType?.code || '',
        days: leaveType?.days || 0,
        carryForward: leaveType?.carryForward || false,
        paidLeave: leaveType?.paidLeave ?? true,
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
                                    onChange={(e) => setFormData({ ...formData, code: (e.target.value ?? '').toUpperCase() })}
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
                                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value || '0', 10) })}
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
                                        checked={Boolean(formData.paidLeave)}
                                        onChange={(e) => setFormData({ ...formData, paidLeave: e.target.checked })}
                                    />
                                    <span className="toggle-slider" />
                                </label>
                                <span>Paid Leave</span>
                            </div>
                            <div className="leave-toggle-item">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.carryForward)}
                                        onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                                    />
                                    <span className="toggle-slider" />
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

