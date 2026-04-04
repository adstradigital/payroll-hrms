'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { 
    Briefcase, 
    Users, 
    UserCheck, 
    UserX, 
    LayoutDashboard, 
    Search, 
    Calendar,
    ArrowRight
} from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';
import PipelineStatus from '@/components/dashboard/PipelineStatus';
import ApplicationSource from '@/components/dashboard/ApplicationSource';
import dashboardApi from '@/api/dashboardApi';
import styles from '../page.module.css';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function RecruitmentDashboardPage() {
    const router = useRouter();
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

    const workflowSteps = [
        { id: 'jobs', label: 'Job Openings', icon: Briefcase, path: '/dashboard/recruitment/job-openings', desc: 'Post and manage your vacancies.' },
        { id: 'candidates', label: 'Candidate Pool', icon: Users, path: '/dashboard/recruitment/candidates', desc: 'Browse and source new talent.' },
        { id: 'ats', label: 'ATS Pipeline', icon: LayoutDashboard, path: '/dashboard/recruitment/ats', desc: 'Track progress in the board.' },
        { id: 'interviews', label: 'Interview Desk', icon: Calendar, path: '/dashboard/recruitment/interview', desc: 'Evaluate and schedule meetings.' },
    ];

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
        <Dashboard
            title="Recruitment Overview"
            subtitle="Manage your end-to-end hiring journey"
            breadcrumbs={['Dashboard', 'Recruitment']}
        >
            <ModuleGuard module="HRMS">
                {/* 1) New Workflow Navigation Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {workflowSteps.map((step) => (
                        <button 
                            key={step.id} 
                            onClick={() => router.push(step.path)}
                            className="flex flex-col items-start p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <step.icon className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                {step.label}
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">{step.desc}</p>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="card mb-6" style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
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

                {/* 2) Status Cards */}
                <div className="stats-grid mb-8">
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
                    {/* 3) Pipeline Status Chart */}
                    <div className={`card ${styles.pipeline}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Hiring Funnel</h3>
                                <p className="card__subtitle">Stage-wise candidate distribution</p>
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <PipelineStatus data={pipelineStatus} loading={loading} />
                        </div>
                    </div>

                    {/* 4) Application Sources Chart */}
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

                    {/* 5) Today's Interviews */}
                    <div className={`card ${styles.interviews}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Interview Desk</h3>
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
                                        const when = new Date(item.scheduled_date || item.interview_date || '');
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

                    {/* 6) Quick Actions */}
                    <div className={`card ${styles.actions}`}>
                        <div className="card__header">
                            <div>
                                <h3 className="card__title">Recruitment Actions</h3>
                                <p className="card__subtitle">Common hiring tasks</p>
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
