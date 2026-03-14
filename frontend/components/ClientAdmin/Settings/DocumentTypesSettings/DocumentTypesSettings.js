'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, Pencil, Trash2, X, Save, RefreshCcw } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

import './DocumentTypesSettings.css';

const API_BASE = '/settings/document-types/';

const EMPTY_FORM = Object.freeze({
    name: '',
    description: '',
    is_required: false,
    is_active: true,
});

function asString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function normalizeBoolean(value, fallback = false) {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
}

function normalizeDocumentTypes(raw) {
    const list = Array.isArray(raw) ? raw : [];
    return list
        .filter((d) => d && typeof d === 'object')
        .map((d) => ({
            id: asString(d?.id),
            name: asString(d?.name),
            description: asString(d?.description),
            is_required: normalizeBoolean(d?.is_required, false),
            is_active: normalizeBoolean(d?.is_active, true),
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

function DocumentTypeModal({ open, initialValue, onClose, onSave, saving }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const nameInputRef = useRef(null);

    const isEditing = Boolean(initialValue?.id);

    useEffect(() => {
        if (!open) return;
        setForm(
            initialValue?.id
                ? {
                    ...EMPTY_FORM,
                    id: initialValue?.id,
                    name: initialValue?.name || '',
                    description: initialValue?.description || '',
                    is_required: Boolean(initialValue?.is_required),
                    is_active: initialValue?.is_active ?? true,
                }
                : EMPTY_FORM
        );
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

    const submit = (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: asString(form?.name).trim(),
            description: asString(form?.description).trim(),
            is_required: Boolean(form?.is_required),
            is_active: Boolean(form?.is_active),
        };

        if (!payload.name) return setError('Document name is required.');
        onSave(payload, initialValue?.id || null);
    };

    return (
        <div className="dts-modal-overlay" role="dialog" aria-modal="true">
            <div className="dts-modal">
                <div className="dts-modal-header">
                    <h3 className="dts-modal-title">{isEditing ? 'Edit Document Type' : 'Add Document Type'}</h3>
                    <button className="dts-modal-close" type="button" onClick={onClose} title="Close" disabled={saving}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit}>
                    <div className="dts-modal-body">
                        {error ? (
                            <div className="dts-empty" style={{ borderStyle: 'solid' }}>
                                {error}
                            </div>
                        ) : null}

                        <div className="settings-field-group" style={{ marginTop: error ? '1rem' : 0 }}>
                            <label className="settings-label">Document Name</label>
                            <input
                                ref={nameInputRef}
                                className="settings-input"
                                value={form?.name || ''}
                                onChange={onChange('name')}
                                placeholder="e.g. Aadhaar Card"
                            />
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

                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Required</label>
                                <div className="settings-toggle-item wide" style={{ marginBottom: 0 }}>
                                    <div className="toggle-info">
                                        <span className="toggle-label">{form?.is_required ? 'Yes' : 'No'}</span>
                                        <span className="toggle-desc">Employees must upload this document.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={Boolean(form?.is_required)} onChange={onChange('is_required')} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Status</label>
                                <div className="settings-toggle-item wide" style={{ marginBottom: 0 }}>
                                    <div className="toggle-info">
                                        <span className="toggle-label">{form?.is_active ? 'Active' : 'Inactive'}</span>
                                        <span className="toggle-desc">Inactive types are hidden from future use.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={Boolean(form?.is_active)} onChange={onChange('is_active')} />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>
                            </div>
                        </div>
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

export default function DocumentTypesSettings() {
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const sorted = useMemo(() => {
        const list = Array.isArray(documentTypes) ? documentTypes : [];
        return [...list].sort((a, b) => asString(a?.name).localeCompare(asString(b?.name), undefined, { sensitivity: 'base' }));
    }, [documentTypes]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadDocumentTypes = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(API_BASE);
            const raw = res?.data?.results ?? res?.data ?? [];
            setDocumentTypes(normalizeDocumentTypes(raw));
        } catch (error) {
            console.error('Failed to load document types:', error);
            setDocumentTypes([]);
            showNotification(getApiErrorMessage(error) || 'Failed to load document types', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocumentTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    const upsert = async (payload, id) => {
        try {
            setSaving(true);
            if (id) {
                await axiosInstance.put(`${API_BASE}${id}/`, payload);
                showNotification('Document type updated', 'success');
            } else {
                await axiosInstance.post(API_BASE, payload);
                showNotification('Document type created', 'success');
            }
            closeModal();
            await loadDocumentTypes();
        } catch (error) {
            console.error('Failed to save document type:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to save document type', 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item) => {
        const name = item?.name || 'this document type';
        const ok = window.confirm(`Delete ${name}?`);
        if (!ok) return;

        try {
            setSaving(true);
            const id = asString(item?.id);
            if (!id) return showNotification('Missing document type id', 'error');
            await axiosInstance.delete(`${API_BASE}${id}/`);
            setDocumentTypes((prev) => (Array.isArray(prev) ? prev.filter((d) => asString(d?.id) !== id) : []));
            showNotification('Document type deleted', 'success');
        } catch (error) {
            console.error('Failed to delete document type:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to delete document type', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type || 'success'}`}>
                    <span>{notification?.message || ''}</span>
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Document Types</h2>
                <p>Configure employee document types (no upload integration yet).</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={16} />
                        <h3>Configured Types</h3>
                    </div>
                    <div className="dts-toolbar">
                        <button className="settings-btn-secondary" type="button" onClick={loadDocumentTypes} disabled={loading || saving}>
                            <RefreshCcw size={16} />
                            Refresh
                        </button>
                        <button className="settings-btn-primary" type="button" onClick={openCreate} disabled={saving}>
                            <Plus size={16} />
                            Add Document Type
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    {loading ? (
                        <div className="dts-empty">Loading document types…</div>
                    ) : sorted?.length === 0 ? (
                        <div className="dts-empty">No document types configured yet.</div>
                    ) : (
                        <div className="dts-table-wrap">
                            <table className="dts-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '26%' }}>Document Name</th>
                                        <th>Description</th>
                                        <th style={{ width: '10%' }}>Required</th>
                                        <th style={{ width: '12%' }}>Status</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted?.map((d, idx) => (
                                        <tr key={d?.id || `${d?.name || ''}-${idx}`}>
                                            <td>{d?.name || ''}</td>
                                            <td className="dts-muted">{d?.description || ''}</td>
                                            <td>{d?.is_required ? 'Yes' : 'No'}</td>
                                            <td>
                                                <span className={`dts-badge ${d?.is_active ? 'active' : 'inactive'}`}>
                                                    {d?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="dts-actions">
                                                    <button
                                                        type="button"
                                                        className="dts-icon-btn"
                                                        title="Edit"
                                                        onClick={() => openEdit(d)}
                                                        disabled={saving}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="dts-icon-btn"
                                                        title="Delete"
                                                        onClick={() => remove(d)}
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

            <DocumentTypeModal
                open={modalOpen}
                initialValue={editing}
                onClose={closeModal}
                onSave={upsert}
                saving={saving}
            />
        </div>
    );
}

