'use client';

import { useEffect, useMemo, useState } from 'react';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { Briefcase, Users, UserCheck, UserX } from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';
import PipelineStatus from '@/components/dashboard/PipelineStatus';
import ApplicationSource from '@/components/dashboard/ApplicationSource';
import dashboardApi from '@/api/dashboardApi';
import styles from '../page.module.css';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RecruitmentDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [stats, setStats] = useState<any>(null);
    const [pipelineStatus, setPipelineStatus] = useState<any>(null);
    const [applicationSources, setApplicationSources] = useState<any>(null);
    const [todayInterviews, setTodayInterviews] = useState<any[]>([]);

    const refreshDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, pipelineRes, sourcesRes, interviewsRes] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getPipelineStatus(),
                dashboardApi.getApplicationSources(),
                dashboardApi.getTodayInterviews(),
            ]);
            setStats(statsRes.data);
            setPipelineStatus(pipelineRes.data);
            setApplicationSources(sourcesRes.data);
            setTodayInterviews(interviewsRes.data?.results || interviewsRes.data || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load recruitment dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    const statCards = useMemo(() => ([
        {
            key: 'total_candidates',
            title: 'Total Candidates',
            value: stats?.total_candidates ?? 0,
            subtitle: 'Candidates in system',
            icon: Users,
            color: 'primary',
        },
        {
            key: 'active_jobs',
            title: 'Active Jobs',
            value: stats?.active_jobs ?? 0,
            subtitle: 'Open job positions',
            icon: Briefcase,
            color: 'warning',
        },
        {
            key: 'hired',
            title: 'Hired',
            value: stats?.hired ?? 0,
            subtitle: 'Successfully hired',
            icon: UserCheck,
            color: 'success',
        },
        {
            key: 'rejected',
            title: 'Rejected',
            value: stats?.rejected ?? 0,
            subtitle: 'Rejected candidates',
            icon: UserX,
            color: 'danger',
        },
    ]), [stats]);

    return (
        <Dashboard breadcrumbs={['Dashboard', 'Recruitment']}>
            <ModuleGuard module="HRMS" permission="recruitment.view">
                {error && (
                    <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                        <div className="card__header" style={{ marginBottom: 0 }}>
                            <div>
                                <h3 className="card__title">Unable to load dashboard</h3>
                                <p className="card__subtitle">{error}</p>
                            </div>
                            <button type="button" className="btn btn-outline" onClick={refreshDashboard}>
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* 1) Status Cards */}
                <div className="stats-grid">
                    {statCards.map((card) => (
                        <div key={card.key} className="stat-card">
                            <div className="stat-card__header">
                                <div className="stat-card__info">
                                    <span className="stat-card__label">{card.title}</span>
                                    <span className="stat-card__value">{loading ? '...' : card.value}</span>
                                </div>
                                <div
                                    className={`stat-card__icon-wrapper stat-card__icon-wrapper--${card.color}`}
                                    style={{ backgroundColor: `var(--brand-${card.color}, var(--color-${card.color}))` }}
                                >
                                    <card.icon size={22} />
                                </div>
                            </div>
                            <div className="stat-card__footer">
                                <span className="stat-card__trend-label">{card.subtitle}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.grid}>
                    {/* 2) Pipeline Status Chart */}
                    <div className={`card ${styles.pipeline}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Pipeline Status</h3>
                                <p className="card__subtitle">Stage-wise distribution</p>
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <PipelineStatus data={pipelineStatus} loading={loading} />
                        </div>
                    </div>

                    {/* 3) Application Sources Chart */}
                    <div className={`card ${styles.sources}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Application Sources</h3>
                                <p className="card__subtitle">Where candidates originate</p>
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <ApplicationSource data={applicationSources} loading={loading} />
                        </div>
                    </div>

                    {/* 4) Today's Interviews */}
                    <div className={`card ${styles.interviews}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Today&apos;s Interviews</h3>
                                <p className="card__subtitle">Scheduled for today</p>
                            </div>
                            <span className={styles.badge}>{loading ? '...' : todayInterviews.length}</span>
                        </div>
                        <div className={styles.cardBody}>
                            {loading ? (
                                <div className={styles.empty}>Loading interviews...</div>
                            ) : todayInterviews.length === 0 ? (
                                <div className={styles.empty}>No interviews scheduled for today.</div>
                            ) : (
                                <ul className={styles.interviewList}>
                                    {todayInterviews.map((item) => {
                                        const when = new Date(item.scheduled_date || item.interview_date);
                                        const time = Number.isNaN(when.getTime())
                                            ? '-'
                                            : when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <li key={item.id} className={styles.interviewRow}>
                                                <div className={styles.timePill}>{time}</div>
                                                <div className={styles.interviewMain}>
                                                    <div className={styles.name}>{item.candidate_name || item.candidate?.full_name || '-'}</div>
                                                    <div className={styles.meta}>
                                                        <span>{item.job_role || item.job_title || item.job_opening?.title || '-'}</span>
                                                        <span className={styles.dot}>•</span>
                                                        <span>{item.interview_type_label || item.interview_type || '-'}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 5) Quick Actions */}
                    <div className={`card ${styles.actions}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Quick Actions</h3>
                                <p className="card__subtitle">Common recruitment tasks</p>
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <QuickActions onSuccess={refreshDashboard} />
                        </div>
                    </div>
                </div>
            </ModuleGuard>
        </Dashboard>
    );
}
