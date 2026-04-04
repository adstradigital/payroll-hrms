'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Target, CheckCircle, Clock, TrendingUp,
    AlertTriangle, Award, Calendar, ChevronRight, Plus,
    Activity, ArrowUpRight, Star, BarChart3, Zap, RefreshCw,
    TrendingDown, AlertCircle, BookOpen, Flag, XCircle
} from 'lucide-react';
import { getDashboardStats, getReviewPeriods, bulkCreateReviews } from '../services/performanceService';
import { getReviewPeriods as fetchPeriods } from '../services/performanceService';
import { getAllEmployees } from '../../../../../api/api_clientadmin';
import './Dashboard.css';

/* ─────────────────────────────────────────
   Animated completion ring (SVG)
───────────────────────────────────────── */
const CompletionRing = ({ percentage = 0, size = 110, stroke = 10, color = '#6366f1' }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(Math.max(percentage, 0), 100);
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="perf-ring">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="var(--border-color)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
                fill="var(--text-primary)"
                style={{ fontSize: size * 0.19, fontWeight: 700, fontFamily: 'inherit' }}>
                {pct}%
            </text>
        </svg>
    );
};

/* ─────────────────────────────────────────
   Horizontal progress bar row
───────────────────────────────────────── */
const StatBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="stat-bar">
            <div className="stat-bar__header">
                <span className="stat-bar__label">{label}</span>
                <span className="stat-bar__value">{value} <span className="stat-bar__pct">({pct}%)</span></span>
            </div>
            <div className="stat-bar__track">
                <div className="stat-bar__fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────
   Rating stars visual
