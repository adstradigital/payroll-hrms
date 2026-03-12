'use client';

import React, { useEffect, useState } from 'react';
import {
    GripVertical,
    Edit2,
    Trash2,
    Plus,
    Check,
    X,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Stages.css';

const EMPTY_FORM = { name: '' };

const reorderStages = (items, draggedId, targetId) => {
    const current = [...items];
    const fromIndex = current.findIndex((item) => item.id === draggedId);
    const toIndex = current.findIndex((item) => item.id === targetId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return items;
    }

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);

    return current.map((stage, index) => ({
        ...stage,
        sequence: index + 1,
    }));
};

const getStageTone = (stage, index) => {
    const normalizedName = stage.name.toLowerCase();

    if (normalizedName.includes('reject')) return 'danger';
    if (normalizedName.includes('hire')) return 'success';
    if (normalizedName.includes('offer')) return 'emerald';
    if (normalizedName.includes('screen')) return 'info';
    if (normalizedName.includes('technical')) return 'violet';
    if (normalizedName.includes('cultural')) return 'indigo';

    const tones = ['slate', 'info', 'violet', 'indigo', 'emerald', 'success', 'danger'];
    return tones[index % tones.length];
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || fallback;
};

export default function Stages() {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [draggedStageId, setDraggedStageId] = useState(null);
    const [dropTargetStageId, setDropTargetStageId] = useState(null);

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await recruitmentApi.getStages();
            setStages(response.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load recruitment stages.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingStage(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
        setError('');
    };

    const openEditModal = (stage) => {
        setEditingStage(stage);
        setForm({ name: stage.name });
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStage(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError('Stage name is required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (editingStage) {
                const response = await recruitmentApi.updateStage(editingStage.id, { name: form.name.trim() });
                setStages((current) =>
                    current.map((stage) => (stage.id === editingStage.id ? response.data.data : stage))
                );
            } else {
                const response = await recruitmentApi.createStage({ name: form.name.trim() });
                setStages(response.data?.data || []);
            }

            closeModal();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save recruitment stage.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (stage) => {
        if (stage.is_system) return;
        if (!window.confirm(`Delete "${stage.name}" from the recruitment pipeline?`)) return;

        setError('');

        try {
            const response = await recruitmentApi.deleteStage(stage.id);
            setStages(response.data?.data || []);
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete recruitment stage.'));
        }
    };

    const handleDragStart = (event, stageId) => {
        setDraggedStageId(stageId);
        setDropTargetStageId(null);

        // Firefox requires dataTransfer to be set for DnD to work reliably.
        try {
            event.dataTransfer.setData('text/plain', String(stageId));
            event.dataTransfer.effectAllowed = 'move';
        } catch {
            // Ignore (some environments may block dataTransfer writes).
        }
    };

    const handleDragOver = (event, stageId) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        if (stageId !== dropTargetStageId) setDropTargetStageId(stageId);
    };

    const clearDragState = () => {
        setDraggedStageId(null);
        setDropTargetStageId(null);
    };

    const handleDrop = async (event, targetStageId) => {
        event.preventDefault();

        const rawDragged = (() => {
            try {
                return event.dataTransfer?.getData('text/plain');
            } catch {
                return '';
            }
        })();

        const resolvedDraggedId = rawDragged ? Number(rawDragged) : draggedStageId;

        if (!resolvedDraggedId || resolvedDraggedId === targetStageId) {
            clearDragState();
            return;
        }

        const previousStages = stages;
        const nextStages = reorderStages(stages, resolvedDraggedId, targetStageId);
        setStages(nextStages);
        clearDragState();

        try {
            const response = await recruitmentApi.reorderStages(nextStages.map((stage) => stage.id));
            if (response?.data?.data) setStages(response.data.data);
        } catch (reorderError) {
            setStages(previousStages);
            setError(getErrorMessage(reorderError, 'Failed to reorder recruitment stages.'));
        }
    };

    return (
        <div className="stages-page">
            <section className="stages-hero">
                <div>
                    <span className="stages-eyebrow">Recruitment Pipeline</span>
                    <h2>Stages Management</h2>
                    <p>Control the hiring flow, protect system milestones, and keep your ATS pipeline ordered.</p>
                </div>

                <div className="stages-hero__actions">
                    <button className="stages-btn stages-btn--ghost" onClick={fetchStages} disabled={loading}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button className="stages-btn stages-btn--primary" onClick={openCreateModal}>
                        <Plus size={16} />
                        Add New Stage
                    </button>
                </div>
            </section>

            {error && (
                <div className="stages-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="stages-layout">
                <section className="stages-panel stages-panel--list">
                    <div className="stages-panel__header">
                        <div>
                            <h3>Stage Order</h3>
                            <p>Drag rows to reorder the recruitment sequence.</p>
                        </div>
                        <span className="stages-count">{stages.length} stages</span>
                    </div>

                    <div className="stages-list">
                        {loading ? (
                            <div className="stages-empty">Loading recruitment stages...</div>
                        ) : stages.length === 0 ? (
                            <div className="stages-empty">No stages found.</div>
                        ) : (
                            stages.map((stage, index) => {
                                const tone = getStageTone(stage, index);

                                return (
                                    <div
                                        key={stage.id}
                                        className={[
                                            'stage-row',
                                            draggedStageId === stage.id ? 'is-dragging' : '',
                                            dropTargetStageId === stage.id && draggedStageId !== stage.id ? 'is-drop-target' : '',
                                        ].join(' ')}
                                        onDragOver={(event) => handleDragOver(event, stage.id)}
                                        onDrop={(event) => handleDrop(event, stage.id)}
                                    >
                                        <div className="stage-row__drag" title="Drag to reorder">
                                            <span
                                                className="stage-row__drag-handle"
                                                draggable
                                                onDragStart={(event) => handleDragStart(event, stage.id)}
                                                onDragEnd={clearDragState}
                                                aria-label={`Drag ${stage.name} to reorder`}
                                            >
                                                <GripVertical size={18} />
                                            </span>
                                        </div>

                                        <div className={`stage-row__number stage-row__number--${tone}`}>
                                            {index + 1}
                                        </div>

                                        <div className="stage-row__content">
                                            <div className="stage-row__title-wrap">
                                                <h4>{stage.name}</h4>
                                                <span className={`stage-pill ${stage.is_system ? 'system' : 'custom'}`}>
                                                    {stage.is_system ? 'System Stage' : 'Custom Stage'}
                                                </span>
                                            </div>
                                            <p>Sequence #{stage.sequence}</p>
                                        </div>

                                        <div className="stage-row__actions">
                                            <button
                                                className="stage-icon-btn"
                                                type="button"
                                                title={stage.is_system ? 'System stages cannot be edited' : 'Edit stage'}
                                                onClick={() => openEditModal(stage)}
                                                disabled={stage.is_system}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="stage-icon-btn danger"
                                                type="button"
                                                title={stage.is_system ? 'System stages cannot be deleted' : 'Delete stage'}
                                                onClick={() => handleDelete(stage)}
                                                disabled={stage.is_system}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <aside className="stages-panel stages-panel--preview">
                    <div className="stages-panel__header">
                        <div>
                            <h3>Pipeline Preview</h3>
                            <p>Preview updates immediately as the stage order changes.</p>
                        </div>
                    </div>

                    <div className="pipeline-preview">
                        {stages.map((stage, index) => {
                            const tone = getStageTone(stage, index);
                            const isLast = index === stages.length - 1;

                            return (
                                <React.Fragment key={stage.id}>
                                    <div className={`preview-card preview-card--${tone}`}>
                                        <span className="preview-card__step">Step {index + 1}</span>
                                        <strong>{stage.name}</strong>
                                        <span>{stage.is_system ? 'System milestone' : 'Custom checkpoint'}</span>
                                    </div>
                                    {!isLast && <div className="preview-line" />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </aside>
            </div>

            {isModalOpen && (
                <div className="stages-modal-backdrop" onClick={closeModal}>
                    <div className="stages-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="stages-modal__header">
                            <div>
                                <span className="stages-eyebrow">{editingStage ? 'Edit Stage' : 'New Stage'}</span>
                                <h3>{editingStage ? 'Update recruitment stage' : 'Add recruitment stage'}</h3>
                            </div>
                            <button className="stage-icon-btn" type="button" onClick={closeModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <label className="stages-field">
                            <span>Stage name</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(event) => setForm({ name: event.target.value })}
                                placeholder="e.g. Panel Interview"
                            />
                        </label>

                        <div className="stages-modal__footer">
                            <button className="stages-btn stages-btn--ghost" type="button" onClick={closeModal}>
                                Cancel
                            </button>
                            <button className="stages-btn stages-btn--primary" type="button" onClick={handleSave} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : editingStage ? 'Save Changes' : 'Create Stage'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
