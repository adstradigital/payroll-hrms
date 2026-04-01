'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, Briefcase, Calendar, Check, UserPlus, X } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './QuickActions.css';

const actions = [
    { key: 'post', title: 'Post Job', icon: Briefcase, href: '/dashboard/recruitment/job-openings' },
    { key: 'candidate', title: 'Add Candidate', icon: UserPlus, href: '' },
    { key: 'interview', title: 'Schedule Interview', icon: Calendar, href: '' },
    { key: 'reports', title: 'Reports', icon: BarChart2, href: '/dashboard/recruitment/reports' },
];

const EMPTY_CANDIDATE_FORM = {
    full_name: '',
    email: '',
    phone: '',
    job_applied: '',
    experience: '',
    skill_ids: [] as number[],
    resume: null as File | null,
};

const EMPTY_INTERVIEW_FORM = {
    candidate: '',
    job: '',
    interview_type: 'HR',
    interviewer_name: '',
    interview_date: '',
    interview_mode: 'ONLINE',
    location_or_link: '',
    notes: '',
};

const splitFullName = (fullName: string) => {
    const value = (fullName || '').trim();
    if (!value) return { first_name: '', last_name: '' };

    const parts = value.split(/\s+/);
    return {
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '-',
    };
};

const formatApiError = (error: any, fallback: string) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return String(firstError);
    }
    return error?.response?.data?.message || fallback;
};

