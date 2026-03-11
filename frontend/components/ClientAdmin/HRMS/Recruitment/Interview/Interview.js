'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Check, Edit2, Eye, Plus, Trash2, X } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Interview.css';

const EMPTY_FORM = {
    candidate: '',
    job: '',
    interview_type: 'HR',
    interviewer_name: '',
    interview_date: '',
    interview_mode: 'ONLINE',
    location_or_link: '',
    status: 'SCHEDULED',
    result: 'PENDING',
    feedback: '',
};

const TYPE_LABELS = {
    HR: 'HR',
    TECHNICAL: 'Technical',
    MANAGERIAL: 'Managerial',
    FINAL: 'Final',
    PHONE_SCREEN: 'Phone Screen',
    VIDEO: 'Video',
    IN_PERSON: 'In-Person',
    BEHAVIORAL: 'Behavioral',
    PANEL: 'Panel',
    CASE_STUDY: 'Case Study',
};

const STATUS_LABELS = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    RESCHEDULED: 'Rescheduled',
    NO_SHOW: 'No Show',
};

const RESULT_LABELS = {
    PENDING: 'Pending',
    PASSED: 'Passed',
    FAILED: 'Failed',
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
};

const toDatetimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offsetMinutes = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
};

export default function Interview() {
    const [interviews, setInterviews] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState(null);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchInterviewData();
    }, []);

    const fetchInterviewData = async () => {
        setLoading(true);
        setError('');

        try {
            const [interviewsResponse, candidatesResponse] = await Promise.all([
                recruitmentApi.getInterviews({ page_size: 100 }),
                recruitmentApi.getCandidates({ page_size: 200 }),
            ]);

            setInterviews(interviewsResponse.data?.results || interviewsResponse.data?.data || []);
            setCandidates(candidatesResponse.data?.results || candidatesResponse.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load interviews.'));
        } finally {
            setLoading(false);
        }
    };

    const candidateById = useMemo(() => {
        const map = new Map();
        candidates.forEach((candidate) => map.set(String(candidate.id), candidate));
        return map;
    }, [candidates]);

    const openCreateModal = () => {
        setEditingInterview(null);
        setForm(EMPTY_FORM);
        setIsModalOpen(true);
        setError('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingInterview(null);
        setForm(EMPTY_FORM);
    };

    const closeViewModal = () => {
        setIsViewOpen(false);
        setSelectedInterview(null);
    };

    const handleCandidateChange = (candidateId) => {
        const candidate = candidateById.get(String(candidateId));
        const jobId = candidate?.job_applied || candidate?.job_applied_details?.id || '';
        setForm((current) => ({
            ...current,
            candidate: candidateId,
            job: jobId ? String(jobId) : current.job,
        }));
    };

    const validateForm = () => {
        if (!form.candidate) return 'Candidate is required.';
        if (!form.interviewer_name.trim()) return 'Interviewer name is required.';
        if (!form.interview_date) return 'Interview date & time is required.';

        const scheduled = new Date(form.interview_date);
        if (Number.isNaN(scheduled.getTime())) return 'Invalid interview date.';
        if (scheduled <= new Date()) return 'Interview date must be in the future.';

        return '';
    };

    const buildPayload = () => ({
        candidate: Number(form.candidate),
        job: form.job ? Number(form.job) : undefined,
        interview_type: form.interview_type,
        interviewer_name: form.interviewer_name.trim(),
        interview_date: form.interview_date,
        interview_mode: form.interview_mode,
        location_or_link: form.location_or_link || '',
        status: form.status,
        result: form.result,
        feedback: form.feedback || '',
    });

    const handleSave = async () => {
        const validationMessage = validateForm();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = buildPayload();
            const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

            if (editingInterview) {
                await recruitmentApi.updateInterview(editingInterview.id, cleanPayload);
            } else {
                await recruitmentApi.createInterview(cleanPayload);
            }

            closeModal();
            await fetchInterviewData();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save interview.'));
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = async (interviewId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getInterview(interviewId);
            const interview = response.data?.data || response.data;

            setEditingInterview(interview);
            setForm({
                candidate: String(interview.candidate || ''),
                job: String(interview.job || interview.job_opening || ''),
                interview_type: interview.interview_type || 'HR',
                interviewer_name: interview.interviewer_name || '',
                interview_date: toDatetimeLocalValue(interview.interview_date || interview.scheduled_date),
                interview_mode: interview.interview_mode || 'ONLINE',
                location_or_link: interview.location_or_link || interview.meeting_link || interview.location || '',
                status: interview.status || 'SCHEDULED',
                result: interview.result || 'PENDING',
                feedback: interview.feedback || '',
            });
            setIsModalOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load interview details.'));
        } finally {
            setSaving(false);
        }
    };

    const openViewModal = async (interviewId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getInterview(interviewId);
            const interview = response.data?.data || response.data;
            setSelectedInterview(interview);
            setIsViewOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load interview details.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (interview) => {
        const label = interview?.candidate_name ? `${interview.candidate_name} (${TYPE_LABELS[interview.interview_type] || interview.interview_type})` : 'this interview';
        if (!window.confirm(`Delete ${label}?`)) return;

        setSaving(true);
        setError('');

        try {
            await recruitmentApi.deleteInterview(interview.id);
            await fetchInterviewData();
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete interview.'));
        } finally {
            setSaving(false);
        }
    };

    const handleInlineStatusChange = async (interviewId, value) => {
        setSaving(true);
        setError('');
        try {
            await recruitmentApi.updateInterviewStatus(interviewId, value);
            await fetchInterviewData();
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Failed to update status.'));
        } finally {
            setSaving(false);
        }
    };

    const handleInlineResultChange = async (interviewId, value) => {
        setSaving(true);
        setError('');
        try {
            await recruitmentApi.updateInterviewResult(interviewId, value);
            await fetchInterviewData();
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Failed to update result.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="interview-zone">
            <header className="interview-zone__header">
                <div>
                    <span className="interview-zone__eyebrow">Recruitment</span>
                    <h2>Interviews</h2>
                    <p className="interview-zone__sub">Schedule and manage candidate interviews.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Schedule Interview
                </button>
            </header>

            {error && (
                <div className="interview-zone__alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <section className="interview-zone__table-card">
                {loading ? (
                    <div className="interview-zone__loading">Loading interviews...</div>
                ) : interviews.length === 0 ? (
                    <div className="interview-zone__empty">
                        <Calendar size={48} />
                        <p>No interviews scheduled yet.</p>
                    </div>
                ) : (
                    <div className="interview-zone__table-wrap">
                        <table className="interview-zone__table">
                            <thead>
                                <tr>
                                    <th>Candidate Name</th>
                                    <th>Job Title</th>
                                    <th>Interview Type</th>
                                    <th>Interviewer</th>
                                    <th>Interview Date</th>
                                    <th>Mode</th>
                                    <th>Status</th>
                                    <th>Result</th>
                                    <th className="interview-zone__actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interviews.map((interview) => (
                                    <tr key={interview.id}>
                                        <td>{interview.candidate_name || interview.candidate_details?.full_name || '-'}</td>
                                        <td>{interview.job_title || interview.job_opening_details?.title || '-'}</td>
                                        <td>{TYPE_LABELS[interview.interview_type] || interview.interview_type || '-'}</td>
                                        <td>{interview.interviewer || interview.interviewer_name || '-'}</td>
                                        <td>{formatDateTime(interview.interview_date || interview.scheduled_date)}</td>
                                        <td>{interview.interview_mode ? (interview.interview_mode === 'IN_PERSON' ? 'In-Person' : 'Online') : '-'}</td>
                                        <td>
                                            <select
                                                className="interview-zone__select"
                                                value={interview.status || 'SCHEDULED'}
                                                onChange={(event) => handleInlineStatusChange(interview.id, event.target.value)}
                                                disabled={saving}
                                                aria-label="Update status"
                                            >
                                                {Object.keys(STATUS_LABELS).map((key) => (
                                                    <option key={key} value={key}>
                                                        {STATUS_LABELS[key]}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="interview-zone__select"
                                                value={interview.result || 'PENDING'}
                                                onChange={(event) => handleInlineResultChange(interview.id, event.target.value)}
                                                disabled={saving}
                                                aria-label="Update result"
                                            >
                                                {Object.keys(RESULT_LABELS).map((key) => (
                                                    <option key={key} value={key}>
                                                        {RESULT_LABELS[key]}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="interview-zone__actions-cell">
                                            <div className="interview-zone__actions">
                                                <button
                                                    type="button"
                                                    className="interview-zone__icon-btn"
                                                    onClick={() => openViewModal(interview.id)}
                                                    title="View interview"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="interview-zone__icon-btn"
                                                    onClick={() => openEditModal(interview.id)}
                                                    title="Edit interview"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="interview-zone__icon-btn danger"
                                                    onClick={() => handleDelete(interview)}
                                                    title="Delete interview"
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
            </section>

            {isModalOpen && (
                <div className="interview-zone__modal-backdrop" onClick={closeModal}>
                    <div className="interview-zone__modal" onClick={(event) => event.stopPropagation()}>
                        <div className="interview-zone__modal-header">
                            <div>
                                <span className="interview-zone__eyebrow">{editingInterview ? 'Edit Interview' : 'Schedule Interview'}</span>
                                <h3>{editingInterview ? 'Update interview' : 'Schedule a new interview'}</h3>
                            </div>
                            <button type="button" className="interview-zone__icon-btn" onClick={closeModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="interview-zone__form-grid">
                            <label className="interview-zone__field interview-zone__field--full">
                                <span>Candidate</span>
                                <select value={form.candidate} onChange={(event) => handleCandidateChange(event.target.value)}>
                                    <option value="">Select candidate</option>
                                    {candidates.map((candidate) => (
                                        <option key={candidate.id} value={candidate.id}>
                                            {candidate.full_name} {candidate.email ? `(${candidate.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="interview-zone__field interview-zone__field--full">
                                <span>Job</span>
                                <input
                                    type="text"
                                    value={(() => {
                                        const candidate = candidateById.get(String(form.candidate));
                                        const jobTitle = candidate?.job_applied_details?.title;
                                        if (jobTitle) return jobTitle;
                                        return form.job ? `Job ID: ${form.job}` : 'Auto-filled from candidate';
                                    })()}
                                    readOnly
                                />
                            </label>

                            <label className="interview-zone__field">
                                <span>Interview Type</span>
                                <select
                                    value={form.interview_type}
                                    onChange={(event) => setForm((current) => ({ ...current, interview_type: event.target.value }))}
                                >
                                    <option value="HR">HR</option>
                                    <option value="TECHNICAL">Technical</option>
                                    <option value="MANAGERIAL">Managerial</option>
                                    <option value="FINAL">Final</option>
                                </select>
                            </label>

                            <label className="interview-zone__field">
                                <span>Interviewer Name</span>
                                <input
                                    type="text"
                                    value={form.interviewer_name}
                                    onChange={(event) => setForm((current) => ({ ...current, interviewer_name: event.target.value }))}
                                    placeholder="e.g. Priya Nair"
                                />
                            </label>

                            <label className="interview-zone__field">
                                <span>Interview Date &amp; Time</span>
                                <input
                                    type="datetime-local"
                                    value={form.interview_date}
                                    onChange={(event) => setForm((current) => ({ ...current, interview_date: event.target.value }))}
                                />
                            </label>

                            <label className="interview-zone__field">
                                <span>Interview Mode</span>
                                <select
                                    value={form.interview_mode}
                                    onChange={(event) => setForm((current) => ({ ...current, interview_mode: event.target.value }))}
                                >
                                    <option value="ONLINE">Online</option>
                                    <option value="IN_PERSON">In-Person</option>
                                </select>
                            </label>

                            <label className="interview-zone__field interview-zone__field--full">
                                <span>Location or Meeting Link</span>
                                <input
                                    type="text"
                                    value={form.location_or_link}
                                    onChange={(event) => setForm((current) => ({ ...current, location_or_link: event.target.value }))}
                                    placeholder={form.interview_mode === 'ONLINE' ? 'https://meet.google.com/...' : 'Conference Room A'}
                                />
                            </label>

                            <label className="interview-zone__field">
                                <span>Status</span>
                                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </label>

                            <label className="interview-zone__field">
                                <span>Result</span>
                                <select value={form.result} onChange={(event) => setForm((current) => ({ ...current, result: event.target.value }))}>
                                    <option value="PENDING">Pending</option>
                                    <option value="PASSED">Passed</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </label>

                            <label className="interview-zone__field interview-zone__field--full">
                                <span>Feedback (optional)</span>
                                <textarea
                                    rows={4}
                                    value={form.feedback}
                                    onChange={(event) => setForm((current) => ({ ...current, feedback: event.target.value }))}
                                    placeholder="Add notes about the interview..."
                                />
                            </label>
                        </div>

                        <div className="interview-zone__modal-footer">
                            <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : editingInterview ? 'Save Changes' : 'Schedule Interview'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isViewOpen && selectedInterview && (
                <div className="interview-zone__modal-backdrop" onClick={closeViewModal}>
                    <div className="interview-zone__modal interview-zone__modal--detail" onClick={(event) => event.stopPropagation()}>
                        <div className="interview-zone__modal-header">
                            <div>
                                <span className="interview-zone__eyebrow">Interview Details</span>
                                <h3>{selectedInterview.candidate_details?.full_name || selectedInterview.candidate_name || 'Interview'}</h3>
                            </div>
                            <button type="button" className="interview-zone__icon-btn" onClick={closeViewModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="interview-zone__detail-grid">
                            <div className="interview-zone__detail-item">
                                <span>Job</span>
                                <strong>{selectedInterview.job_opening_details?.title || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Type</span>
                                <strong>{TYPE_LABELS[selectedInterview.interview_type] || selectedInterview.interview_type || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Interviewer</span>
                                <strong>{selectedInterview.interviewer_name || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Date</span>
                                <strong>{formatDateTime(selectedInterview.interview_date || selectedInterview.scheduled_date)}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Mode</span>
                                <strong>{selectedInterview.interview_mode === 'IN_PERSON' ? 'In-Person' : 'Online'}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Status</span>
                                <strong>{STATUS_LABELS[selectedInterview.status] || selectedInterview.status || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item">
                                <span>Result</span>
                                <strong>{RESULT_LABELS[selectedInterview.result] || selectedInterview.result || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item interview-zone__detail-item--full">
                                <span>Location / Link</span>
                                <strong>{selectedInterview.location_or_link || selectedInterview.meeting_link || selectedInterview.location || '-'}</strong>
                            </div>
                            <div className="interview-zone__detail-item interview-zone__detail-item--full">
                                <span>Feedback</span>
                                <p>{selectedInterview.feedback || 'No feedback added yet.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
