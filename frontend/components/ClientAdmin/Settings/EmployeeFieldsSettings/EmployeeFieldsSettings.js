'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

import './EmployeeFieldsSettings.css';

const API_BASE = '/settings/employee-fields/';

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
];

const EMPTY_FORM = Object.freeze({
    field_name: '',
    field_key: '',
    field_type: 'text',
    is_required: false,
    is_active: true,
    options: [''],
});

function asString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function slugifyKey(name) {
    const base = asString(name)
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_');

    if (!base) return '';
    if (/^\d/.test(base)) return `field_${base}`;
    return base;
}

function normalizeBoolean(value, fallback = false) {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
}

function normalizeFields(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list
        .filter((f) => f && typeof f === 'object')
        .map((f) => ({
            id: asString(f?.id),
            field_name: asString(f?.field_name),
            field_key: asString(f?.field_key),
            field_type: asString(f?.field_type) || 'text',
            is_required: normalizeBoolean(f?.is_required, false),
            is_active: normalizeBoolean(f?.is_active, true),
            options: Array.isArray(f?.options) ? f.options.map((o) => asString(o)) : [],
        }));
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

function FieldModal({ open, initialField, onClose, onSave, saving }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const nameInputRef = useRef(null);

    const isEditing = Boolean(initialField?.id);

    useEffect(() => {
        if (!open) return;

        const next = initialField?.id
            ? {
                ...EMPTY_FORM,
                id: initialField?.id,
                field_name: initialField?.field_name || '',
                field_key: slugifyKey(initialField?.field_name || '') || (initialField?.field_key || ''),
                field_type: initialField?.field_type || 'text',
                is_required: Boolean(initialField?.is_required),
                is_active: initialField?.is_active ?? true,
                options: Array.isArray(initialField?.options) && initialField.options.length > 0
                    ? initialField.options.map((o) => asString(o))
                    : [''],
            }
            : {
                ...EMPTY_FORM,
                field_key: '',
            };

        setForm(next);
        setError('');
        setTimeout(() => nameInputRef.current?.focus(), 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialField?.id]);

    if (!open) return null;

    const onChange = (key) => (e) => {
        const value =
            e?.target?.type === 'checkbox'
                ? Boolean(e?.target?.checked)
                : (e?.target?.value ?? '');

        setForm((prev) => {
            const next = { ...prev, [key]: value };

            if (key === 'field_name') {
                next.field_key = slugifyKey(value);
            }

            if (key === 'field_type' && value !== 'dropdown') {
                next.options = [''];
            }

            if (key === 'field_type' && value === 'dropdown' && (!Array.isArray(prev?.options) || prev.options.length === 0)) {
                next.options = [''];
            }

            return next;
        });
    };

    const updateOption = (index, value) => {
        setForm((prev) => {
            const nextOptions = Array.isArray(prev?.options) ? [...prev.options] : [];
            nextOptions[index] = value;
            return { ...prev, options: nextOptions };
        });
    };

    const addOption = () => {
        setForm((prev) => ({ ...prev, options: [...(prev?.options || []), ''] }));
    };

    const removeOption = (index) => {
        setForm((prev) => {
            const nextOptions = Array.isArray(prev?.options) ? prev.options.filter((_, i) => i !== index) : [];
            return { ...prev, options: nextOptions.length > 0 ? nextOptions : [''] };
        });
    };

    const submit = (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            field_name: asString(form?.field_name).trim(),
            field_type: asString(form?.field_type) || 'text',
            is_required: Boolean(form?.is_required),
            is_active: Boolean(form?.is_active),
            options: Array.isArray(form?.options) ? form.options.map((o) => asString(o).trim()).filter(Boolean) : [],
        };

        if (!payload.field_name) return setError('Field name is required.');
        if (!slugifyKey(payload.field_name)) return setError('Field key could not be generated. Please adjust the field name.');

        const supported = new Set(FIELD_TYPES.map((t) => t.value));
        if (!supported.has(payload.field_type)) return setError('Invalid field type.');

        if (payload.field_type === 'dropdown' && payload.options.length === 0) {
            return setError('Dropdown fields require at least one option.');
        }

        onSave(payload, initialField?.id || null);
    };

    return (
        <div className="efs-modal-overlay" role="dialog" aria-modal="true">
            <div className="efs-modal">
                <div className="efs-modal-header">
                    <h3 className="efs-modal-title">{isEditing ? 'Edit Employee Field' : 'Add Employee Field'}</h3>
                    <button className="efs-modal-close" type="button" onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit}>
                    <div className="efs-modal-body">
                        {error ? (
                            <div className="efs-empty" style={{ borderStyle: 'solid' }}>
                                {error}
                            </div>
                        ) : null}

                        <div className="settings-input-row" style={{ marginTop: error ? '1rem' : 0 }}>
                            <div className="settings-field-group">
                                <label className="settings-label">Field Name</label>
                                <input
                                    ref={nameInputRef}
                                    className="settings-input"
                                    value={form?.field_name || ''}
                                    onChange={onChange('field_name')}
                                    placeholder="e.g. Employee Nickname"
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Field Key</label>
                                <input
                                    className="settings-input"
                                    value={form?.field_key || ''}
                                    readOnly
                                    aria-readonly="true"
                                />
                            </div>
                        </div>

                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Field Type</label>
                                <select className="settings-select" value={form?.field_type || 'text'} onChange={onChange('field_type')}>
                                    {FIELD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Required</label>
                                <div className="settings-toggle-item wide" style={{ marginBottom: 0 }}>
                                    <div className="toggle-info">
                                        <span className="toggle-label">{form?.is_required ? 'Yes' : 'No'}</span>
                                        <span className="toggle-desc">Employees must provide a value.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={Boolean(form?.is_required)} onChange={onChange('is_required')} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="settings-toggle-item wide">
                            <div className="toggle-info">
                                <span className="toggle-label">Status</span>
                                <span className="toggle-desc">{form?.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={Boolean(form?.is_active)} onChange={onChange('is_active')} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        {form?.field_type === 'dropdown' ? (
                            <div className="settings-field-group" style={{ marginTop: '1rem' }}>
                                <label className="settings-label">Dropdown Options</label>
                                <div className="efs-options">
                                    {(form?.options || []).map((opt, idx) => (
                                        <div className="efs-option-row" key={`${idx}-${opt || ''}`}>
                                            <input
                                                className="settings-input"
                                                value={opt || ''}
                                                onChange={(e) => updateOption(idx, e?.target?.value ?? '')}
                                                placeholder={`Option ${idx + 1}`}
                                            />
                                            <button
                                                className="efs-icon-btn"
                                                type="button"
                                                onClick={() => removeOption(idx)}
                                                title="Remove option"
                                                disabled={saving}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button className="settings-btn-secondary" type="button" onClick={addOption}>
                                        <Plus size={16} />
                                        Add option
                                    </button>
                                </div>
                            </div>
                        ) : null}
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

export default function EmployeeFieldsSettings() {
    const [fields, setFields] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const sortedFields = useMemo(() => {
        const list = Array.isArray(fields) ? fields : [];
        return [...list].sort((a, b) =>
            asString(a?.field_name).localeCompare(asString(b?.field_name), undefined, { sensitivity: 'base' })
        );
    }, [fields]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadFields = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(API_BASE);
            const raw = res?.data?.results ?? res?.data ?? [];
            setFields(normalizeFields(raw));
        } catch (error) {
            console.error('Failed to load employee fields:', error);
            setFields([]);
            showNotification(getApiErrorMessage(error) || 'Failed to load employee fields', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFields();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (field) => {
        setEditing(field || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const upsertField = async (payload, id) => {
        try {
            setSaving(true);
            if (id) {
                await axiosInstance.put(`${API_BASE}${id}/`, payload);
                showNotification('Employee field updated', 'success');
            } else {
                await axiosInstance.post(API_BASE, payload);
                showNotification('Employee field created', 'success');
            }
            closeModal();
            await loadFields();
        } catch (error) {
            console.error('Failed to save employee field:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to save employee field', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteField = async (field) => {
        const name = field?.field_name || 'this field';
        const ok = window.confirm(`Delete ${name}?`);
        if (!ok) return;

        try {
            setSaving(true);
            const id = asString(field?.id);
            if (!id) return showNotification('Missing field id', 'error');
            await axiosInstance.delete(`${API_BASE}${id}/`);
            setFields((prev) => (Array.isArray(prev) ? prev.filter((f) => asString(f?.id) !== id) : []));
            showNotification('Employee field deleted', 'success');
        } catch (error) {
            console.error('Failed to delete employee field:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to delete employee field', 'error');
        } finally {
            setSaving(false);
        }
    };

    const typeLabel = (type) => FIELD_TYPES.find((t) => t.value === type)?.label || asString(type) || '';

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type || 'success'}`}>
                    <span>{notification?.message || ''}</span>
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Employee Fields</h2>
                <p>Configure custom fields that can later be used on the employee form.</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={16} />
                        <h3>Configured Fields</h3>
                    </div>
                    <div className="efs-toolbar">
                        <button className="settings-btn-primary" type="button" onClick={openCreate}>
                            <Plus size={16} />
                            Add Employee Field
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    {loading ? (
                        <div className="efs-empty">Loading employee fields…</div>
                    ) : sortedFields?.length === 0 ? (
                        <div className="efs-empty">No employee fields configured yet.</div>
                    ) : (
                        <div className="efs-table-wrap">
                            <table className="efs-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '28%' }}>Field Name</th>
                                        <th style={{ width: '16%' }}>Field Type</th>
                                        <th style={{ width: '10%' }}>Required</th>
                                        <th style={{ width: '12%' }}>Status</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFields?.map((f, idx) => (
                                        <tr key={f?.id || f?.field_key || f?.field_name || idx}>
                                            <td>
                                                {f?.field_name || ''}
                                                <div className="efs-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                    {f?.field_key || ''}
                                                </div>
                                            </td>
                                            <td className="efs-muted">{typeLabel(f?.field_type) || ''}</td>
                                            <td>{f?.is_required ? 'Yes' : 'No'}</td>
                                            <td>
                                                <span className={`efs-badge ${f?.is_active ? 'active' : 'inactive'}`}>
                                                    {f?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="efs-actions">
                                                    <button
                                                        type="button"
                                                        className="efs-icon-btn"
                                                        title="Edit"
                                                        onClick={() => openEdit(f)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="efs-icon-btn"
                                                        title="Delete"
                                                        onClick={() => deleteField(f)}
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

            <FieldModal
                open={modalOpen}
                initialField={editing}
                onClose={closeModal}
                onSave={upsertField}
                saving={saving}
            />
        </div>
    );
}
