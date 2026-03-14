'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, X, Save, RefreshCcw } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

import './OnboardingTemplatesSettings.css';

const TEMPLATES_API = '/settings/onboarding-templates/';
const STEPS_API = '/settings/onboarding-steps/';

const EMPTY_TEMPLATE = Object.freeze({
    name: '',
    description: '',
    is_active: true,
    steps: [{ client_id: 'seed', step_name: '', step_order: 1 }],
});

function asString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function newId() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch { }
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeBoolean(value, fallback = false) {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
}

function normalizeTemplates(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list
        .filter((t) => t && typeof t === 'object')
        .map((t) => ({
            id: asString(t?.id),
            name: asString(t?.name),
            description: asString(t?.description),
            is_active: normalizeBoolean(t?.is_active, true),
        }));
}

function normalizeSteps(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list
        .filter((s) => s && typeof s === 'object')
        .map((s) => ({
            id: asString(s?.id),
            template: asString(s?.template),
            step_name: asString(s?.step_name),
            step_order: Number(s?.step_order ?? 0) || 0,
        }))
        .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
}

function getApiErrorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (detail) return String(detail);
    const data = error?.response?.data;
    if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data?.[firstKey];
        if (firstVal) return Array.isArray(firstVal) ? String(firstVal?.[0]) : String(firstVal);
    }
    return String(error?.message || 'Something went wrong');
}

