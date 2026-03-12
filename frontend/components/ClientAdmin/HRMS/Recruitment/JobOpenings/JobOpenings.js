'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Eye,
    Edit2,
    Trash2,
    MapPin,
    Briefcase,
    Users,
    CalendarDays,
    X,
    Check,
    AlertCircle,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './JobOpenings.css';

const DEPARTMENT_OPTIONS = [
    { value: 'ENGINEERING', label: 'Engineering' },
    { value: 'IT', label: 'IT' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'SALES', label: 'Sales' },
    { value: 'HR', label: 'HR' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'OPERATIONS', label: 'Operations' },
    { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'DESIGN', label: 'Design' },
    { value: 'OTHER', label: 'Other' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' },
];

const STATUS_OPTIONS = [
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
];

const EMPTY_JOB_FORM = {
    title: '',
    department: '',
    description: '',
    required_skills: [],
    experience_required: '',
    vacancies: 1,
    location: '',
    employment_type: 'FULL_TIME',
    status: 'OPEN',
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || fallback;
};

const formatLabel = (value, options) => options.find((option) => option.value === value)?.label || value || '-';

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
};

export default function JobOpenings() {
    const [jobs, setJobs] = useState([]);
    const [skills, setSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);

    useEffect(() => {
        fetchOpenJobs();
    }, []);

    const fetchOpenJobs = async () => {
        setLoading(true);
        setError('');

        try {
            const [jobsResponse, skillsResponse] = await Promise.all([
                recruitmentApi.getJobs(),
                recruitmentApi.getSkills(),
            ]);

            setJobs(jobsResponse.data?.results || []);
            setSkills(skillsResponse.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load jobs.'));
        } finally {
            setLoading(false);
        }
    };

    const groupedSkills = useMemo(() => {
        const map = new Map();

        skills.forEach((skill) => {
            const categoryName = skill.category_details?.name || 'Other Skills';
            if (!map.has(categoryName)) {
                map.set(categoryName, []);
            }
            map.get(categoryName).push(skill);
        });

        return Array.from(map.entries());
    }, [skills]);

    const filteredJobs = useMemo(
        () =>
            jobs.filter((job) => {
                const query = searchTerm.toLowerCase();
                return (
                    job.title.toLowerCase().includes(query) ||
                    (job.department || '').toLowerCase().includes(query) ||
                    (job.location || '').toLowerCase().includes(query)
                );
            }),
        [jobs, searchTerm]
    );

    const openCreateModal = () => {
        setEditingJob(null);
        setJobForm(EMPTY_JOB_FORM);
        setIsJobModalOpen(true);
        setError('');
    };

    const openEditModal = async (jobId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getJob(jobId);
            const job = response.data?.data;

            setEditingJob(job);
            setJobForm({
                title: job.title || '',
                department: job.department || '',
                description: job.description || '',
                required_skills: (job.required_skills_details || []).map((skill) => skill.id),
                experience_required: job.experience_required || job.experience_level || '',
                vacancies: job.vacancies || job.openings || 1,
                location: job.location || '',
                employment_type: job.employment_type || 'FULL_TIME',
                status: job.status || 'OPEN',
            });
            setIsJobModalOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load job details.'));
        } finally {
            setSaving(false);
        }
    };

    const openDetailModal = async (jobId) => {
        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.getJob(jobId);
            setSelectedJob(response.data?.data || null);
            setIsDetailModalOpen(true);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load job details.'));
        } finally {
            setSaving(false);
        }
    };

    const closeJobModal = () => {
        setEditingJob(null);
        setJobForm(EMPTY_JOB_FORM);
        setIsJobModalOpen(false);
    };

    const closeDetailModal = () => {
        setSelectedJob(null);
        setIsDetailModalOpen(false);
    };

    const toggleSkillSelection = (skillId) => {
        setJobForm((current) => ({
            ...current,
            required_skills: current.required_skills.includes(skillId)
                ? current.required_skills.filter((id) => id !== skillId)
                : [...current.required_skills, skillId],
        }));
    };

    const validateForm = () => {
        if (!jobForm.title.trim()) return 'Job title is required.';
        if (!jobForm.department) return 'Department is required.';
        if (!jobForm.description.trim()) return 'Job description is required.';
        if (jobForm.required_skills.length === 0) return 'At least one skill must be selected.';
        if (Number(jobForm.vacancies) <= 0) return 'Vacancies must be greater than 0.';
        if (!jobForm.location.trim()) return 'Location is required.';
        return '';
    };

    const handleSaveJob = async () => {
        const validationMessage = validateForm();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setSaving(true);
        setError('');

        const payload = {
            title: jobForm.title.trim(),
            department: jobForm.department,
            description: jobForm.description.trim(),
            required_skills: jobForm.required_skills,
            experience_required: jobForm.experience_required.trim(),
            vacancies: Number(jobForm.vacancies),
            location: jobForm.location.trim(),
            employment_type: jobForm.employment_type,
            status: jobForm.status,
            openings: Number(jobForm.vacancies),
            experience_level: 'MID',
        };

        try {
            if (editingJob) {
                await recruitmentApi.updateJob(editingJob.id, payload);
            } else {
                await recruitmentApi.createJob(payload);
            }

            closeJobModal();
            fetchOpenJobs();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save job.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteJob = async (job) => {
        if (!window.confirm(`Delete "${job.title}"?`)) return;

        setError('');

        try {
            await recruitmentApi.deleteJob(job.id);
            setJobs((current) => current.filter((item) => item.id !== job.id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete job.'));
        }
    };

    const handleToggleStatus = async (job) => {
        const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        setError('');

        try {
            await recruitmentApi.updateJobStatus(job.id, nextStatus);
            setJobs((current) =>
                current.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
            );
            if (selectedJob?.id === job.id) {
                setSelectedJob((current) => (current ? { ...current, status: nextStatus } : current));
            }
        } catch (statusError) {
            setError(getErrorMessage(statusError, 'Failed to update job status.'));
        }
    };

    return (
        <div className="open-jobs-page">
            <section className="open-jobs-hero">
                <div>
                    <span className="open-jobs-eyebrow">Recruitment Opportunities</span>
                    <h2>Open Jobs</h2>
                    <p>Create roles, assign required skills, and manage active recruitment opportunities from one place.</p>
                </div>
                <button className="open-jobs-btn open-jobs-btn--primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add New Job
                </button>
            </section>

            {error && (
                <div className="open-jobs-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <section className="open-jobs-panel">
                <div className="open-jobs-toolbar">
                    <div className="open-jobs-search">
                        <Search size={18} className="open-jobs-search__icon" />
                        <input
                            type="text"
                            placeholder="Search job title, department or location..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                </div>

                <div className="open-jobs-table-wrap">
                    {loading ? (
                        <div className="open-jobs-empty">Loading jobs...</div>
                    ) : (
                        <table className="open-jobs-table">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Department</th>
                                    <th>Required Skills</th>
                                    <th>Experience</th>
                                    <th>Vacancies</th>
                                    <th>Location</th>
                                    <th>Employment Type</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>
                                            <div className="open-jobs-title">
                                                <strong>{job.title}</strong>
                                            </div>
                                        </td>
                                        <td>{formatLabel(job.department, DEPARTMENT_OPTIONS)}</td>
                                        <td>
                                            <div className="open-jobs-skills">
                                                {(job.required_skills_details || []).slice(0, 3).map((skill) => (
                                                    <span key={skill.id} className="open-jobs-skill-chip">
                                                        {skill.name}
                                                    </span>
                                                ))}
                                                {(job.required_skills_details || []).length > 3 && (
                                                    <span className="open-jobs-skill-chip muted">
                                                        +{job.required_skills_details.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{job.experience_required || job.experience_level || '-'}</td>
                                        <td>{job.vacancies || job.openings || 0}</td>
                                        <td>{job.location}</td>
                                        <td>{formatLabel(job.employment_type, EMPLOYMENT_TYPE_OPTIONS)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={`open-jobs-status ${job.status === 'OPEN' ? 'open' : 'closed'}`}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    handleToggleStatus(job);
                                                }}
                                            >
                                                {job.status === 'OPEN' ? 'Open' : 'Closed'}
                                            </button>
                                        </td>
                                        <td>{formatDate(job.created_at || job.posted_date)}</td>
                                        <td className="open-jobs-cell--actions">
                                            <div className="open-jobs-actions">
                                                <button
                                                    type="button"
                                                    className="open-jobs-icon-btn"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        openDetailModal(job.id);
                                                    }}
                                                    title="View job"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="open-jobs-icon-btn"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        openEditModal(job.id);
                                                    }}
                                                    title="Edit job"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="open-jobs-icon-btn danger"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        handleDeleteJob(job);
                                                    }}
                                                    title="Delete job"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredJobs.length === 0 && (
                                    <tr>
                                        <td colSpan="10">
                                            <div className="open-jobs-empty">No jobs found.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {isJobModalOpen && (
                <div className="open-jobs-modal-backdrop" onClick={closeJobModal}>
                    <div className="open-jobs-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="open-jobs-modal__header">
                            <div>
                                <span className="open-jobs-eyebrow">{editingJob ? 'Edit Job' : 'New Job'}</span>
                                <h3>{editingJob ? 'Update job opening' : 'Create job opening'}</h3>
                            </div>
                            <button className="open-jobs-icon-btn" onClick={closeJobModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="open-jobs-form-grid">
                            <label className="open-jobs-field open-jobs-field--full">
                                <span>Job Title</span>
                                <input
                                    type="text"
                                    value={jobForm.title}
                                    onChange={(event) => setJobForm((current) => ({ ...current, title: event.target.value }))}
                                    placeholder="e.g. Senior React Developer"
                                />
                            </label>

                            <label className="open-jobs-field">
                                <span>Department</span>
                                <select
                                    value={jobForm.department}
                                    onChange={(event) => setJobForm((current) => ({ ...current, department: event.target.value }))}
                                >
                                    <option value="">Select department</option>
                                    {DEPARTMENT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="open-jobs-field">
                                <span>Employment Type</span>
                                <select
                                    value={jobForm.employment_type}
                                    onChange={(event) =>
                                        setJobForm((current) => ({ ...current, employment_type: event.target.value }))
                                    }
                                >
                                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="open-jobs-field open-jobs-field--full">
                                <span>Job Description</span>
                                <textarea
                                    rows={5}
                                    value={jobForm.description}
                                    onChange={(event) => setJobForm((current) => ({ ...current, description: event.target.value }))}
                                    placeholder="Describe the role, responsibilities, and expectations."
                                />
                            </label>

                            <label className="open-jobs-field">
                                <span>Experience Required</span>
                                <input
                                    type="text"
                                    value={jobForm.experience_required}
                                    onChange={(event) =>
                                        setJobForm((current) => ({ ...current, experience_required: event.target.value }))
                                    }
                                    placeholder="e.g. 3-5 years"
                                />
                            </label>

                            <label className="open-jobs-field">
                                <span>Vacancies</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={jobForm.vacancies}
                                    onChange={(event) =>
                                        setJobForm((current) => ({ ...current, vacancies: event.target.value }))
                                    }
                                />
                            </label>

                            <label className="open-jobs-field">
                                <span>Location</span>
                                <input
                                    type="text"
                                    value={jobForm.location}
                                    onChange={(event) => setJobForm((current) => ({ ...current, location: event.target.value }))}
                                    placeholder="e.g. Bangalore"
                                />
                            </label>

                            <label className="open-jobs-field">
                                <span>Status</span>
                                <select
                                    value={jobForm.status}
                                    onChange={(event) => setJobForm((current) => ({ ...current, status: event.target.value }))}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="open-jobs-field open-jobs-field--full">
                                <span>Required Skills</span>
                                <div className="open-jobs-skill-picker">
                                    {groupedSkills.map(([categoryName, categorySkills]) => (
                                        <div key={categoryName} className="open-jobs-skill-group">
                                            <strong>{categoryName}</strong>
                                            <div className="open-jobs-skill-options">
                                                {categorySkills.map((skill) => {
                                                    const checked = jobForm.required_skills.includes(skill.id);
                                                    return (
                                                        <label key={skill.id} className={`open-jobs-skill-option ${checked ? 'selected' : ''}`}>
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
                        </div>

                        <div className="open-jobs-modal__footer">
                            <button className="open-jobs-btn open-jobs-btn--ghost" onClick={closeJobModal}>
                                Cancel
                            </button>
                            <button className="open-jobs-btn open-jobs-btn--primary" onClick={handleSaveJob} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : editingJob ? 'Save Changes' : 'Create Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDetailModalOpen && selectedJob && (
                <div className="open-jobs-modal-backdrop" onClick={closeDetailModal}>
                    <div className="open-jobs-modal open-jobs-modal--detail" onClick={(event) => event.stopPropagation()}>
                        <div className="open-jobs-modal__header">
                            <div>
                                <span className="open-jobs-eyebrow">Job Details</span>
                                <h3>{selectedJob.title}</h3>
                            </div>
                            <button className="open-jobs-icon-btn" onClick={closeDetailModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="open-jobs-detail-grid">
                            <div className="open-jobs-detail-card">
                                <Briefcase size={16} />
                                <div>
                                    <span>Department</span>
                                    <strong>{formatLabel(selectedJob.department, DEPARTMENT_OPTIONS)}</strong>
                                </div>
                            </div>
                            <div className="open-jobs-detail-card">
                                <MapPin size={16} />
                                <div>
                                    <span>Location</span>
                                    <strong>{selectedJob.location || '-'}</strong>
                                </div>
                            </div>
                            <div className="open-jobs-detail-card">
                                <Users size={16} />
                                <div>
                                    <span>Vacancies</span>
                                    <strong>{selectedJob.vacancies || selectedJob.openings || 0}</strong>
                                </div>
                            </div>
                            <div className="open-jobs-detail-card">
                                <CalendarDays size={16} />
                                <div>
                                    <span>Created</span>
                                    <strong>{formatDate(selectedJob.created_at || selectedJob.posted_date)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="open-jobs-detail-block">
                            <h4>Description</h4>
                            <p>{selectedJob.description}</p>
                        </div>

                        <div className="open-jobs-detail-block">
                            <h4>Required Skills</h4>
                            <div className="open-jobs-skills">
                                {(selectedJob.required_skills_details || []).map((skill) => (
                                    <span key={skill.id} className="open-jobs-skill-chip">
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