const isValidUrl = (value: string) => {
    if (!value) return false;
    try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

export default function QuickActions({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [error, setError] = useState('');
    const [loadingDeps, setLoadingDeps] = useState(false);
    const [saving, setSaving] = useState(false);

    const [jobs, setJobs] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);

    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [candidateForm, setCandidateForm] = useState(EMPTY_CANDIDATE_FORM);

    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [interviewForm, setInterviewForm] = useState(EMPTY_INTERVIEW_FORM);

    useEffect(() => {
        if (!toast) return undefined;
        const timeout = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(timeout);
    }, [toast]);

    const skillGroups = useMemo(() => {
        const groups = new Map<string, any[]>();
        skills.forEach((skill) => {
            const categoryName = skill.category_details?.name || 'Other Skills';
            if (!groups.has(categoryName)) groups.set(categoryName, []);
            groups.get(categoryName)!.push(skill);
        });
        return Array.from(groups.entries());
    }, [skills]);

    const candidateById = useMemo(() => {
        const map = new Map<string, any>();
        candidates.forEach((candidate) => map.set(String(candidate.id), candidate));
        return map;
    }, [candidates]);

    const loadCandidateDependencies = async () => {
        setLoadingDeps(true);
        setError('');
        try {
            const [jobsResponse, skillsResponse] = await Promise.all([
                recruitmentApi.getJobs({ page_size: 150 }),
                recruitmentApi.getSkills(),
            ]);
            setJobs(jobsResponse.data?.results || []);
            setSkills(skillsResponse.data?.data || []);
        } catch (depError) {
            setError(formatApiError(depError, 'Failed to load jobs/skills.'));
        } finally {
            setLoadingDeps(false);
        }
    };

    const loadInterviewDependencies = async () => {
        setLoadingDeps(true);
        setError('');
        try {
            const [candidatesResponse, jobsResponse] = await Promise.all([
                recruitmentApi.getCandidates({ page_size: 250 }),
                recruitmentApi.getJobs({ page_size: 150 }),
            ]);
            setCandidates(candidatesResponse.data?.results || []);
            setJobs(jobsResponse.data?.results || []);
        } catch (depError) {
            setError(formatApiError(depError, 'Failed to load candidates/jobs.'));
        } finally {
            setLoadingDeps(false);
        }
    };

    const openCandidateModal = async () => {
        setShowCandidateModal(true);
        setCandidateForm(EMPTY_CANDIDATE_FORM);
        await loadCandidateDependencies();
    };

    const closeCandidateModal = () => {
        setShowCandidateModal(false);
        setCandidateForm(EMPTY_CANDIDATE_FORM);
        setError('');
    };

    const openInterviewModal = async () => {
        setShowInterviewModal(true);
        setInterviewForm(EMPTY_INTERVIEW_FORM);
        await loadInterviewDependencies();
    };

    const closeInterviewModal = () => {
        setShowInterviewModal(false);
        setInterviewForm(EMPTY_INTERVIEW_FORM);
        setError('');
    };

    const toggleSkill = (skillId: number) => {
        setCandidateForm((current) => ({
            ...current,
            skill_ids: current.skill_ids.includes(skillId)
                ? current.skill_ids.filter((id) => id !== skillId)
                : [...current.skill_ids, skillId],
        }));
    };

    const validateCandidate = () => {
        if (!candidateForm.full_name.trim()) return 'Candidate name is required.';
        if (!candidateForm.email.trim()) return 'Email is required.';
        if (!candidateForm.phone.trim()) return 'Phone is required.';
        if (!candidateForm.job_applied) return 'Job applied is required.';
        if (candidateForm.skill_ids.length === 0) return 'Select at least one skill.';
        return '';
    };

    const buildCandidatePayload = () => {
        const { first_name, last_name } = splitFullName(candidateForm.full_name);
        const payload = new FormData();
        payload.append('first_name', first_name);
        payload.append('last_name', last_name);
        payload.append('email', candidateForm.email.trim());
        payload.append('phone', candidateForm.phone.trim());
        payload.append('job_applied', String(candidateForm.job_applied));
        payload.append('experience', candidateForm.experience.trim());

        candidateForm.skill_ids.forEach((skillId) => payload.append('skill_ids', String(skillId)));
        if (candidateForm.resume) payload.append('resume', candidateForm.resume);
        return payload;
    };

    const submitCandidate = async () => {
        const validation = validateCandidate();
        if (validation) {
            setError(validation);
            return;
        }

        setSaving(true);
        setError('');
        try {
            await recruitmentApi.createCandidate(buildCandidatePayload());
            setToast({ type: 'success', message: 'Candidate added successfully.' });
            closeCandidateModal();
            onSuccess?.();
        } catch (saveError) {
            setError(formatApiError(saveError, 'Failed to add candidate.'));
        } finally {
            setSaving(false);
        }
    };

    const handleInterviewCandidateChange = (candidateId: string) => {
        const candidate = candidateById.get(String(candidateId));
        const jobId = candidate?.job_applied || candidate?.job_applied_details?.id || '';
        setInterviewForm((current) => ({ ...current, candidate: candidateId, job: jobId ? String(jobId) : '' }));
    };

    const validateInterview = () => {
        if (!interviewForm.candidate) return 'Candidate is required.';
        if (!interviewForm.job) return 'Job is required.';
        if (!interviewForm.interviewer_name.trim()) return 'Interviewer name is required.';
        if (!interviewForm.interview_date) return 'Interview date & time is required.';
        const scheduled = new Date(interviewForm.interview_date);
        if (Number.isNaN(scheduled.getTime())) return 'Invalid interview date.';
        if (scheduled <= new Date()) return 'Interview date must be in the future.';
        return '';
    };

    const submitInterview = async () => {
        const validation = validateInterview();
        if (validation) {
            setError(validation);
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload: any = {
                candidate: Number(interviewForm.candidate),
                job: interviewForm.job ? Number(interviewForm.job) : undefined,
                interview_type: interviewForm.interview_type,
                interviewer_name: interviewForm.interviewer_name.trim(),
                interview_date: interviewForm.interview_date,
                interview_mode: interviewForm.interview_mode,
                location_or_link: interviewForm.location_or_link || '',
                status: 'SCHEDULED',
                result: 'PENDING',
                feedback: interviewForm.notes || '',
            };
            const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
            await recruitmentApi.createInterview(cleanPayload);

            setToast({ type: 'success', message: 'Interview scheduled successfully.' });
            closeInterviewModal();
            onSuccess?.();
        } catch (saveError) {
            setError(formatApiError(saveError, 'Failed to schedule interview.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="qa-wrap">
            {toast && <div className={`qa-toast qa-toast--${toast.type}`}>{toast.message}</div>}

            <div className="qa-grid">
                {actions.map((action) => (
                    <button
                        key={action.key}
                        type="button"
                        className={`qa-card qa-card--${action.key}`}
                        onClick={() => {
                            if (action.key === 'candidate') return openCandidateModal();
                            if (action.key === 'interview') return openInterviewModal();
                            if (action.href) return router.push(action.href);
                        }}
                    >
                        <span className="qa-card__icon">
                            <action.icon size={22} />
                        </span>
                        <span className="qa-card__title">{action.title}</span>
                    </button>
                ))}
            </div>

            {showCandidateModal && (
                <div className="qa-modal-backdrop" onClick={closeCandidateModal}>
                    <div className="qa-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="qa-modal__header">
                            <div>
                                <span className="qa-eyebrow">Quick Action</span>
                                <h3>Add Candidate</h3>
                            </div>
                            <button type="button" className="qa-icon-btn" onClick={closeCandidateModal}>
                                <X size={16} />
                            </button>
                        </div>

                        {error && <div className="qa-alert">{error}</div>}

                        <div className="qa-form-grid">
                            <label className="qa-field qa-field--full">
                                <span>Candidate Name</span>
                                <input
                                    type="text"
                                    value={candidateForm.full_name}
                                    onChange={(event) => setCandidateForm((c) => ({ ...c, full_name: event.target.value }))}
                                    placeholder="e.g. Sarah Wilson"
                                />
                            </label>

                            <label className="qa-field">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={candidateForm.email}
                                    onChange={(event) => setCandidateForm((c) => ({ ...c, email: event.target.value }))}
                                    placeholder="sarah@example.com"
                                />
                            </label>

                            <label className="qa-field">
                                <span>Phone</span>
                                <input
                                    type="text"
                                    value={candidateForm.phone}
                                    onChange={(event) => setCandidateForm((c) => ({ ...c, phone: event.target.value }))}
                                    placeholder="9876543210"
                                />
                            </label>

                            <label className="qa-field qa-field--full">
                                <span>Job Applied</span>
                                <select
                                    value={candidateForm.job_applied}
                                    onChange={(event) => setCandidateForm((c) => ({ ...c, job_applied: event.target.value }))}
                                >
                                    <option value="">Select job</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="qa-field qa-field--full">
                                <span>Experience</span>
                                <input
                                    type="text"
                                    value={candidateForm.experience}
                                    onChange={(event) => setCandidateForm((c) => ({ ...c, experience: event.target.value }))}
                                    placeholder="e.g. 2 years"
                                />
                            </label>

                            <div className="qa-field qa-field--full">
                                <span>Skills</span>
                                <div className="qa-skill-box">
                                    {loadingDeps ? (
                                        <div className="qa-muted">Loading skills...</div>
                                    ) : (
                                        skillGroups.map(([categoryName, categorySkills]) => (
                                            <div key={categoryName} className="qa-skill-group">
                                                <div className="qa-skill-group__title">{categoryName}</div>
                                                <div className="qa-skill-group__items">
                                                    {categorySkills.map((skill) => (
                                                        <label key={skill.id} className="qa-skill-chip">
                                                            <input
                                                                type="checkbox"
                                                                checked={candidateForm.skill_ids.includes(skill.id)}
                                                                onChange={() => toggleSkill(skill.id)}
                                                            />
                                                            <span>{skill.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <label className="qa-field qa-field--full">
                                <span>Resume Upload</span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(event) =>
                                        setCandidateForm((c) => ({ ...c, resume: event.target.files?.[0] || null }))
                                    }
                                />
                            </label>
                        </div>

                        <div className="qa-modal__footer">
                            <button type="button" className="btn btn-outline" onClick={closeCandidateModal} disabled={saving}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={submitCandidate} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Add Candidate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInterviewModal && (
                <div className="qa-modal-backdrop" onClick={closeInterviewModal}>
                    <div className="qa-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="qa-modal__header">
                            <div>
                                <span className="qa-eyebrow">Quick Action</span>
                                <h3>Schedule Interview</h3>
                            </div>
                            <button type="button" className="qa-icon-btn" onClick={closeInterviewModal}>
                                <X size={16} />
                            </button>
                        </div>

                        {error && <div className="qa-alert">{error}</div>}

                        <div className="qa-form-grid">
                            <label className="qa-field qa-field--full">
                                <span>Candidate</span>
                                <select value={interviewForm.candidate} onChange={(event) => handleInterviewCandidateChange(event.target.value)}>
                                    <option value="">Select candidate</option>
                                    {candidates.map((candidate) => (
                                        <option key={candidate.id} value={candidate.id}>
                                            {candidate.full_name} {candidate.email ? `(${candidate.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="qa-field qa-field--full">
                                <span>Job</span>
                                <select
                                    value={interviewForm.job}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, job: event.target.value }))}
                                >
                                    <option value="">
                                        {loadingDeps ? 'Loading jobs...' : 'Select job (auto-fills when candidate is chosen)'}
                                    </option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="qa-field">
                                <span>Interview Type</span>
                                <select
                                    value={interviewForm.interview_type}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, interview_type: event.target.value }))}
                                >
                                    <option value="HR">HR</option>
                                    <option value="TECHNICAL">Technical</option>
                                    <option value="MANAGERIAL">Managerial</option>
                                    <option value="FINAL">Final</option>
                                </select>
                            </label>

                            <label className="qa-field">
                                <span>Interviewer Name</span>
                                <input
                                    type="text"
                                    value={interviewForm.interviewer_name}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, interviewer_name: event.target.value }))}
                                    placeholder="e.g. Alex Tech Lead"
                                />
                            </label>

                            <label className="qa-field">
                                <span>Interview Date</span>
                                <input
                                    type="datetime-local"
                                    value={interviewForm.interview_date}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, interview_date: event.target.value }))}
                                />
                            </label>

                            <label className="qa-field">
                                <span>Mode</span>
                                <select
                                    value={interviewForm.interview_mode}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, interview_mode: event.target.value }))}
                                >
                                    <option value="ONLINE">Online</option>
                                    <option value="IN_PERSON">In-person</option>
                                </select>
                            </label>

                            <label className="qa-field qa-field--full">
                                <span>Meeting Link or Location</span>
                                <input
                                    type="text"
                                    value={interviewForm.location_or_link}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, location_or_link: event.target.value }))}
                                    placeholder={interviewForm.interview_mode === 'ONLINE' ? 'https://meet.google.com/...' : 'Conference Room A'}
                                />
                                {interviewForm.interview_mode === 'ONLINE' && interviewForm.location_or_link && !isValidUrl(interviewForm.location_or_link) && (
                                    <span className="qa-hint qa-hint--warn">Link does not look like a valid URL.</span>
                                )}
                            </label>

                            <label className="qa-field qa-field--full">
                                <span>Notes</span>
                                <textarea
                                    rows={3}
                                    value={interviewForm.notes}
                                    onChange={(event) => setInterviewForm((c) => ({ ...c, notes: event.target.value }))}
                                    placeholder="Internal notes..."
                                />
                            </label>
                        </div>

                        <div className="qa-modal__footer">
                            <button type="button" className="btn btn-outline" onClick={closeInterviewModal} disabled={saving}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={submitInterview} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Schedule Interview'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