───────────────────────────────────────── */
const RatingStars = ({ rating }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
        <div className="rating-stars">
            {stars.map(s => (
                <Star key={s} size={14}
                    fill={s <= Math.round(rating) ? 'var(--brand-primary)' : 'none'}
                    color={s <= Math.round(rating) ? 'var(--brand-primary)' : 'var(--border-color)'}
                />
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────
   Main Dashboard Component
───────────────────────────────────────── */
export default function Dashboard() {
    const router = useRouter();
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => { loadPeriods(); }, []);
    useEffect(() => { if (selectedPeriod) loadDashboardStats(); }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            const data = await getReviewPeriods();
            const periodsList = data?.results || data || [];
            setPeriods(periodsList);
            
            if (periodsList.length > 0) {
                const active = periodsList.find(p => p.status === 'active');
                setSelectedPeriod(active?.id || periodsList[0].id);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error('Failed to load periods:', e);
            setLoading(false);
        }
    };

    const loadDashboardStats = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await getDashboardStats(selectedPeriod);
            setStats(data || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => loadDashboardStats(true);

    /* ── Derived values ── */
    const s = stats || {};
    const totalEmployees = s.total_employees || 0;
    const totalGoals = s.total_goals || 0;
    const goalsOnTrack = s.goals_on_track || 0;
    const goalsDelayed = s.goals_delayed || 0;
    const goalsCompleted = s.goals_completed || 0;
    const completedReviews = s.completed_reviews || 0;
    const pendingReviews = s.pending_reviews || 0;
    const overdueReviews = s.overdue_reviews || 0;
    const totalReviews = completedReviews + pendingReviews + overdueReviews;
    const completionPct = s.completion_percentage != null
        ? Math.round(s.completion_percentage)
        : (totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0);
    const avgRating = s.average_rating ? Number(s.average_rating).toFixed(1) : '0.0';
    const hasData = totalEmployees > 0 || totalGoals > 0 || totalReviews > 0;

    /* ── Metric cards definition ── */
    const metricCards = [
        {
            label: 'Total Employees',
            value: totalEmployees,
            icon: Users,
            badge: 'Active',
            badgeColor: 'green',
            gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
        },
        {
            label: 'Total Goals',
            value: totalGoals,
            icon: Target,
            badge: `${goalsOnTrack} on track`,
            badgeColor: 'blue',
            gradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
        },
        {
            label: 'Completed Reviews',
            value: completedReviews,
            icon: CheckCircle,
            badge: `${completionPct}% done`,
            badgeColor: 'violet',
            gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
        },
        {
            label: 'Avg. Rating',
            value: avgRating,
            icon: Award,
            badge: 'Out of 5',
            badgeColor: 'amber',
            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        },
    ];

    /* ── Quick actions ── */
    const quickActions = [
        { label: 'New Review', icon: Plus, path: '/dashboard/performance/reviews?open=create', color: '#6366f1' },
        { label: 'Set Goals', icon: Flag, path: '/dashboard/performance/goals', color: '#0ea5e9' },
        { label: 'View Reports', icon: BarChart3, path: '/dashboard/performance/reviews', color: '#8b5cf6' },
        { label: 'Templates', icon: BookOpen, path: '/dashboard/performance/templates', color: '#f59e0b' },
    ];

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="perf-dashboard perf-dashboard--loading">
                <div className="perf-spinner" />
                <p>Loading performance data…</p>
            </div>
        );
    }

    const selectedPeriodObj = periods.find(p => String(p.id) === String(selectedPeriod));

    return (
        <div className="perf-dashboard">

            {/* ── Header ── */}
            <div className="perf-header">
                <div className="perf-header__left">
                    <p className="perf-header__eyebrow">Performance Analytics</p>
                    <h2 className="perf-header__title">Executive Dashboard</h2>
                    {selectedPeriodObj && (
                        <span className={`period-badge period-badge--${selectedPeriodObj.status}`}>
                            {selectedPeriodObj.status === 'active' ? '● Active' : selectedPeriodObj.status} · {selectedPeriodObj.name}
                        </span>
                    )}
                </div>
                <div className="perf-header__actions">

                    <button className="perf-icon-btn" onClick={handleRefresh} title="Refresh">
                        <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
                    </button>
                    <button className="perf-action-btn perf-action-btn--primary"
                        onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} /> New Review
                    </button>
                </div>
            </div>

            {/* ── Overdue alert banner ── */}
            {overdueReviews > 0 && (
                <div className="perf-alert-banner">
                    <AlertCircle size={16} />
                    <span><strong>{overdueReviews}</strong> overdue {overdueReviews === 1 ? 'review requires' : 'reviews require'} immediate attention.</span>
                    <button className="perf-alert-banner__cta" onClick={() => router.push('/dashboard/performance/reviews?filter=overdue')}>
                        View All <ArrowUpRight size={12} />
                    </button>
                </div>
            )}

            {/* ── Metric cards ── */}
            <div className="perf-metrics-grid">
                {metricCards.map((card, i) => (
                    <div key={i} className="perf-metric-card">
                        <div className="perf-metric-card__icon-wrap" style={{ background: card.gradient }}>
                            <card.icon size={20} color="#fff" />
                        </div>
                        <div className="perf-metric-card__body">
                            <p className="perf-metric-card__label">{card.label}</p>
                            <p className="perf-metric-card__value">{card.value}</p>
                        </div>
                        <span className={`perf-metric-card__badge perf-metric-card__badge--${card.badgeColor}`}>
                            {card.badge}
                        </span>
                        <div className="perf-metric-card__glow" style={{ background: card.gradient }} />
                    </div>
                ))}
            </div>

            {/* ── Main content row ── */}
            <div className="perf-main-row">

                {/* ── Re-imagined Progress Center ── */}
                <div className="perf-glass-card perf-progress-center">
                    <div className="perf-card-header">
                        <div>
                            <h3 className="perf-card-title">Performance Progress</h3>
                            <p className="perf-card-sub">Reviews & Strategic Goals</p>
                        </div>
                        <div className="perf-card-header-actions">
                            <button className="perf-card-link" onClick={() => router.push('/dashboard/performance/reviews')}>
                                Reviews <ChevronRight size={14} />
                            </button>
                            <button className="perf-card-link" onClick={() => router.push('/dashboard/performance/goals')}>
                                Goals <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="perf-progress-grid">
                        <div className="perf-progress-section">
                            <CompletionRing percentage={completionPct} color="#6366f1" />
                            <div className="perf-progress-info">
                                <h4 className="perf-progress-label">Reviews</h4>
                                <div className="perf-progress-stats">
                                    <span className="perf-stat-item"><span className="dot dot--primary"></span> {completedReviews} Done</span>
                                    <span className="perf-stat-item"><span className="dot dot--blue"></span> {pendingReviews} Pending</span>
                                </div>
                            </div>
                        </div>

                        <div className="perf-divider-v" />

                        <div className="perf-progress-section">
                            <div className="perf-goals-donut">
                                <GoalsDonut onTrack={goalsOnTrack} delayed={goalsDelayed} completed={goalsCompleted} total={totalGoals} />
                            </div>
                            <div className="perf-progress-info">
                                <h4 className="perf-progress-label">Goals</h4>
                                <div className="perf-progress-stats">
                                    <span className="perf-stat-item"><span className="dot dot--green"></span> {goalsOnTrack} On Track</span>
                                    <span className="perf-stat-item"><span className="dot dot--amber"></span> {goalsDelayed} Delayed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Summary & Actions ── */}
                <div className="perf-side-col">
                    <div className="perf-glass-card perf-summary-card">
                        <div className="perf-card-header">
                            <h3 className="perf-card-title">Quick Actions</h3>
                            <Activity size={16} className="perf-card-header-icon" />
                        </div>
                        <div className="perf-qa-grid">
                            {quickActions.slice(0, 4).map((qa, i) => (
                                <button key={i} className="perf-qa-btn"
                                    onClick={() => qa.label === 'New Review' ? setShowCreateModal(true) : router.push(qa.path)}>
                                    <span className="perf-qa-btn__icon" style={{ background: `${qa.color}22`, color: qa.color }}>
                                        <qa.icon size={16} />
                                    </span>
                                    <span className="perf-qa-btn__label">{qa.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="perf-divider-h" />
                        <div className="perf-rating-mini">
                            <div className="perf-rating-info">
                                <span className="perf-rating-val">{avgRating}</span>
                                <RatingStars rating={parseFloat(avgRating)} />
                            </div>
                            <span className="perf-rating-label">Avg. Rating</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Activity Row (Removed for simplicity) ── */}


            {/* ── Create Review Modal ── */}
            {showCreateModal && (
                <CreateReviewModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); loadDashboardStats(true); }}
                />
            )}

        </div>
    );
}

