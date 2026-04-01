'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitmentRejectionReasonsSettings.css';

const EMPTY_FORM = {
    reason_text: '',
    is_active: true,
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || error?.response?.data?.error || fallback;
};

export default function RecruitmentRejectionReasonsSettings() {
    const [reasons, setReasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReason, setEditingReason] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchReasons();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchReasons = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await recruitmentApi.getRejectionReasons();
            setReasons(res.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load rejection reasons.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingReason(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
        setError('');
    };

    const openEditModal = (reason) => {
        setEditingReason(reason);
        setForm({
            reason_text: reason.reason_text || '',
            is_active: reason.is_active !== false,
        });
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingReason(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        const text = (form.reason_text || '').trim();
        if (!text) {
            setError('Reason text is required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (editingReason) {
                await recruitmentApi.updateRejectionReason(editingReason.id, { 
                    reason_text: text, 
                    is_active: !!form.is_active 
                });
                showNotification('Reason updated', 'success');
            } else {
                await recruitmentApi.createRejectionReason({ 
                    reason_text: text, 
                    is_active: !!form.is_active 
                });
                showNotification('Reason created', 'success');
            }

            closeModal();
            await fetchReasons();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save reason.'));
            showNotification('Failed to save reason', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (reason) => {
        if (!window.confirm(`Delete "${reason.reason_text}"? This will remove it from the list of standard reasons.`)) return;

        setSaving(true);
        setError('');
        try {
            await recruitmentApi.deleteRejectionReason(reason.id);
            showNotification('Reason deleted', 'success');
            await fetchReasons();
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete reason.'));
            showNotification('Failed to delete reason', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading rejection reasons...</div>;
    }

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Standard Rejection Reasons</h2>
                <p>Standardize the reasons for candidate rejection to improve reporting and analytics.</p>
            </div>

            {error && (
                <div className="app-stages-alert" style={{ marginBottom: '1.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="settings-card">
                <div className="settings-card-header">
                    <HelpCircle size={18} />
                    <h3>Configured Reasons</h3>
                    <div className="app-stages-header-actions">
                        <button className="settings-btn-primary" type="button" onClick={openCreateModal} disabled={saving}>
                            <Plus size={16} />
                            Add Reason
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    <div className="rejection-reasons-table-wrap">
                        <table className="rejection-reasons-table">
                            <thead>
                                <tr>
                                    <th>Reason Text</th>
                                    <th>Status</th>
                                    <th className="rejection-reasons-actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reasons.map((reason) => (
                                    <tr key={reason.id}>
                                        <td>
                                            <strong>{reason.reason_text}</strong>
                                        </td>
                                        <td>
                                            <span className={`rejection-reasons-status ${reason.is_active ? 'active' : 'inactive'}`}>
                                                {reason.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="rejection-reasons-actions-col">
                                            <button
                                                type="button"
                                                className="rejection-reasons-icon-btn"
                                                onClick={() => openEditModal(reason)}
                                                disabled={saving}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="rejection-reasons-icon-btn danger"
                                                onClick={() => handleDelete(reason)}
                                                disabled={saving}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {reasons.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="rejection-reasons-empty">
                                            No rejection reasons configured.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h3>{editingReason ? 'Edit Reason' : 'Add Reason'}</h3>
                            <button className="modal-close" type="button" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="settings-modal-body">
                            <div className="settings-field-group">
                                <label className="settings-label">Reason Text</label>
                                <input
                                    className="settings-input"
                                    type="text"
                                    value={form.reason_text}
                                    onChange={(e) => setForm((prev) => ({ ...prev, reason_text: e.target.value }))}
                                    placeholder="e.g. Salary Expectation Mismatch"
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Active</label>
                                <div className="settings-toggle-item wide app-stages-toggle">
                                    <div className="toggle-info">
                                        <span className="toggle-label">{form.is_active ? 'Active' : 'Inactive'}</span>
                                        <span className="toggle-desc">Inactive reasons won't show in the dropdown.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={!!form.is_active}
                                            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                            disabled={saving}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="settings-modal-footer">
                            <button className="settings-btn-secondary" type="button" onClick={closeModal} disabled={saving}>
                                Cancel
                            </button>
                            <button className="settings-btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Save Reason'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
