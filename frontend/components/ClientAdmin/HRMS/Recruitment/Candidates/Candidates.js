'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Briefcase,
    Check,
    Edit2,
    Eye,
    FileText,
    Plus,
    Search,
    Trash2,
    UserRound,
    Workflow,
    X,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Candidates.css';

const EMPTY_CANDIDATE_FORM = {
    full_name: '',
    email: '',
    phone: '',
    job_applied: '',
    skill_ids: [],
    experience: '',
    notes: '',
    resume: null,
    resume_name: '',
    resume_url: '',
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || fallback;
};

const splitFullName = (fullName) => {
    const value = (fullName || '').trim();
    if (!value) {
        return { first_name: '', last_name: '' };
    }

    const parts = value.split(/\s+/);
    return {
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '-',
    };
};

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
};

const getExperienceLabel = (candidate) =>
    candidate.experience_display ||
    candidate.experience ||
    (candidate.total_experience_years ? `${candidate.total_experience_years} years` : '-');

const getLifecycleStatus = (candidate) => {
    if (candidate.status === 'HIRED') return { label: 'Hired', tone: 'hired' };
    if (candidate.status === 'REJECTED') return { label: 'Rejected', tone: 'rejected' };
    return { label: 'Active', tone: 'active' };
};

export default function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [stages, setStages] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [editingCandidate, setEditingCandidate] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [candidateForm, setCandidateForm] = useState(EMPTY_CANDIDATE_FORM);

    useEffect(() => {
        fetchCandidatesData();
    }, []);

    const fetchCandidatesData = async () => {
        setLoading(true);
        setError('');

        try {
            const [candidatesResponse, stagesResponse, jobsResponse, skillsResponse] = await Promise.all([
                recruitmentApi.getCandidates({ page_size: 100 }),
                recruitmentApi.getStages(),
                recruitmentApi.getJobs({ page_size: 100 }),
                recruitmentApi.getSkills(),
            ]);

            setCandidates(candidatesResponse.data?.results || []);
            setStages(stagesResponse.data?.data || []);
            setJobs(jobsResponse.data?.results || []);
            setSkills(skillsResponse.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load candidates.'));
        } finally {
            setLoading(false);
        }
    };

    const groupedSkills = useMemo(() => {
        const groups = new Map();

        skills.forEach((skill) => {
            const categoryName = skill.category_details?.name || 'Other Skills';
            if (!groups.has(categoryName)) {
                groups.set(categoryName, []);
            }
            groups.get(categoryName).push(skill);
        });

        return Array.from(groups.entries());
    }, [skills]);

    const filteredCandidates = useMemo(
        () =>
            candidates.filter((candidate) => {
                const query = searchTerm.toLowerCase();
                const lifecycle = getLifecycleStatus(candidate);
                const matchesSearch =
                    (candidate.full_name || '').toLowerCase().includes(query) ||
                    (candidate.email || '').toLowerCase().includes(query) ||
                    (candidate.phone || '').toLowerCase().includes(query) ||
                    (candidate.job_applied_details?.title || '').toLowerCase().includes(query);
                const matchesStage =
                    stageFilter === 'all' || String(candidate.stage || candidate.current_stage_details?.id) === stageFilter;
                const matchesStatus = statusFilter === 'all' || lifecycle.label.toLowerCase() === statusFilter;

                return matchesSearch && matchesStage && matchesStatus;
            }),
        [candidates, searchTerm, stageFilter, statusFilter]
    );

    const openCreateModal = () => {
        setEditingCandidate(null);
        setCandidateForm(EMPTY_CANDIDATE_FORM);
        setIsCandidateModalOpen(true);
        setError('');
    };

    const closeCandidateModal = () => {
        setEditingCandidate(null);
        setCandidateForm(EMPTY_CANDIDATE_FORM);
        setIsCandidateModalOpen(false);
    };

    const closeDetailModal = () => {
        setSelectedCandidate(null);
        setIsDetailModalOpen(false);
    };

    const handleResumeChange = (event) => {
        const file = event.target.files?.[0] || null;
        setCandidateForm((current) => ({
            ...current,
            resume: file,
            resume_name: file?.name || current.resume_name,
        }));
    };

    const toggleSkillSelection = (skillId) => {
        setCandidateForm((current) => ({
            ...current,
            skill_ids: current.skill_ids.includes(skillId)
                ? current.skill_ids.filter((id) => id !== skillId)
                : [...current.skill_ids, skillId],
        }));
    };

    const openEditModal = async (candidateId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getCandidate(candidateId);
            const candidate = response.data?.data;

            setEditingCandidate(candidate);
            setCandidateForm({
                full_name: candidate.full_name || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                job_applied: candidate.job_applied || candidate.job_applied_details?.id || '',
                skill_ids: (candidate.skills_details || []).map((skill) => skill.id),
                experience: candidate.experience || '',
                notes: candidate.notes || '',
                resume: null,
                resume_name: candidate.resume ? String(candidate.resume).split('/').pop() : '',
                resume_url: candidate.resume_url || '',
            });
            setIsCandidateModalOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load candidate details.'));
        } finally {
            setSaving(false);
        }
    };

    const openDetailModal = async (candidateId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getCandidate(candidateId);
            setSelectedCandidate(response.data?.data || null);
            setIsDetailModalOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load candidate details.'));
        } finally {
            setSaving(false);
        }
    };

    const validateForm = () => {
        if (!candidateForm.full_name.trim()) return 'Full name is required.';
        if (!candidateForm.email.trim()) return 'Email is required.';
        if (!candidateForm.phone.trim()) return 'Phone is required.';
        if (!candidateForm.job_applied) return 'Job applied is required.';
        if (candidateForm.skill_ids.length === 0) return 'At least one skill must be selected.';
        return '';
    };

    const buildCandidatePayload = () => {
        const { first_name, last_name } = splitFullName(candidateForm.full_name);
        const payload = new FormData();

        payload.append('first_name', first_name);
        payload.append('last_name', last_name);
        payload.append('email', candidateForm.email.trim());
        payload.append('phone', candidateForm.phone.trim());
        payload.append('job_applied', candidateForm.job_applied);
        payload.append('experience', candidateForm.experience.trim());
        payload.append('notes', candidateForm.notes.trim());

        candidateForm.skill_ids.forEach((skillId) => payload.append('skill_ids', String(skillId)));

        if (candidateForm.resume) {
            payload.append('resume', candidateForm.resume);
        }

        return payload;
    };

    const handleSaveCandidate = async () => {
        const validationMessage = validateForm();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = buildCandidatePayload();
            if (editingCandidate) {
                await recruitmentApi.updateCandidate(editingCandidate.id, payload);
            } else {
                await recruitmentApi.createCandidate(payload);
            }

            closeCandidateModal();
            fetchCandidatesData();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save candidate.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCandidate = async (candidate) => {
        if (!window.confirm(`Delete "${candidate.full_name}"?`)) return;

        setError('');

        try {
            await recruitmentApi.deleteCandidate(candidate.id);
            setCandidates((current) => current.filter((item) => item.id !== candidate.id));
            if (selectedCandidate?.id === candidate.id) {
                closeDetailModal();
            }
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete candidate.'));
        }
    };

    const handleStageChange = async (candidate, stageId) => {
        setError('');

        try {
            const response = await recruitmentApi.updateCandidateStage(candidate.id, stageId);
            const updatedCandidate = response.data?.data;
            setCandidates((current) =>
                current.map((item) => (item.id === candidate.id ? { ...item, ...updatedCandidate } : item))
            );
            if (selectedCandidate?.id === candidate.id) {
                setSelectedCandidate((current) => (current ? { ...current, ...updatedCandidate } : current));
            }
        } catch (stageError) {
            setError(getErrorMessage(stageError, 'Failed to update candidate stage.'));
        }
    };

    return (
        <div className="candidate-zone">
            <section className="candidate-zone__hero">
                <div>
                    <span className="candidate-zone__eyebrow">Candidate Management</span>
                    <h2>Candidates</h2>
                    <p>Track applicants, manage job applications, and move candidates through each stage of the hiring flow.</p>
                </div>
                <button type="button" className="candidate-zone__btn candidate-zone__btn--primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Candidate
                </button>
            </section>

            {error && (
                <div className="candidate-zone__alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <section className="candidate-zone__panel">
                <div className="candidate-zone__toolbar">
                    <div className="candidate-zone__search">
                        <Search size={18} className="candidate-zone__search-icon" />
                        <input
                            type="text"
                            placeholder="Search candidate, email, phone, or job..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <div className="candidate-zone__filters">
                        <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                            <option value="all">All Stages</option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>

                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="candidate-zone__table-wrap">
                    {loading ? (
                        <div className="candidate-zone__empty">Loading candidates...</div>
                    ) : (
                        <table className="candidate-zone__table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Job Applied</th>
                                    <th>Skills</th>
                                    <th>Experience</th>
                                    <th>Current Stage</th>
                                    <th>Status</th>
                                    <th>Applied Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.map((candidate) => {
                                    const lifecycle = getLifecycleStatus(candidate);
                                    const stageValue = candidate.stage || candidate.current_stage_details?.id || '';

                                    return (
                                        <tr key={candidate.id}>
                                            <td>
                                                <div className="candidate-zone__identity">
                                                    <div className="candidate-zone__avatar">
                                                        {(candidate.full_name || '?')
                                                            .split(' ')
                                                            .slice(0, 2)
                                                            .map((part) => part.charAt(0))
                                                            .join('')}
                                                    </div>
                                                    <div>
                                                        <strong>{candidate.full_name}</strong>
                                                        <span>{candidate.resume_url ? 'Resume attached' : 'No resume uploaded'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{candidate.email}</td>
                                            <td>{candidate.phone || '-'}</td>
                                            <td>{candidate.job_applied_details?.title || '-'}</td>
                                            <td>
                                                <div className="candidate-zone__skill-list">
                                                    {(candidate.skills_details || []).slice(0, 3).map((skill) => (
                                                        <span key={skill.id} className="candidate-zone__skill-chip">
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                    {(candidate.skills_details || []).length > 3 && (
                                                        <span className="candidate-zone__skill-chip muted">
                                                            +{candidate.skills_details.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{getExperienceLabel(candidate)}</td>
                                            <td>
                                                <select
                                                    className="candidate-zone__stage-select"
                                                    value={stageValue}
                                                    onChange={(event) => handleStageChange(candidate, event.target.value)}
                                                >
                                                    {stages.map((stage) => (
                                                        <option key={stage.id} value={stage.id}>
                                                            {stage.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`candidate-zone__status candidate-zone__status--${lifecycle.tone}`}>
                                                    {lifecycle.label}
                                                </span>
                                            </td>
                                            <td>{formatDate(candidate.applied_date || candidate.created_at)}</td>
                                            <td className="candidate-zone__actions-cell">
                                                <div className="candidate-zone__actions">
                                                    <button type="button" className="candidate-zone__icon-btn" onClick={() => openDetailModal(candidate.id)} title="View candidate">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button type="button" className="candidate-zone__icon-btn" onClick={() => openEditModal(candidate.id)} title="Edit candidate">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="candidate-zone__icon-btn danger"
                                                        onClick={() => handleDeleteCandidate(candidate)}
                                                        title="Delete candidate"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredCandidates.length === 0 && (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="candidate-zone__empty">No candidates found.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {isCandidateModalOpen && (
                <div className="candidate-zone__modal-backdrop" onClick={closeCandidateModal}>
                    <div className="candidate-zone__modal" onClick={(event) => event.stopPropagation()}>
                        <div className="candidate-zone__modal-header">
                            <div>
                                <span className="candidate-zone__eyebrow">{editingCandidate ? 'Edit Candidate' : 'New Candidate'}</span>
                                <h3>{editingCandidate ? 'Update candidate' : 'Add candidate'}</h3>
                            </div>
                            <button type="button" className="candidate-zone__icon-btn" onClick={closeCandidateModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="candidate-zone__form-grid">
                            <label className="candidate-zone__field candidate-zone__field--full">
                                <span>Full Name</span>
                                <input
                                    type="text"
                                    value={candidateForm.full_name}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, full_name: event.target.value }))}
                                    placeholder="e.g. Asha Thomas"
                                />
                            </label>

                            <label className="candidate-zone__field">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={candidateForm.email}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, email: event.target.value }))}
                                    placeholder="asha@example.com"
                                />
                            </label>

                            <label className="candidate-zone__field">
                                <span>Phone</span>
                                <input
                                    type="text"
                                    value={candidateForm.phone}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, phone: event.target.value }))}
                                    placeholder="+91 98765 43210"
                                />
                            </label>

                            <label className="candidate-zone__field">
                                <span>Job Applied</span>
                                <select
                                    value={candidateForm.job_applied}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, job_applied: event.target.value }))}
                                >
                                    <option value="">Select job opening</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="candidate-zone__field">
                                <span>Experience</span>
                                <input
                                    type="text"
                                    value={candidateForm.experience}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, experience: event.target.value }))}
                                    placeholder="e.g. 3 years"
                                />
                            </label>

                            <label className="candidate-zone__field candidate-zone__field--full">
                                <span>Resume Upload</span>
                                <div className="candidate-zone__upload">
                                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                                    <div className="candidate-zone__upload-meta">
                                        <FileText size={16} />
                                        <span>{candidateForm.resume_name || 'Choose a resume file'}</span>
                                        {candidateForm.resume_url && !candidateForm.resume && (
                                            <a href={candidateForm.resume_url} target="_blank" rel="noreferrer">
                                                View current resume
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </label>

                            <div className="candidate-zone__field candidate-zone__field--full">
                                <span>Skills</span>
                                <div className="candidate-zone__skill-picker">
                                    {groupedSkills.map(([categoryName, categorySkills]) => (
                                        <div key={categoryName} className="candidate-zone__skill-group">
                                            <strong>{categoryName}</strong>
                                            <div className="candidate-zone__skill-options">
                                                {categorySkills.map((skill) => {
                                                    const checked = candidateForm.skill_ids.includes(skill.id);
                                                    return (
                                                        <label key={skill.id} className={`candidate-zone__skill-option ${checked ? 'selected' : ''}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleSkillSelection(skill.id)}
                                                            />
                                                            <span>{skill.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label className="candidate-zone__field candidate-zone__field--full">
                                <span>Notes</span>
                                <textarea
                                    rows={5}
                                    value={candidateForm.notes}
                                    onChange={(event) => setCandidateForm((current) => ({ ...current, notes: event.target.value }))}
                                    placeholder="Add recruiter notes, profile highlights, or follow-up comments."
                                />
                            </label>
                        </div>

                        <div className="candidate-zone__modal-footer">
                            <button type="button" className="candidate-zone__btn candidate-zone__btn--ghost" onClick={closeCandidateModal}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="candidate-zone__btn candidate-zone__btn--primary"
                                onClick={handleSaveCandidate}
                                disabled={saving}
                            >
                                <Check size={16} />
                                {saving ? 'Saving...' : editingCandidate ? 'Save Changes' : 'Create Candidate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDetailModalOpen && selectedCandidate && (
                <div className="candidate-zone__modal-backdrop" onClick={closeDetailModal}>
                    <div className="candidate-zone__modal candidate-zone__modal--detail" onClick={(event) => event.stopPropagation()}>
                        <div className="candidate-zone__modal-header">
                            <div>
                                <span className="candidate-zone__eyebrow">Candidate Details</span>
                                <h3>{selectedCandidate.full_name}</h3>
                            </div>
                            <button type="button" className="candidate-zone__icon-btn" onClick={closeDetailModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="candidate-zone__detail-grid">
                            <div className="candidate-zone__detail-card">
                                <UserRound size={16} />
                                <div>
                                    <span>Email</span>
                                    <strong>{selectedCandidate.email}</strong>
                                </div>
                            </div>
                            <div className="candidate-zone__detail-card">
                                <Briefcase size={16} />
                                <div>
                                    <span>Job Applied</span>
                                    <strong>{selectedCandidate.job_applied_details?.title || '-'}</strong>
                                </div>
                            </div>
                            <div className="candidate-zone__detail-card">
                                <Workflow size={16} />
                                <div>
                                    <span>Current Stage</span>
                                    <strong>{selectedCandidate.stage_name || selectedCandidate.current_stage_details?.name || '-'}</strong>
                                </div>
                            </div>
                            <div className="candidate-zone__detail-card">
                                <FileText size={16} />
                                <div>
                                    <span>Resume</span>
                                    <strong>
                                        {selectedCandidate.resume_url ? (
                                            <a href={selectedCandidate.resume_url} target="_blank" rel="noreferrer">
                                                Open resume
                                            </a>
                                        ) : (
                                            'Not uploaded'
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="candidate-zone__detail-block">
                            <h4>Skills</h4>
                            <div className="candidate-zone__skill-list">
                                {(selectedCandidate.skills_details || []).map((skill) => (
                                    <span key={skill.id} className="candidate-zone__skill-chip">
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="candidate-zone__detail-block">
                            <h4>Notes</h4>
                            <p>{selectedCandidate.notes || 'No notes added yet.'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
