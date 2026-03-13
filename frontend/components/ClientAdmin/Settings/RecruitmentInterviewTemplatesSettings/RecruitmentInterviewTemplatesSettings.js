'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle, ClipboardList } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitmentInterviewTemplatesSettings.css';

const QUESTION_TYPES = [
    { value: 'RATING', label: 'Rating (1-5)' },
    { value: 'TEXT', label: 'Text' },
    { value: 'YES_NO', label: 'Yes/No' },
    { value: 'DROPDOWN', label: 'Dropdown' },
];

const emptyQuestion = () => ({
    question_text: '',
    question_type: 'TEXT',
});

const EMPTY_FORM = {
    name: '',
    description: '',
    questions: [emptyQuestion()],
};

const formatDate = (value) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return '-';
    }
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || error?.response?.data?.error || fallback;
};

export default function RecruitmentInterviewTemplatesSettings() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchTemplates = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await recruitmentApi.getInterviewTemplates();
            setTemplates(res.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load interview templates.'));
        } finally {
            setLoading(false);
        }
    };

    const sortedTemplates = useMemo(() => {
        return [...templates].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [templates]);

    const openCreateModal = () => {
        setEditingTemplate(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
        setError('');
    };

    const openEditModal = (template) => {
        setEditingTemplate(template);
        setForm({
            name: template.name || '',
            description: template.description || '',
            questions:
                Array.isArray(template.questions) && template.questions.length > 0
                    ? template.questions
                          .slice()
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((q) => ({
                              question_text: q.question_text || '',
                              question_type: (q.question_type || 'TEXT').toUpperCase(),
                          }))
                    : [emptyQuestion()],
        });
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
        setForm(EMPTY_FORM);
    };

    const updateQuestion = (index, patch) => {
        setForm((current) => ({
            ...current,
            questions: current.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
        }));
    };

    const addQuestion = () => {
        setForm((current) => ({
            ...current,
            questions: [...current.questions, emptyQuestion()],
        }));
    };

    const removeQuestion = (index) => {
        setForm((current) => {
            const next = current.questions.filter((_, i) => i !== index);
            return {
                ...current,
                questions: next.length > 0 ? next : [emptyQuestion()],
            };
        });
    };

    const buildPayload = () => {
        const name = (form.name || '').trim();
        const description = (form.description || '').trim();

        const questions = (form.questions || []).map((q, idx) => ({
            question_text: (q.question_text || '').trim(),
            question_type: (q.question_type || 'TEXT').toUpperCase(),
            order: idx + 1,
        }));

        return { name, description, questions };
    };

    const validate = (payload) => {
        if (!payload.name) return 'Template name is required.';
        if (!Array.isArray(payload.questions) || payload.questions.length === 0) return 'At least one question is required.';
        const emptyIdx = payload.questions.findIndex((q) => !q.question_text);
        if (emptyIdx !== -1) return `Question ${emptyIdx + 1} text is required.`;
        return '';
    };

    const handleSave = async () => {
        const payload = buildPayload();
        const validationMessage = validate(payload);
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (editingTemplate) {
                await recruitmentApi.updateInterviewTemplate(editingTemplate.id, payload);
                showNotification('Template updated', 'success');
            } else {
                await recruitmentApi.createInterviewTemplate(payload);
                showNotification('Template created', 'success');
            }

            closeModal();
            await fetchTemplates();
        } catch (saveError) {
            const message = getErrorMessage(saveError, 'Failed to save template.');
            setError(message);
            showNotification(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm(`Delete "${template.name}" template?`)) return;

        setSaving(true);
        setError('');
        try {
            await recruitmentApi.deleteInterviewTemplate(template.id);
            showNotification('Template deleted', 'success');
            await fetchTemplates();
        } catch (deleteError) {
            const message = getErrorMessage(deleteError, 'Failed to delete template.');
            setError(message);
            showNotification(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading templates...</div>;
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
                <h2>Interview Templates</h2>
                <p>Create reusable interview evaluation templates with structured questions.</p>
            </div>

            {error && (
                <div className="rit-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="settings-card">
                <div className="settings-card-header">
                    <ClipboardList size={18} />
                    <h3>Templates</h3>
                    <div className="rit-header-actions">
                        <button className="settings-btn-primary" type="button" onClick={openCreateModal} disabled={saving}>
                            <Plus size={16} />
                            Create Template
                        </button>
                    </div>
                </div>

                <div className="settings-card-body">
                    <div className="rit-table-wrap">
                        <table className="rit-table">
                            <thead>
                                <tr>
                                    <th>Template Name</th>
                                    <th>Number of Questions</th>
                                    <th>Created Date</th>
                                    <th className="rit-actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTemplates.map((template) => (
                                    <tr key={template.id}>
                                        <td>
                                            <div className="rit-name">
                                                <strong>{template.name}</strong>
                                                {template.description ? (
                                                    <span className="rit-desc">{template.description}</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>{template.questions_count ?? (template.questions?.length || 0)}</td>
                                        <td>{formatDate(template.created_at)}</td>
                                        <td className="rit-actions-col">
                                            <button
                                                type="button"
                                                className="rit-icon-btn"
                                                onClick={() => openEditModal(template)}
                                                title="Edit template"
                                                disabled={saving}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="rit-icon-btn danger"
                                                onClick={() => handleDelete(template)}
                                                title="Delete template"
                                                disabled={saving}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedTemplates.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="rit-empty">
                                            No templates yet. Create your first interview template.
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
                    <div className="settings-modal rit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h3>{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                            <button className="modal-close" type="button" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="settings-modal-body">
                            <div className="settings-field-group">
                                <label className="settings-label">Template Name</label>
                                <input
                                    className="settings-input"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Technical Round"
                                    disabled={saving}
                                />
                            </div>

                            <div className="settings-field-group">
                                <label className="settings-label">Description</label>
                                <textarea
                                    className="settings-textarea"
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional context for interviewers"
                                    disabled={saving}
                                />
                            </div>

                            <div className="rit-questions">
                                <div className="rit-questions-header">
                                    <div>
                                        <h4>Questions</h4>
                                        <p>Add multiple questions to collect structured feedback.</p>
                                    </div>
                                    <button className="settings-btn-secondary" type="button" onClick={addQuestion} disabled={saving}>
                                        <Plus size={16} />
                                        Add Question
                                    </button>
                                </div>

                                {form.questions.map((q, index) => (
                                    <div key={index} className="rit-question-card">
                                        <div className="rit-question-head">
                                            <strong>Question {index + 1}</strong>
                                            <button
                                                type="button"
                                                className="rit-remove"
                                                onClick={() => removeQuestion(index)}
                                                disabled={saving}
                                                title="Remove question"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="settings-field-group">
                                            <label className="settings-label">Question Text</label>
                                            <input
                                                className="settings-input"
                                                type="text"
                                                value={q.question_text}
                                                onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                                                placeholder="e.g. Rate the candidate's problem-solving"
                                                disabled={saving}
                                            />
                                        </div>

                                        <div className="settings-field-group">
                                            <label className="settings-label">Question Type</label>
                                            <select
                                                className="settings-select"
                                                value={q.question_type}
                                                onChange={(e) => updateQuestion(index, { question_type: e.target.value })}
                                                disabled={saving}
                                            >
                                                {QUESTION_TYPES.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="settings-modal-footer">
                            <button className="settings-btn-secondary" type="button" onClick={closeModal} disabled={saving}>
                                Cancel
                            </button>
                            <button className="settings-btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

