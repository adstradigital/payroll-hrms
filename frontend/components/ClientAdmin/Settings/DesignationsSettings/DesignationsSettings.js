'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, RefreshCcw, Save, Pencil, Trash2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';

import './DesignationsSettings.css';

const EMPTY_FORM = Object.freeze({
    name: '',
    code: '',
    department: '',
    description: '',
    is_active: true,
});

function getApiErrorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (detail) return String(detail);
    const message = error?.message;
    if (message) return String(message);
    return 'Something went wrong';
}

function normalizeListResponse(response) {
    const raw = response?.data?.results ?? response?.data ?? [];
    return Array.isArray(raw) ? raw : [];
}

function toDepartmentId(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return String(value?.id ?? '');
    return String(value);
}

function toApiDepartmentValue(value) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    if (/^\d+$/.test(text)) return Number(text);
    return text;
}

export default function DesignationsSettings() {
    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const [editingDesignation, setEditingDesignation] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const isEditing = Boolean(editingDesignation?.id);

    const departmentsById = useMemo(() => {
        const map = new Map();
        for (const d of Array.isArray(departments) ? departments : []) {
            if (d?.id !== undefined && d?.id !== null) map.set(String(d.id), d);
        }
        return map;
    }, [departments]);

    const sortedDesignations = useMemo(() => {
        const list = Array.isArray(designations) ? designations : [];
        return [...list].sort((a, b) =>
            String(a?.name ?? '').localeCompare(String(b?.name ?? ''), undefined, { sensitivity: 'base' })
        );
    }, [designations]);

    const sortedDepartments = useMemo(() => {
        const list = Array.isArray(departments) ? departments : [];
        return [...list].sort((a, b) =>
            String(a?.name ?? '').localeCompare(String(b?.name ?? ''), undefined, { sensitivity: 'base' })
        );
    }, [departments]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [desigRes, deptRes] = await Promise.all([
                axiosInstance.get(CLIENTADMIN_ENDPOINTS.DESIGNATIONS),
                axiosInstance.get(CLIENTADMIN_ENDPOINTS.DEPARTMENTS),
            ]);
            setDesignations(normalizeListResponse(desigRes));
            setDepartments(normalizeListResponse(deptRes));
        } catch (error) {
            console.error('Failed to load designations/departments:', error);
            setDesignations([]);
            setDepartments([]);
            showNotification(getApiErrorMessage(error) || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setEditingDesignation(null);
        setForm(EMPTY_FORM);
    };

    const startEdit = (designation) => {
        setEditingDesignation(designation || null);
        setForm({
            name: designation?.name || '',
            code: designation?.code || '',
            department: toDepartmentId(designation?.department),
            description: designation?.description || '',
            is_active: designation?.is_active ?? true,
        });
    };

    const onChange = (key) => (e) => {
        const value = e?.target?.type === 'checkbox' ? Boolean(e?.target?.checked) : (e?.target?.value ?? '');
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: String(form?.name ?? '').trim(),
            code: String(form?.code ?? '').trim(),
            department: toApiDepartmentValue(form?.department),
            description: String(form?.description ?? '').trim(),
            is_active: Boolean(form?.is_active),
        };

        if (!payload.name) return showNotification('Name is required', 'error');
        if (!payload.code) return showNotification('Code is required', 'error');
        if (!payload.department) return showNotification('Department is required', 'error');

        try {
            setSaving(true);
            if (isEditing) {
                await axiosInstance.put(CLIENTADMIN_ENDPOINTS.DESIGNATION_DETAIL(editingDesignation.id), payload);
                showNotification('Designation updated', 'success');
            } else {
                await axiosInstance.post(CLIENTADMIN_ENDPOINTS.DESIGNATIONS, payload);
                showNotification('Designation created', 'success');
            }

            resetForm();
            const res = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.DESIGNATIONS);
            setDesignations(normalizeListResponse(res));
        } catch (error) {
            console.error('Failed to save designation:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to save designation', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (designation) => {
        const id = designation?.id;
        if (!id) return;

        const name = designation?.name || 'this designation';
        const ok = window.confirm(`Delete ${name}?`);
        if (!ok) return;

        try {
            await axiosInstance.delete(CLIENTADMIN_ENDPOINTS.DESIGNATION_DETAIL(id));
            setDesignations((prev) => (Array.isArray(prev) ? prev.filter((d) => d?.id !== id) : []));
            if (editingDesignation?.id === id) resetForm();
            showNotification('Designation deleted', 'success');
        } catch (error) {
            console.error('Failed to delete designation:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to delete designation', 'error');
        }
    };

    const resolveDepartmentName = (designation) => {
        const embeddedName = designation?.department?.name;
        if (embeddedName) return String(embeddedName);
        const depId = toDepartmentId(designation?.department);
        return departmentsById.get(depId)?.name || '';
    };

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type || 'success'}`}>
                    <span>{notification?.message || ''}</span>
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Designations</h2>
                <p>Create, update, and manage designations.</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <Briefcase size={16} />
                    <h3>{isEditing ? 'Edit Designation' : 'Create Designation'}</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="settings-card-body">
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Name</label>
                                <input
                                    className="settings-input"
                                    value={form?.name || ''}
                                    onChange={onChange('name')}
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Code</label>
                                <input
                                    className="settings-input"
                                    value={form?.code || ''}
                                    onChange={onChange('code')}
                                    placeholder="e.g. SE"
                                />
                            </div>
                        </div>

                        <div className="settings-field-group">
                            <label className="settings-label">Department</label>
                            <select
                                className="settings-select"
                                value={form?.department || ''}
                                onChange={onChange('department')}
                            >
                                <option value="">Select department</option>
                                {sortedDepartments.map((dept) => (
                                    <option key={dept?.id ?? `${dept?.code || ''}-${dept?.name || ''}`} value={String(dept?.id ?? '')}>
                                        {dept?.name || ''}{dept?.code ? ` (${dept?.code})` : ''}
                                    </option>
                                ))}
                            </select>
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

                        <div className="settings-toggle-item wide">
                            <div className="toggle-info">
                                <span className="toggle-label">Active</span>
                                <span className="toggle-desc">Inactive designations are hidden in selection lists.</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form?.is_active)}
                                    onChange={onChange('is_active')}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    <div className="settings-card-footer">
                        <button className="settings-btn-primary" type="submit" disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                        </button>
                        {isEditing && (
                            <button className="settings-btn-secondary" type="button" onClick={resetForm} disabled={saving}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <Briefcase size={16} />
                    <h3>Designation List</h3>
                </div>

                <div className="settings-card-body">
                    <div className="desig-settings-toolbar">
                        <button
                            className="settings-btn-secondary"
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                        >
                            <RefreshCcw size={16} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="desig-settings-empty">Loading designations…</div>
                    ) : sortedDesignations.length === 0 ? (
                        <div className="desig-settings-empty">No designations found.</div>
                    ) : (
                        <div className="desig-settings-table-wrap">
                            <table className="desig-settings-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '22%' }}>Name</th>
                                        <th style={{ width: '12%' }}>Code</th>
                                        <th style={{ width: '22%' }}>Department</th>
                                        <th>Description</th>
                                        <th style={{ width: '12%' }}>Status</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDesignations.map((desig) => (
                                        <tr key={desig?.id ?? `${desig?.code || ''}-${desig?.name || ''}`}>
                                            <td>{desig?.name || ''}</td>
                                            <td className="desig-settings-muted">{desig?.code || ''}</td>
                                            <td className="desig-settings-muted">{resolveDepartmentName(desig) || ''}</td>
                                            <td className="desig-settings-muted">{desig?.description || ''}</td>
                                            <td>
                                                <span className={`desig-settings-badge ${desig?.is_active ? 'active' : 'inactive'}`}>
                                                    {desig?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="desig-settings-actions">
                                                    <button
                                                        type="button"
                                                        className="desig-settings-icon-btn"
                                                        title="Edit"
                                                        onClick={() => startEdit(desig)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="desig-settings-icon-btn"
                                                        title="Delete"
                                                        onClick={() => handleDelete(desig)}
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
        </div>
    );
}