function TemplateModal({ open, initialValue, initialSteps, onClose, onSave, saving }) {
    const [form, setForm] = useState(EMPTY_TEMPLATE);
    const [error, setError] = useState('');
    const nameInputRef = useRef(null);

    const isEditing = Boolean(initialValue?.id);

    useEffect(() => {
        if (!open) return;

        const existing = normalizeSteps(initialSteps || []);
        const ensureClientId = (s) => ({
            ...s,
            client_id: s?.client_id || s?.id || newId(),
        });
        const nextSteps = isEditing
            ? [
                ...existing.map((s) => ensureClientId({ ...s, readonly: true })),
                ensureClientId({ step_name: '', step_order: Math.max(0, ...existing.map((s) => s.step_order || 0)) + 1 }),
            ]
            : [ensureClientId({ step_name: '', step_order: 1 })];

        setForm({
            name: initialValue?.name || '',
            description: initialValue?.description || '',
            is_active: initialValue?.is_active ?? true,
            steps: nextSteps,
        });
        setError('');
        setTimeout(() => nameInputRef.current?.focus(), 0);
    }, [open, initialValue?.id]);

    if (!open) return null;

    const onChange = (key) => (e) => {
        const value =
            e?.target?.type === 'checkbox'
                ? Boolean(e?.target?.checked)
                : (e?.target?.value ?? '');
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateStep = (index, key, value) => {
        setForm((prev) => {
            const nextSteps = Array.isArray(prev?.steps) ? [...prev.steps] : [];
            const target = nextSteps[index] || {};
            nextSteps[index] = { ...target, [key]: value };
            return { ...prev, steps: nextSteps };
        });
    };

    const addStep = () => {
        setForm((prev) => {
            const existing = Array.isArray(prev?.steps) ? prev.steps : [];
            const maxOrder = Math.max(0, ...existing.map((s) => Number(s?.step_order || 0)));
            return { ...prev, steps: [...existing, { client_id: newId(), step_name: '', step_order: maxOrder + 1 }] };
        });
    };

    const removeStep = (index) => {
        setForm((prev) => {
            const existing = Array.isArray(prev?.steps) ? prev.steps : [];
            const target = existing[index];
            if (target?.readonly) return prev;
            const nextSteps = existing.filter((_, i) => i !== index);
            return { ...prev, steps: nextSteps.length ? nextSteps : [{ client_id: newId(), step_name: '', step_order: 1 }] };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: asString(form?.name).trim(),
            description: asString(form?.description).trim(),
            is_active: Boolean(form?.is_active),
        };

        if (!payload.name) return setError('Template name is required.');

        const steps = (form?.steps || [])
            .filter((s) => !s?.readonly)
            .map((s) => ({
                step_name: asString(s?.step_name).trim(),
                step_order: Number(s?.step_order ?? 0) || 0,
            }))
            .filter((s) => s.step_name && s.step_order > 0);

        if (!isEditing && steps.length === 0) return setError('Add at least one onboarding step.');

        onSave(payload, steps, initialValue?.id || null);
    };

    return (
        <div className="ots-modal-overlay" role="dialog" aria-modal="true">
            <div className="ots-modal">
                <div className="ots-modal-header">
                    <h3 className="ots-modal-title">{isEditing ? 'Edit Onboarding Template' : 'Add Onboarding Template'}</h3>
                    <button className="ots-modal-close" type="button" onClick={onClose} title="Close" disabled={saving}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit}>
                    <div className="ots-modal-body">
                        {error ? (
                            <div className="ots-empty" style={{ borderStyle: 'solid' }}>
                                {error}
                            </div>
                        ) : null}

                        <div className="settings-input-row" style={{ marginTop: error ? '1rem' : 0 }}>
                            <div className="settings-field-group">
                                <label className="settings-label">Template Name</label>
                                <input
                                    ref={nameInputRef}
                                    className="settings-input"
                                    value={form?.name || ''}
                                    onChange={onChange('name')}
                                    placeholder="e.g. Standard Onboarding"
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Status</label>
                                <div className="settings-toggle-item wide" style={{ marginBottom: 0 }}>
                                    <div className="toggle-info">
                                        <span className="toggle-label">{form?.is_active ? 'Active' : 'Inactive'}</span>
                                        <span className="toggle-desc">Inactive templates are hidden from future use.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={Boolean(form?.is_active)} onChange={onChange('is_active')} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="settings-field-group">
                            <label className="settings-label">Description</label>
                            <textarea
                                className="settings-textarea"
                                value={form?.description || ''}
                                onChange={onChange('description')}
                                rows={3}
                                placeholder="Optional description"
                            />
                        </div>

                        <div className="ots-steps-header">
                            <div>
                                <div className="settings-label" style={{ marginBottom: 0 }}>Onboarding Steps</div>
                                <div className="ots-muted" style={{ fontSize: '0.8rem' }}>
                                    {isEditing ? 'Existing steps are read-only; you can append new steps.' : 'Add steps in the order they should happen.'}
                                </div>
                            </div>
                            <button className="settings-btn-secondary" type="button" onClick={addStep} disabled={saving}>
                                <Plus size={16} />
                                Add step
                            </button>
                        </div>

                        {(form?.steps || []).map((s, idx) => {
                            const readonly = Boolean(s?.readonly);
                            return (
                                <div className="ots-step-row" key={s?.id || s?.client_id || idx}>
                                    <div className="settings-field-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="settings-label">Step Name</label>
                                        <input
                                            className="settings-input"
                                            value={s?.step_name || ''}
                                            onChange={(e) => updateStep(idx, 'step_name', e?.target?.value ?? '')}
                                            placeholder="e.g. Submit documents"
                                            disabled={readonly || saving}
                                        />
                                    </div>
                                    <div className="settings-field-group ots-step-order" style={{ marginBottom: 0 }}>
                                        <label className="settings-label">Step Order</label>
                                        <input
                                            className="settings-input"
                                            type="number"
                                            min={1}
                                            value={s?.step_order ?? ''}
                                            onChange={(e) => updateStep(idx, 'step_order', e?.target?.value ?? '')}
                                            disabled={readonly || saving}
                                        />
                                    </div>
                                    <button
                                        className="ots-icon-btn"
                                        type="button"
                                        title={readonly ? 'Existing steps cannot be removed' : 'Remove step'}
                                        onClick={() => removeStep(idx)}
                                        disabled={readonly || saving}
                                        style={{ marginBottom: '0.15rem' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="settings-card-footer">
                        <button className="settings-btn-primary" type="submit" disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                        </button>
                        <button className="settings-btn-secondary" type="button" onClick={onClose} disabled={saving}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function OnboardingTemplatesSettings() {
    const [templates, setTemplates] = useState([]);
    const [stepsByTemplate, setStepsByTemplate] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const sortedTemplates = useMemo(() => {
        const list = Array.isArray(templates) ? templates : [];
        return [...list].sort((a, b) => asString(a?.name).localeCompare(asString(b?.name), undefined, { sensitivity: 'base' }));
    }, [templates]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadTemplatesAndSteps = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(TEMPLATES_API);
            const rawTemplates = res?.data?.results ?? res?.data ?? [];
            const nextTemplates = normalizeTemplates(rawTemplates);
            setTemplates(nextTemplates);

            const stepEntries = await Promise.all(
                nextTemplates.map(async (t) => {
                    try {
                        const stepsRes = await axiosInstance.get(`${STEPS_API}${t.id}/`);
                        const rawSteps = stepsRes?.data?.results ?? stepsRes?.data ?? [];
                        return [t.id, normalizeSteps(rawSteps)];
                    } catch (e) {
                        console.error('Failed to load steps for template:', t?.id, e);
                        return [t.id, []];
                    }
                })
            );

            const nextStepsMap = {};
            for (const [templateId, steps] of stepEntries) nextStepsMap[templateId] = steps;
            setStepsByTemplate(nextStepsMap);
        } catch (error) {
            console.error('Failed to load onboarding templates:', error);
            setTemplates([]);
            setStepsByTemplate({});
            showNotification(getApiErrorMessage(error) || 'Failed to load onboarding templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplatesAndSteps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (t) => {
        setEditing(t || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const saveTemplateAndSteps = async (templatePayload, newSteps, id) => {
        try {
            setSaving(true);

            let templateId = id;
            if (id) {
                await axiosInstance.put(`${TEMPLATES_API}${id}/`, templatePayload);
                showNotification('Template updated', 'success');
            } else {
                const created = await axiosInstance.post(TEMPLATES_API, templatePayload);
                templateId = asString(created?.data?.id);
                showNotification('Template created', 'success');
            }

            const stepsToCreate = Array.isArray(newSteps) ? newSteps : [];
            for (const step of stepsToCreate) {
                await axiosInstance.post(STEPS_API, {
                    template: templateId,
                    step_name: step?.step_name || '',
                    step_order: step?.step_order,
                });
            }

            if (stepsToCreate.length > 0) showNotification('Steps saved', 'success');
            closeModal();
            await loadTemplatesAndSteps();
        } catch (error) {
            console.error('Failed to save onboarding template/steps:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to save onboarding template', 'error');
        } finally {
            setSaving(false);
        }
    };

    const removeTemplate = async (t) => {
        const name = t?.name || 'this template';
        const ok = window.confirm(`Delete ${name}? This will remove its steps too.`);
        if (!ok) return;

        try {
            setSaving(true);
            const id = asString(t?.id);
            if (!id) return showNotification('Missing template id', 'error');
            await axiosInstance.delete(`${TEMPLATES_API}${id}/`);
            setTemplates((prev) => (Array.isArray(prev) ? prev.filter((x) => asString(x?.id) !== id) : []));
            setStepsByTemplate((prev) => {
                const next = { ...(prev || {}) };
                delete next[id];
                return next;
            });
            showNotification('Template deleted', 'success');
        } catch (error) {
            console.error('Failed to delete template:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to delete template', 'error');
        } finally {
            setSaving(false);
        }
    };

    const stepsCount = (templateId) => (stepsByTemplate?.[templateId] || []).length;

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type || 'success'}`}>
                    <span>{notification?.message || ''}</span>
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Onboarding Templates</h2>
                <p>Configure onboarding templates and steps (not connected to employee creation yet).</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ClipboardList size={16} />
                        <h3>Templates</h3>
                    </div>
                    <div className="ots-toolbar">
                        <button className="settings-btn-secondary" type="button" onClick={loadTemplatesAndSteps} disabled={loading || saving}>
                            <RefreshCcw size={16} />
                            Refresh
                        </button>
                        <button className="settings-btn-primary" type="button" onClick={openCreate} disabled={saving}>
                            <Plus size={16} />
                            Add Onboarding Template
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    {loading ? (
                        <div className="ots-empty">Loading onboarding templates…</div>
                    ) : sortedTemplates?.length === 0 ? (
                        <div className="ots-empty">No onboarding templates configured yet.</div>
                    ) : (
                        <div className="ots-table-wrap">
                            <table className="ots-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '26%' }}>Template Name</th>
                                        <th>Description</th>
                                        <th style={{ width: '12%' }}>Status</th>
                                        <th style={{ width: '12%' }}>Steps</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTemplates?.map((t, idx) => (
                                        <tr key={t?.id || `${t?.name || ''}-${idx}`}>
                                            <td>{t?.name || ''}</td>
                                            <td className="ots-muted">{t?.description || ''}</td>
                                            <td>
                                                <span className={`ots-badge ${t?.is_active ? 'active' : 'inactive'}`}>
                                                    {t?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="ots-muted">{stepsCount(t?.id) || 0}</td>
                                            <td>
                                                <div className="ots-actions">
                                                    <button
                                                        type="button"
                                                        className="ots-icon-btn"
                                                        title="Edit"
                                                        onClick={() => openEdit(t)}
                                                        disabled={saving}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ots-icon-btn"
                                                        title="Delete"
                                                        onClick={() => removeTemplate(t)}
                                                        disabled={saving}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <TemplateModal
                open={modalOpen}
                initialValue={editing}
                initialSteps={stepsByTemplate?.[editing?.id] || []}
                onClose={closeModal}
                onSave={saveTemplateAndSteps}
                saving={saving}
            />
        </div>
    );
}
