'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart, Briefcase, RefreshCw, Users } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Reports.css';

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const percentage = (numerator, denominator) => {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 1000) / 10;
};

export default function RecruitmentReports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [stages, setStages] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [interviews, setInterviews] = useState([]);

    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const [stagesResponse, candidatesResponse, interviewsResponse] = await Promise.all([
                recruitmentApi.getStages(),
                recruitmentApi.getCandidates({ page_size: 500 }),
                recruitmentApi.getInterviews({ page_size: 500 }),
            ]);

            setStages(stagesResponse.data?.data || []);
            setCandidates(candidatesResponse.data?.results || []);
            setInterviews(interviewsResponse.data?.results || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load recruitment reports.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const stageCounts = useMemo(() => {
        const counts = new Map(stages.map((stage) => [stage.id, 0]));
        const fallbackStageId = stages[0]?.id;

        candidates.forEach((candidate) => {
            const stageId = candidate.stage || candidate.stage_details?.id || fallbackStageId;
            if (!stageId) return;
            counts.set(stageId, (counts.get(stageId) || 0) + 1);
        });

        return stages.map((stage) => ({
            stageId: stage.id,
            stageName: stage.name,
            count: counts.get(stage.id) || 0,
        }));
    }, [candidates, stages]);

    const jobCounts = useMemo(() => {
        const counts = new Map();
        candidates.forEach((candidate) => {
            const title = candidate.job_applied_details?.title || (candidate.job_applied ? `Job #${candidate.job_applied}` : 'Unassigned');
            counts.set(title, (counts.get(title) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([jobTitle, count]) => ({ jobTitle, count }))
            .sort((a, b) => b.count - a.count);
    }, [candidates]);

    const totals = useMemo(() => {
        const totalCandidates = candidates.length;
        const hiredCount = candidates.filter((candidate) => candidate.status === 'HIRED').length;

        const candidatesWithInterviews = new Set(
            interviews.map((interview) => interview.candidate_id).filter((value) => value !== null && value !== undefined)
        ).size;

        return {
            totalCandidates,
            hiredCount,
            candidatesWithInterviews,
            hiringSuccessRate: percentage(hiredCount, totalCandidates),
            interviewConversionRate: percentage(candidatesWithInterviews, totalCandidates),
        };
    }, [candidates, interviews]);

    return (
        <div className="recruit-reports">
            <header className="recruit-reports__header">
                <div>
                    <span className="recruit-reports__eyebrow">Recruitment Analytics</span>
                    <h2>Reports</h2>
                    <p>Track pipeline health, interview conversion, and job-wise candidate volume.</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={fetchReports} disabled={loading}>
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="recruit-reports__alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <section className="recruit-reports__grid">
                <div className="recruit-reports__stat">
                    <div className="recruit-reports__stat-icon">
                        <Users size={18} />
                    </div>
                    <div>
                        <span className="recruit-reports__stat-label">Total Candidates</span>
                        <strong className="recruit-reports__stat-value">{totals.totalCandidates}</strong>
                    </div>
                </div>

                <div className="recruit-reports__stat">
                    <div className="recruit-reports__stat-icon success">
                        <BarChart size={18} />
                    </div>
                    <div>
                        <span className="recruit-reports__stat-label">Hiring Success Rate</span>
                        <strong className="recruit-reports__stat-value">{totals.hiringSuccessRate}%</strong>
                    </div>
                </div>

                <div className="recruit-reports__stat">
                    <div className="recruit-reports__stat-icon purple">
                        <BarChart size={18} />
                    </div>
                    <div>
                        <span className="recruit-reports__stat-label">Interview Conversion Rate</span>
                        <strong className="recruit-reports__stat-value">{totals.interviewConversionRate}%</strong>
                    </div>
                </div>

                <div className="recruit-reports__stat">
                    <div className="recruit-reports__stat-icon orange">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <span className="recruit-reports__stat-label">Jobs With Candidates</span>
                        <strong className="recruit-reports__stat-value">{jobCounts.filter((j) => j.jobTitle !== 'Unassigned').length}</strong>
                    </div>
                </div>
            </section>

            <section className="recruit-reports__panels">
                <div className="recruit-reports__panel">
                    <div className="recruit-reports__panel-header">
                        <h3>Candidates per Stage</h3>
                        <span className="recruit-reports__muted">{loading ? 'Loading…' : `${stages.length} stages`}</span>
                    </div>
                    <div className="recruit-reports__table-wrap">
                        <table className="recruit-reports__table">
                            <thead>
                                <tr>
                                    <th>Stage</th>
                                    <th className="right">Candidates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stageCounts.map((item) => (
                                    <tr key={item.stageId}>
                                        <td>{item.stageName}</td>
                                        <td className="right">{item.count}</td>
                                    </tr>
                                ))}
                                {!loading && stageCounts.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="recruit-reports__empty">
                                            No stages found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="recruit-reports__panel">
                    <div className="recruit-reports__panel-header">
                        <h3>Job-wise Candidate Count</h3>
                        <span className="recruit-reports__muted">{loading ? 'Loading…' : `${jobCounts.length} jobs`}</span>
                    </div>
                    <div className="recruit-reports__table-wrap">
                        <table className="recruit-reports__table">
                            <thead>
                                <tr>
                                    <th>Job</th>
                                    <th className="right">Candidates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobCounts.map((item) => (
                                    <tr key={item.jobTitle}>
                                        <td>{item.jobTitle}</td>
                                        <td className="right">{item.count}</td>
                                    </tr>
                                ))}
                                {!loading && jobCounts.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="recruit-reports__empty">
                                            No candidates found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
