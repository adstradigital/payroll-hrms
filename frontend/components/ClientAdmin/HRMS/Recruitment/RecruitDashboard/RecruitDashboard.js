'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Briefcase,
    UserCheck,
    Activity,
    Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitDashboard.css';
import './QuickActions.css';

const isCurrentMonth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

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
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'TEMPORARY', label: 'Temporary' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
    { value: 'ENTRY', label: 'Entry Level' },
    { value: 'MID', label: 'Mid Level' },
    { value: 'SENIOR', label: 'Senior Level' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'EXECUTIVE', label: 'Executive' },
];

const DEFAULT_EXPERIENCE_TO_MODEL = {
    FRESHER: { experience_level: 'ENTRY', experience_required: 'Fresher' },
    ONE_TO_THREE: { experience_level: 'MID', experience_required: '1-3 Years' },
    THREE_TO_FIVE: { experience_level: 'SENIOR', experience_required: '3-5 Years' },
    FIVE_PLUS: { experience_level: 'LEAD', experience_required: '5+ Years' },
};

const toDateInputValue = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function RecruitDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [candidateStats, setCandidateStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [jobOpenings, setJobOpenings] = useState([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [skills, setSkills] = useState([]);
    const [activeJobCount, setActiveJobCount] = useState(0);
    const [jobModalOpen, setJobModalOpen] = useState(false);
    const [jobSaving, setJobSaving] = useState(false);
    const [jobError, setJobError] = useState('');
    const [jobForm, setJobForm] = useState({
        title: '',
        department: '',
        employment_type: '',
        experience_level: 'MID',
        location: '',
        description: '',
        experience_required: '',
        openings: 1,
        required_skills: [],
        is_remote: false,
        application_deadline: '',
    });

    const metrics = useMemo(() => {
        const activeJobs =
            activeJobCount ||
            jobOpenings.filter((job) => (job.status || '').toUpperCase() === 'OPEN' || (job.status || '').toUpperCase() === 'ACTIVE').length;
        const newCandidates = candidates.filter((cand) => isCurrentMonth(cand.created_at)).length || candidateStats?.new_this_month || 0;
        const pendingReviews = applications.filter(
            (app) =>
                (app.stage_details?.name || app.stage_name || '').toUpperCase() === 'SCREENING' ||
                (app.status || '').toUpperCase() === 'SCREENING'
        ).length;
        const hiredThisMonth = applications.filter((app) => (app.status || '').toUpperCase() === 'HIRED' && isCurrentMonth(app.applied_date)).length;

        return [
            { label: 'Active Jobs', value: activeJobs, trend: 'Open positions', icon: Briefcase, color: 'primary' },
            { label: 'New Candidates', value: newCandidates, trend: 'This month', icon: Users, color: 'warning' },
            { label: 'Pending Reviews', value: pendingReviews, trend: 'In screening', icon: Activity, color: 'info' },
            { label: 'Hired This Month', value: hiredThisMonth, trend: 'Converted', icon: UserCheck, color: 'success' },
        ];
    }, [candidateStats, jobOpenings, applications]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [
                candidateStatsResponse,
                candidatesResponse,
                interviewsResponse,
                applicationsResponse,
                jobsResponse,
                activeJobsResponse,
            ] = await Promise.all([
                recruitmentApi.getCandidateStats(),
                recruitmentApi.getCandidates({ page_size: 200 }),
                recruitmentApi.getInterviews({ upcoming: true, page_size: 10 }),
                recruitmentApi.getApplications({ page_size: 200 }),
                recruitmentApi.getJobs({ page_size: 12 }),
                recruitmentApi.getJobs({ status: 'ACTIVE', page_size: 1 }),
            ]);

            const candidateData = candidateStatsResponse.data?.data;
            setCandidateStats(candidateData);
            setCandidates(candidatesResponse.data?.results || candidatesResponse.data?.data || []);
            setApplications(applicationsResponse.data?.results || applicationsResponse.data?.data || []);
            setJobOpenings(jobsResponse.data?.results || jobsResponse.data?.data || []);
            setActiveJobCount(activeJobsResponse.data?.count || 0);

            const upcoming = interviewsResponse.data?.results || interviewsResponse.data?.data || [];
            setUpcomingInterviews(
                upcoming.slice(0, 5).map((item) => ({
                    id: item.id,
                    candidate: item.candidate_name,
                    role: item.job_title,
                    time: new Date(item.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(item.interview_date).toLocaleDateString(),
                }))
            );
        } catch (error) {
            console.error('Failed to fetch recruitment dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const openJobModal = async () => {
        if (skills.length === 0) {
            try {
                const skillsResponse = await recruitmentApi.getSkills();
                setSkills(skillsResponse.data?.data || skillsResponse.data?.results || []);
            } catch (err) {
                console.error('Failed to load skills', err);
            }
        }

        try {
            const defaultsRes = await recruitmentApi.getJobDefaults();
            const defaults = defaultsRes.data?.data || {};
            const mapped = DEFAULT_EXPERIENCE_TO_MODEL[defaults.default_experience] || null;

            const expiryDays = Number(defaults.default_expiry_days || 0);
            const expiryDate = expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null;

            setJobForm((current) => ({
                ...current,
                employment_type: defaults.default_job_type || current.employment_type,
                openings: Number(defaults.default_vacancies || current.openings),
                is_remote: !!defaults.allow_remote,
                application_deadline: expiryDate ? toDateInputValue(expiryDate) : current.application_deadline,
                experience_level: mapped?.experience_level || current.experience_level,
                experience_required: mapped?.experience_required || current.experience_required,
            }));
        } catch (defaultsError) {
            console.error('Failed to load job defaults:', defaultsError);
        }
        setJobModalOpen(true);
    };

    const handleCreateJob = async () => {
        if (!jobForm.title || !jobForm.department || !jobForm.employment_type || !jobForm.experience_level) {
            setJobError('Title, Department, Job Type, and Experience Level are required.');
            return;
        }
        if (!jobForm.location) {
            setJobError('Location is required.');
            return;
        }
        if (!jobForm.description) {
            setJobError('Description is required.');
            return;
        }
        if (jobForm.required_skills.length === 0) {
            setJobError('Select at least one skill.');
            return;
        }
        setJobSaving(true);
        setJobError('');
        try {
            const payload = {
                ...jobForm,
                openings: jobForm.openings,
            };
            await recruitmentApi.createJob(payload);
            setJobModalOpen(false);
            setJobForm({
                title: '',
                department: '',
                employment_type: '',
                experience_level: 'MID',
                location: '',
                description: '',
                experience_required: '',
                openings: 1,
                required_skills: [],
                is_remote: false,
                application_deadline: '',
            });
            fetchDashboardData();
        } catch (err) {
            const firstFieldError = err?.response?.data?.errors && Object.values(err.response.data.errors).flat()?.[0];
            setJobError(firstFieldError || err?.response?.data?.message || 'Failed to create job.');
        } finally {
            setJobSaving(false);
        }
    };

    const handleDownloadReport = () => {
        const lines = [
            ['Metric', 'Value'],
            ...metrics.map((m) => [m.label, m.value]),
            ['Total Jobs', jobOpenings.length],
            ['Total Applications', applications.length],
        ];
        const csv = lines.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recruitment_report.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const toggleSkill = (skillId) => {
        setJobForm((prev) => {
            const exists = prev.required_skills.includes(skillId);
            return {
                ...prev,
                required_skills: exists ? prev.required_skills.filter((id) => id !== skillId) : [...prev.required_skills, skillId],
            };
        });
    };

    return (
        <div className="recruit-dashboard">
            <div className="rd-card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="rd-card__title" style={{ marginBottom: '0.25rem' }}>
                        Recruitment Overview
                    </h2>
                    <p className="rd-empty-state" style={{ margin: 0 }}>
                        Welcome to the recruitment management dashboard.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="rd-btn-sm rd-btn-sm--ghost" onClick={handleDownloadReport}>
                        Download Report
                    </button>
                    <button className="rd-btn-sm rd-btn-sm--primary" onClick={openJobModal}>
                        Create Job Posting
                    </button>
                </div>
            </div>
            <div className="rd-metrics">
                {metrics.map((m, i) => (
                    <div key={i} className={`rd-metric-card rd-metric-card--${m.color}`}>
                        <div className="rd-metric-card__icon">
                            <m.icon size={24} />
                        </div>
                        <div className="rd-metric-card__info">
                            <span className="rd-metric-card__value">{m.value}</span>
                            <span className="rd-metric-card__label">{m.label}</span>
                            <span className="rd-metric-card__trend">{m.trend}</span>
                        </div>
                        <div className="rd-metric-card__bg-icon">
                            <m.icon size={80} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rd-grid">
                <div className="rd-charts-col">
                    <div className="rd-card">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">Recent Job Openings</h3>
                            <button type="button" className="rd-link-btn" onClick={() => router.push('/dashboard/recruitment/job-openings')}>
                                View All
                            </button>
                        </div>
                        <div className="rd-list">
                            {(jobOpenings.slice(0, 5) || []).map((job) => (
                                <div key={job.id} className="rd-interview-item">
                                    <div className="rd-interview-details">
                                        <h4 className="rd-candidate-name">{job.title}</h4>
                                        <p className="rd-role-type">
                                            {(job.employment_type || job.job_type || '').replaceAll('_', ' ') || '-'} | {job.applications_count || 0} Applicants
                                        </p>
                                    </div>
                                    <span className="rd-badge">{job.status}</span>
                                </div>
                            ))}
                            {!loading && jobOpenings.length === 0 && <p className="rd-empty-state">No jobs found.</p>}
                        </div>
                    </div>
                </div>

                <div className="rd-activity-col">
                    <div className="rd-card rd-card--flex">
                        <div className="rd-card__header">
                            <h3 className="rd-card__title">
                                <Calendar size={18} />
                                Upcoming Interviews
                            </h3>
                            <span className="rd-badge">{upcomingInterviews.length}</span>
                        </div>

                        <div className="rd-list">
                            {loading ? (
                                <p className="rd-empty-state">Loading interviews...</p>
                            ) : (
                                upcomingInterviews.map((interview) => (
                                    <div key={interview.id} className="rd-interview-item">
                                        <div className="rd-interview-time">
                                            <span>{interview.time}</span>
                                            <small>{interview.date}</small>
                                        </div>
                                        <div className="rd-interview-details">
                                            <h4 className="rd-candidate-name">{interview.candidate}</h4>
                                            <p className="rd-role-type">{interview.role}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="rd-btn-sm"
                                            onClick={() => router.push('/dashboard/recruitment/interview')}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))
                            )}

                            {!loading && upcomingInterviews.length === 0 && (
                                <p className="rd-empty-state">No interviews scheduled.</p>
                            )}
                        </div>

                        <div className="rd-card__footer">
                            <button type="button" className="rd-link-btn" onClick={() => router.push('/dashboard/recruitment/interview')}>
                                View Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {jobModalOpen && (
                <div className="qa-modal-backdrop" onClick={() => setJobModalOpen(false)}>
                    <div className="qa-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="qa-modal__header">
                            <div>
                                <p className="qa-eyebrow">Create Job Posting</p>
                                <h3>New Job</h3>
                            </div>
                            <button className="qa-icon-btn" onClick={() => setJobModalOpen(false)}>
                                X
                            </button>
                        </div>
                        <div className="qa-modal__body">
                            <div className="qa-form-grid">
                                <div className="qa-field">
                                    <label>Job Title</label>
                                    <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
                                </div>
                                <div className="qa-field">
                                    <label>Department</label>
                                    <select value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}>
                                        <option value="">Select department</option>
                                        {DEPARTMENT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="qa-field">
                                    <label>Job Type</label>
                                    <select value={jobForm.employment_type} onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}>
                                        <option value="">Select job type</option>
                                        {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="qa-field">
                                    <label>Experience Level</label>
                                    <select value={jobForm.experience_level} onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })}>
                                        <option value="">Select level</option>
                                        {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="qa-field">
                                    <label>Location</label>
                                    <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
                                </div>
                                <div className="qa-field">
                                    <label>Experience</label>
                                    <input value={jobForm.experience_required} onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })} />
                                </div>
                                <div className="qa-field">
                                    <label>Vacancies</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={jobForm.openings}
                                        onChange={(e) => setJobForm({ ...jobForm, openings: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="qa-field">
                                    <label>Remote Option</label>
                                    <select
                                        value={jobForm.is_remote ? 'yes' : 'no'}
                                        onChange={(e) => setJobForm({ ...jobForm, is_remote: e.target.value === 'yes' })}
                                    >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>
                                <div className="qa-field">
                                    <label>Expiry Date</label>
                                    <input
                                        type="date"
                                        value={jobForm.application_deadline || ''}
                                        onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
                                    />
                                </div>
                                <div className="qa-field qa-field--full">
                                    <label>Description</label>
                                    <textarea
                                        rows={3}
                                        value={jobForm.description}
                                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="qa-field qa-field--full">
                                    <label>Skills</label>
                                    <div className="qa-skill-group__items">
                                        {skills.map((skill) => (
                                            <button
                                                type="button"
                                                key={skill.id}
                                                className={`qa-skill-chip ${jobForm.required_skills.includes(skill.id) ? 'active' : ''}`}
                                                onClick={() => toggleSkill(skill.id)}
                                            >
                                                {skill.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {jobError && <div className="qa-alert">{jobError}</div>}
                        </div>
                        <div className="qa-modal__footer">
                            <button className="rd-btn-sm" onClick={() => setJobModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="rd-btn-sm rd-btn-sm--primary" onClick={handleCreateJob} disabled={jobSaving}>
                                {jobSaving ? 'Saving...' : 'Create Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

