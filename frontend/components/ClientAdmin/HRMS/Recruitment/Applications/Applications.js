'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Applications.css';

const STATUS_OPTIONS = [
    { value: 'APPLIED', label: 'Applied' },
    { value: 'SCREENING', label: 'Screening' },
    { value: 'INTERVIEW', label: 'Interview' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'HIRED', label: 'Hired' },
    { value: 'REJECTED', label: 'Rejected' },
];

const SOURCE_OPTIONS = [
    { value: 'LINKEDIN', label: 'LinkedIn' },
    { value: 'WEBSITE', label: 'Website' },
    { value: 'REFERRAL', label: 'Referral' },
];

const EMPTY_FORM = {
    candidate: '',
    job_opening: '',
    stage: '',
    status: 'APPLIED',
    source: 'WEBSITE',
    notes: '',
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
};

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create | edit | view
    const [selectedApp, setSelectedApp] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [appsRes, candRes, jobsRes, stagesRes] = await Promise.all([
                recruitmentApi.getApplications({ page_size: 100 }),
                recruitmentApi.getCandidates({ page_size: 100 }),
                recruitmentApi.getJobs({ page_size: 100 }),
                recruitmentApi.getStages(),
            ]);

            setApplications(appsRes.data?.results || appsRes.data?.data || appsRes.data || []);
            setCandidates(candRes.data?.results || candRes.data?.data || candRes.data || []);
            setJobs(jobsRes.data?.results || jobsRes.data?.data || jobsRes.data || []);
            setStages(stagesRes.data?.data || stagesRes.data?.results || stagesRes.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load applications.');
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = useMemo(() => applications, [applications]);

    const openCreate = () => {
        setModalMode('create');
        setForm({ ...EMPTY_FORM, status: 'APPLIED', source: 'WEBSITE' });
        setSelectedApp(null);
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (app) => {
        setModalMode('edit');
        setSelectedApp(app);
        setForm({
            candidate: app.candidate || '',
            job_opening: app.job_opening || '',
            stage: app.stage || '',
            status: app.status || 'APPLIED',
            source: app.source || 'WEBSITE',
            notes: app.notes || '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const openView = (app) => {
        setModalMode('view');
        setSelectedApp(app);
        setForm({
            candidate: app.candidate || '',
            job_opening: app.job_opening || '',
            stage: app.stage || '',
            status: app.status || 'APPLIED',
            source: app.source || 'WEBSITE',
            notes: app.notes || '',
        });
        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedApp(null);
    };

    const handleSave = async () => {
        if (!form.candidate || !form.job_opening) {
            setFormError('Candidate and Job are required.');
            return;
        }
        setSaving(true);
        setFormError('');
        const payload = {
            candidate: form.candidate,
            job_opening: form.job_opening,
            stage: form.stage || null,
            status: form.status,
            source: form.source,
            notes: form.notes,
        };
        try {
            if (modalMode === 'edit' && selectedApp) {
                await recruitmentApi.updateApplication(selectedApp.id, payload);
            } else {
                await recruitmentApi.createApplication(payload);
            }
            await fetchAll();
            closeModal();
        } catch (err) {
            setFormError(err?.response?.data?.message || 'Unable to save application.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (app) => {
        if (!window.confirm('Delete this application?')) return;
        try {
            await recruitmentApi.deleteApplication(app.id);
            setApplications((prev) => prev.filter((item) => item.id !== app.id));
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete application.');
        }
    };

    const getCandidateName = (app) =>
        app.candidate_details?.full_name || app.candidate_name || app.candidate || '-';

    const getJobTitle = (app) =>
        app.job_opening_details?.title || app.job_title || app.job_opening || '-';

    const getStageName = (app) => app.stage_details?.name || app.stage_name || app.current_stage || '-';

    return (
        <div className="applications">
            <div className="applications-header">
                <div>
                    <p className="eyebrow">Applications</p>
                    <h2>Track every candidate in one place</h2>
                    <p className="muted">Monitor pipeline stages, sources, and move candidates forward.</p>
                </div>
                <button className="apps-btn apps-btn--primary" onClick={openCreate}>
                    <Plus size={16} /> Add Application
                </button>
            </div>

            {error && (
                <div className="apps-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="applications-table-wrap">
                <table className="applications-table">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Job Title</th>
                            <th>Stage</th>
                            <th>Status</th>
                            <th>Source</th>
                            <th>Applied</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="apps-empty">
                                    <Loader2 size={16} className="spin" /> Loading applications...
                                </td>
                            </tr>
                        ) : filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="apps-empty">
                                    No applications found.
                                </td>
                            </tr>
                        ) : (
                            filteredApplications.map((app) => (
                                <tr key={app.id}>
                                    <td>{getCandidateName(app)}</td>
                                    <td>{getJobTitle(app)}</td>
                                    <td>{getStageName(app)}</td>
                                    <td>{STATUS_OPTIONS.find((s) => s.value === app.status)?.label || app.status}</td>
                                    <td>{SOURCE_OPTIONS.find((s) => s.value === app.source)?.label || app.source}</td>
                                    <td>{formatDate(app.applied_date)}</td>
                                    <td>
                                        <div className="apps-actions">
                                            <button className="apps-chip" onClick={() => openView(app)}>
                                                <Eye size={14} /> View
                                            </button>
                                            <button className="apps-chip" onClick={() => openEdit(app)}>
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button className="apps-chip danger" onClick={() => handleDelete(app)}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="apps-modal-backdrop" onClick={closeModal}>
                    <div className="apps-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="apps-modal__header">
                            <div>
                                <p className="eyebrow">
                                    {modalMode === 'view' ? 'View Application' : modalMode === 'edit' ? 'Edit Application' : 'New Application'}
                                </p>
                                <h3>
                                    {modalMode === 'view'
                                        ? getCandidateName(selectedApp || {}) || 'Application'
                                        : 'Application Form'}
                                </h3>
                            </div>
                            <button className="apps-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <div className="apps-modal__body">
                            <div className="form-grid">
                                <label>
                                    Candidate<span className="required">*</span>
                                    <select
                                        value={form.candidate}
                                        onChange={(e) => setForm({ ...form, candidate: e.target.value })}
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="">Select candidate</option>
                                        {candidates.map((cand) => (
                                            <option key={cand.id} value={cand.id}>
                                                {cand.full_name || cand.email}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Job<span className="required">*</span>
                                    <select
                                        value={form.job_opening}
                                        onChange={(e) => setForm({ ...form, job_opening: e.target.value })}
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="">Select job</option>
                                        {jobs.map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Stage
                                    <select
                                        value={form.stage}
                                        onChange={(e) => setForm({ ...form, stage: e.target.value })}
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="">Select stage</option>
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Status
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        disabled={modalMode === 'view'}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Source
                                    <select
                                        value={form.source}
                                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                                        disabled={modalMode === 'view'}
                                    >
                                        {SOURCE_OPTIONS.map((source) => (
                                            <option key={source.value} value={source.value}>
                                                {source.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label>
                                Notes
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    disabled={modalMode === 'view'}
                                    placeholder="Add context or interview notes..."
                                />
                            </label>

                            {formError && <div className="apps-form-error">{formError}</div>}
                        </div>

                        {modalMode !== 'view' && (
                            <div className="apps-modal__footer">
                                <button className="apps-btn apps-btn--ghost" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="apps-btn apps-btn--primary" onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 size={16} className="spin" /> Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
