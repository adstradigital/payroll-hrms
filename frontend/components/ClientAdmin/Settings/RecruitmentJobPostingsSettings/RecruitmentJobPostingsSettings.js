'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Check, AlertCircle, Briefcase } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';

const JOB_TYPE_OPTIONS = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' },
];

const EXPERIENCE_OPTIONS = [
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'ONE_TO_THREE', label: '1-3 Years' },
    { value: 'THREE_TO_FIVE', label: '3-5 Years' },
    { value: 'FIVE_PLUS', label: '5+ Years' },
];

const CANDIDATE_SOURCES = [
    { value: 'LINKEDIN', label: 'LinkedIn' },
    { value: 'COMPANY_WEBSITE', label: 'Company Website' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'INDEED', label: 'Indeed' },
    { value: 'NAUKRI', label: 'Naukri' },
];

const defaultFormState = {
    default_job_type: 'FULL_TIME',
    default_experience: 'FRESHER',
    allow_remote: false,
    default_expiry_days: 30,
    default_vacancies: 1,
    auto_close_job: true,
    allow_multiple_locations: false,
    candidate_sources: [],
};

export default function RecruitmentJobPostingsSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [form, setForm] = useState(defaultFormState);

    const candidateSourceValues = useMemo(() => new Set(CANDIDATE_SOURCES.map(s => s.value)), []);

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const normalizeIncoming = (data) => {
        const merged = { ...defaultFormState, ...(data || {}) };
        const expiryDays = Number.isFinite(Number(merged.default_expiry_days)) ? Number(merged.default_expiry_days) : defaultFormState.default_expiry_days;
        const vacancies = Number.isFinite(Number(merged.default_vacancies)) ? Number(merged.default_vacancies) : defaultFormState.default_vacancies;

        const sources = Array.isArray(merged.candidate_sources) ? merged.candidate_sources : [];
        const cleanedSources = sources.filter(v => candidateSourceValues.has(v));

        return {
            ...merged,
            default_expiry_days: Math.max(0, Math.trunc(expiryDays)),
            default_vacancies: Math.max(0, Math.trunc(vacancies)),
            candidate_sources: cleanedSources,
        };
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await recruitmentApi.getJobPostingSettings();
            setForm(normalizeIncoming(res.data?.data));
        } catch (error) {
            console.error('Failed to fetch job posting settings:', error);
            showNotification('Failed to load settings', 'error');
            setForm(defaultFormState);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleCandidateSourcesChange = (e) => {
        const selected = Array.from(e.target.selectedOptions || []).map(o => o.value);
        handleChange('candidate_sources', selected);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const payload = {
                ...form,
                default_expiry_days: Math.max(0, Math.trunc(Number(form.default_expiry_days || 0))),
                default_vacancies: Math.max(0, Math.trunc(Number(form.default_vacancies || 0))),
            };

            const res = await recruitmentApi.saveJobPostingSettings(payload);
            setForm(normalizeIncoming(res.data?.data));
            showNotification('Job posting settings saved', 'success');
        } catch (error) {
            console.error('Failed to save job posting settings:', error);
            const message = error.response?.data?.message || error.response?.data?.error || 'Failed to save settings';
            showNotification(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
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
                <h2>Job Postings</h2>
                <p>Configure default settings used when creating new job postings</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <Briefcase size={18} />
                    <h3>Defaults</h3>
                </div>

                <div className="settings-card-body">
                    <div className="settings-input-row">
                        <div className="settings-field-group">
                            <label className="settings-label">Default Job Type</label>
                            <select
                                className="settings-select"
                                value={form.default_job_type}
                                onChange={(e) => handleChange('default_job_type', e.target.value)}
                                disabled={saving}
                            >
                                {JOB_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="settings-field-group">
                            <label className="settings-label">Default Experience Level</label>
                            <select
                                className="settings-select"
                                value={form.default_experience}
                                onChange={(e) => handleChange('default_experience', e.target.value)}
                                disabled={saving}
                            >
                                {EXPERIENCE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="settings-input-row">
                        <div className="settings-field-group">
                            <label className="settings-label">Default Job Expiry Days</label>
                            <input
                                className="settings-input"
                                type="number"
                                min="0"
                                value={form.default_expiry_days}
                                onChange={(e) => handleChange('default_expiry_days', e.target.value)}
                                disabled={saving}
                            />
                        </div>
                        <div className="settings-field-group">
                            <label className="settings-label">Default Vacancies</label>
                            <input
                                className="settings-input"
                                type="number"
                                min="0"
                                value={form.default_vacancies}
                                onChange={(e) => handleChange('default_vacancies', e.target.value)}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="settings-toggle-item wide">
                        <div className="toggle-info">
                            <span className="toggle-label">Allow Remote Jobs</span>
                            <span className="toggle-desc">Enable remote job postings by default.</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={!!form.allow_remote}
                                onChange={(e) => handleChange('allow_remote', e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="settings-toggle-item wide">
                        <div className="toggle-info">
                            <span className="toggle-label">Auto Close Job When Vacancies Filled</span>
                            <span className="toggle-desc">Automatically close the job when all vacancies are filled.</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={!!form.auto_close_job}
                                onChange={(e) => handleChange('auto_close_job', e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="settings-toggle-item wide">
                        <div className="toggle-info">
                            <span className="toggle-label">Allow Multiple Job Locations</span>
                            <span className="toggle-desc">Allow multiple locations to be selected for a job posting.</span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={!!form.allow_multiple_locations}
                                onChange={(e) => handleChange('allow_multiple_locations', e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="settings-field-group" style={{ marginTop: '1rem' }}>
                        <label className="settings-label">Candidate Sources (Multi-select)</label>
                        <select
                            className="settings-select"
                            multiple
                            value={form.candidate_sources}
                            onChange={handleCandidateSourcesChange}
                            disabled={saving}
                            style={{ minHeight: 140 }}
                        >
                            {CANDIDATE_SOURCES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Hold Ctrl (Windows) or Command (Mac) to select multiple sources.
                        </div>
                    </div>
                </div>

                <div className="settings-card-footer">
                    <button className="settings-btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

