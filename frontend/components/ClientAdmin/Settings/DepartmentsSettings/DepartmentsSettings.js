'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, RefreshCcw, Save, Pencil, Trash2 } from 'lucide-react';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from '@/api/api_clientadmin';

import './DepartmentsSettings.css';

const EMPTY_FORM = Object.freeze({
    name: '',
    code: '',
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

function normalizeDepartmentsResponse(response) {
    const raw = response?.data?.results ?? response?.data ?? [];
    if (Array.isArray(raw)) return raw;
    return [];
}

export default function DepartmentsSettings() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const [editingDepartment, setEditingDepartment] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const isEditing = Boolean(editingDepartment?.id);

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

    const loadDepartments = async () => {
        try {
            setLoading(true);
            const res = await getAllDepartments();
            setDepartments(normalizeDepartmentsResponse(res));
        } catch (error) {
            console.error('Failed to load departments:', error);
            setDepartments([]);
            showNotification(getApiErrorMessage(error) || 'Failed to load departments', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setEditingDepartment(null);
        setForm(EMPTY_FORM);
    };

    const startEdit = (department) => {
        setEditingDepartment(department || null);
        setForm({
            name: department?.name || '',
            code: department?.code || '',
            description: department?.description || '',
            is_active: department?.is_active ?? true,
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
            description: String(form?.description ?? '').trim(),
            is_active: Boolean(form?.is_active),
        };

        if (!payload.name) return showNotification('Name is required', 'error');
        if (!payload.code) return showNotification('Code is required', 'error');

        try {
            setSaving(true);
            if (isEditing) {
                await updateDepartment(editingDepartment.id, payload);
                showNotification('Department updated', 'success');
            } else {
                await createDepartment(payload);
                showNotification('Department created', 'success');
            }

            resetForm();
            await loadDepartments();
        } catch (error) {
            console.error('Failed to save department:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to save department', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (department) => {
        const id = department?.id;
        if (!id) return;

        const name = department?.name || 'this department';
        const ok = window.confirm(`Delete ${name}?`);
        if (!ok) return;

        try {
            await deleteDepartment(id);
            setDepartments((prev) => (Array.isArray(prev) ? prev.filter((d) => d?.id !== id) : []));
            if (editingDepartment?.id === id) resetForm();
            showNotification('Department deleted', 'success');
        } catch (error) {
            console.error('Failed to delete department:', error);
            showNotification(getApiErrorMessage(error) || 'Failed to delete department', 'error');
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
                <h2>Departments</h2>
                <p>Create, update, and manage departments.</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <Building2 size={16} />
                    <h3>{isEditing ? 'Edit Department' : 'Create Department'}</h3>
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
                                    placeholder="e.g. Human Resources"
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Code</label>
                                <input
                                    className="settings-input"
                                    value={form?.code || ''}
                                    onChange={onChange('code')}
                                    placeholder="e.g. HR"
                                />
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

                        <div className="settings-toggle-item wide">
                            <div className="toggle-info">
                                <span className="toggle-label">Active</span>
                                <span className="toggle-desc">Inactive departments are hidden in selection lists.</span>
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
                    <Building2 size={16} />
                    <h3>Department List</h3>
                </div>

                <div className="settings-card-body">
                    <div className="dept-settings-toolbar">
                        <button
                            className="settings-btn-secondary"
                            type="button"
                            onClick={loadDepartments}
                            disabled={loading}
                        >
                            <RefreshCcw size={16} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="dept-settings-empty">Loading departments…</div>
                    ) : sortedDepartments.length === 0 ? (
                        <div className="dept-settings-empty">No departments found.</div>
                    ) : (
                        <div className="dept-settings-table-wrap">
                            <table className="dept-settings-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '24%' }}>Name</th>
                                        <th style={{ width: '14%' }}>Code</th>
                                        <th>Description</th>
                                        <th style={{ width: '12%' }}>Status</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDepartments.map((dept) => (
                                        <tr key={dept?.id ?? `${dept?.code || ''}-${dept?.name || ''}`}>
                                            <td>{dept?.name || ''}</td>
                                            <td className="dept-settings-muted">{dept?.code || ''}</td>
                                            <td className="dept-settings-muted">
                                                {dept?.description || ''}
                                            </td>
                                            <td>
                                                <span className={`dept-settings-badge ${dept?.is_active ? 'active' : 'inactive'}`}>
                                                    {dept?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="dept-settings-actions">
                                                    <button
                                                        type="button"
                                                        className="dept-settings-icon-btn"
                                                        title="Edit"
                                                        onClick={() => startEdit(dept)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="dept-settings-icon-btn"
                                                        title="Delete"
                                                        onClick={() => handleDelete(dept)}
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

