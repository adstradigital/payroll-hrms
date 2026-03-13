'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle, Layers } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitmentApplicationStagesSettings.css';

const EMPTY_FORM = {
    name: '',
    order: 1,
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

export default function RecruitmentApplicationStagesSettings() {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchStages();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchStages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await recruitmentApi.getStages();
            setStages(res.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load application stages.'));
        } finally {
            setLoading(false);
        }
    };

    const sortedStages = useMemo(() => {
        return [...stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    }, [stages]);

    const openCreateModal = () => {
        setEditingStage(null);
        setForm({
            ...EMPTY_FORM,
            order: (sortedStages[sortedStages.length - 1]?.sequence || 0) + 1,
        });
        setIsModalOpen(true);
        setError('');
    };

    const openEditModal = (stage) => {
        setEditingStage(stage);
        setForm({
            name: stage.name || '',
            order: stage.sequence || 1,
            is_active: stage.is_active !== false,
        });
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStage(null);
        setForm(EMPTY_FORM);
    };

    const buildReorderPayload = (movingId, targetOrder) => {
        const normalizedTarget = Math.max(1, Math.min(targetOrder, sortedStages.length));
        const ids = sortedStages.map((s) => s.id).filter(Boolean);
        const filtered = ids.filter((id) => id !== movingId);
        filtered.splice(normalizedTarget - 1, 0, movingId);
        return filtered;
    };

    const handleSave = async () => {
        const name = (form.name || '').trim();
        const order = Math.max(1, Math.trunc(Number(form.order || 1)));

        if (!name) {
            setError('Stage name is required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (editingStage) {
                await recruitmentApi.updateStage(editingStage.id, { name, is_active: !!form.is_active });

                if (order !== (editingStage.sequence || 1)) {
                    const orderedIds = buildReorderPayload(editingStage.id, order);
                    await recruitmentApi.reorderStages(orderedIds);
                }

                showNotification('Stage updated', 'success');
            } else {
                await recruitmentApi.createStage({ name, sequence: order, is_active: !!form.is_active });
                showNotification('Stage created', 'success');
            }

            closeModal();
            await fetchStages();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save stage.'));
            showNotification('Failed to save stage', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (stage) => {
        if (stage.is_system) return;
        if (!window.confirm(`Delete "${stage.name}" stage?`)) return;

        setSaving(true);
        setError('');
        try {
            await recruitmentApi.deleteStage(stage.id);
            showNotification('Stage deleted', 'success');
            await fetchStages();
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete stage.'));
            showNotification('Failed to delete stage', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading stages...</div>;
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
                <h2>Application Stages</h2>
                <p>Configure recruitment pipeline stages used for candidate tracking.</p>
            </div>

            {error && (
                <div className="app-stages-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="settings-card">
                <div className="settings-card-header">
                    <Layers size={18} />
                    <h3>Pipeline Stages</h3>
                    <div className="app-stages-header-actions">
                        <button className="settings-btn-primary" type="button" onClick={openCreateModal} disabled={saving}>
                            <Plus size={16} />
                            Add Stage
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    <div className="app-stages-table-wrap">
                        <table className="app-stages-table">
                            <thead>
                                <tr>
                                    <th>Stage Name</th>
                                    <th>Order</th>
                                    <th>Status</th>
                                    <th className="app-stages-actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStages.map((stage) => (
                                    <tr key={stage.id}>
                                        <td>
                                            <div className="app-stages-name">
                                                <strong>{stage.name}</strong>
                                                {stage.is_system ? <span className="app-stages-pill">System</span> : null}
                                            </div>
                                        </td>
                                        <td>{stage.sequence}</td>
                                        <td>
                                            <span className={`app-stages-status ${stage.is_active === false ? 'inactive' : 'active'}`}>
                                                {stage.is_active === false ? 'Inactive' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="app-stages-actions-col">
                                            <button
                                                type="button"
                                                className="app-stages-icon-btn"
                                                onClick={() => openEditModal(stage)}
                                                title={stage.is_system ? 'Edit status only for system stages' : 'Edit stage'}
                                                disabled={saving}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="app-stages-icon-btn danger"
                                                onClick={() => handleDelete(stage)}
                                                title={stage.is_system ? 'System stages cannot be deleted' : 'Delete stage'}
                                                disabled={saving || stage.is_system}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedStages.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="app-stages-empty">
                                            No stages configured.
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
                            <h3>{editingStage ? 'Edit Stage' : 'Add Stage'}</h3>
                            <button className="modal-close" type="button" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="settings-modal-body">
                            <div className="settings-field-group">
                                <label className="settings-label">Stage Name</label>
                                <input
                                    className="settings-input"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Screening"
                                    disabled={saving || (editingStage?.is_system && true)}
                                />
                                {editingStage?.is_system ? (
                                    <div className="app-stages-help">System stages keep their name/order; you can toggle Active.</div>
                                ) : null}
                            </div>

                            <div className="settings-input-row">
                                <div className="settings-field-group">
                                    <label className="settings-label">Order</label>
                                    <input
                                        className="settings-input"
                                        type="number"
                                        min="1"
                                        value={form.order}
                                        onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                                        disabled={saving || (editingStage?.is_system && true)}
                                    />
                                </div>

                                <div className="settings-field-group">
                                    <label className="settings-label">Active</label>
                                    <div className="settings-toggle-item wide app-stages-toggle">
                                        <div className="toggle-info">
                                            <span className="toggle-label">{form.is_active ? 'Active' : 'Inactive'}</span>
                                            <span className="toggle-desc">Inactive stages can be hidden from new flows.</span>
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
                        </div>

                        <div className="settings-modal-footer">
                            <button className="settings-btn-secondary" type="button" onClick={closeModal} disabled={saving}>
                                Cancel
                            </button>
                            <button className="settings-btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Save Stage'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