/* ─────────────────────────────────────────
   Goals Donut (inline SVG, no extra dep)
───────────────────────────────────────── */
function GoalsDonut({ onTrack, delayed, completed, total }) {
    const size = 120;
    const stroke = 12;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const segments = [
        { value: onTrack, color: '#22c55e' },
        { value: delayed, color: '#f59e0b' },
        { value: completed, color: '#6366f1' },
    ];
    let offset = 0;
    return (
        <svg width={size} height={size} className="perf-ring">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
            {total > 0 && segments.map((seg, i) => {
                const pct = seg.value / total;
                const dash = pct * circ;
                const gap = circ - dash;
                const el = (
                    <circle key={i}
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={seg.color} strokeWidth={stroke}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset * circ + circ * 0.25}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                );
                offset += pct;
                return el;
            })}
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
                fill="var(--text-primary)"
                style={{ fontSize: 22, fontWeight: 700, fontFamily: 'inherit' }}>
                {total}
            </text>
            <text x="50%" y="65%" textAnchor="middle" dy="0.35em"
                fill="var(--text-muted)"
                style={{ fontSize: 9, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: 1 }}>
                Total
            </text>
        </svg>
    );
}

/* ─────────────────────────────────────────
   Inline Create Review Modal
───────────────────────────────────────── */
function CreateReviewModal({ isOpen, onClose, onSuccess }) {
    const [periods, setPeriods] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({ review_period: '', employee_ids: [] });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ review_period: '', employee_ids: [] });
            setError(null);
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            const [periodsRes, empRes] = await Promise.all([
                getReviewPeriods(),
                getAllEmployees({ page_size: 1000 })
            ]);
            const pList = Array.isArray(periodsRes?.results || periodsRes) ? (periodsRes?.results || periodsRes) : [];
            const sorted = [...pList].sort((a, b) => (b.status === 'active' ? 1 : 0) - (a.status === 'active' ? 1 : 0));
            setPeriods(sorted);
            if (sorted.length > 0) setFormData(prev => ({ ...prev, review_period: sorted[0].id }));
            const empList = empRes.data?.results || empRes.data || [];
            setEmployees(empList);
        } catch (err) {
            setError('Failed to load data. Please try again.');
        } finally {
            setLoadingData(false);
        }
    };

    const toggleEmployee = (id) => {
        setFormData(prev => ({
            ...prev,
            employee_ids: prev.employee_ids.includes(id)
                ? prev.employee_ids.filter(e => e !== id)
                : [...prev.employee_ids, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.review_period || formData.employee_ids.length === 0) {
            setError('Please select a review period and at least one employee.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await bulkCreateReviews(formData.review_period, formData.employee_ids);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to create reviews.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="perf-modal-overlay" onClick={onClose}>
            <div className="perf-modal" onClick={e => e.stopPropagation()}>
                <div className="perf-modal__header">
                    <h2 className="perf-modal__title">Start New Review</h2>
                    <button className="perf-modal__close" onClick={onClose}><XCircle size={22} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="perf-modal__body">
                        {error && (
                            <div className="perf-modal__error">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div className="perf-modal__field">
                            <label className="perf-modal__label">Review Period</label>
                            <select className="perf-modal__select"
                                value={formData.review_period}
                                onChange={e => setFormData({ ...formData, review_period: e.target.value })}
                                required>
                                <option value="" disabled>Select a period</option>
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}{p.status === 'active' ? ' (Active)' : ''}
                                    </option>
                                ))}
                            </select>
                            {periods.length === 0 && !loadingData && (
                                <p className="perf-modal__hint">No periods found — create one in Review Periods first.</p>
                            )}
                        </div>
                        <div className="perf-modal__field">
                            <div className="perf-modal__field-header">
                                <label className="perf-modal__label">Select Employees</label>
                                <button type="button" className="perf-modal__select-all"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        employee_ids: prev.employee_ids.length === employees.length ? [] : employees.map(e => e.id)
                                    }))}>
                                    {formData.employee_ids.length === employees.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="perf-modal__emp-list">
                                {loadingData ? (
                                    <p className="perf-modal__hint">Loading employees…</p>
                                ) : employees.map(emp => (
                                    <label key={emp.id} className={`perf-modal__emp-row ${formData.employee_ids.includes(emp.id) ? 'perf-modal__emp-row--checked' : ''}`}>
                                        <input type="checkbox"
                                            checked={formData.employee_ids.includes(emp.id)}
                                            onChange={() => toggleEmployee(emp.id)} />
                                        <span className="perf-modal__emp-name">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</span>
                                        <span className="perf-modal__emp-id">{emp.employee_id}</span>
                                        <span className="perf-modal__emp-dept">{emp.department?.name}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="perf-modal__hint">{formData.employee_ids.length} employee{formData.employee_ids.length !== 1 ? 's' : ''} selected</p>
                        </div>
                    </div>
                    <div className="perf-modal__footer">
                        <button type="button" className="perf-modal__btn perf-modal__btn--cancel" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="perf-modal__btn perf-modal__btn--submit" disabled={submitting || loadingData}>
                            {submitting ? 'Creating…' : 'Create Reviews'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

