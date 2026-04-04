'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Users, Calendar, CheckCircle2, AlertCircle, 
    ChevronRight, ArrowRight, Star, MessageSquareCode,
    Filter, Search, Sliders, Play, RotateCcw,
    Activity, Target, BarChart3, Clock, Loader2,
    Edit3, Eye, Send, Award, Sparkles, X
} from 'lucide-react';
import * as performanceService from '../services/performanceService';
import './PerformanceReviews.css';

// --- Sub-Components ---

const StatCard = ({ label, value, icon: Icon, colorClass, gradient }) => (
    <div className="review-stat-card">
        <div className={`stat-icon-wrap ${colorClass}`} style={{ background: gradient }}>
            <Icon size={24} className="text-white" />
        </div>
        <div className="stat-info">
            <span className="label">{label}</span>
            <div className="value">{value}</div>
        </div>
    </div>
);

const AssessmentModal = ({ isOpen, review, onClose, onSubmit }) => {
    const [rating, setRating] = useState(review?.manager_rating || 0);
    const [feedback, setFeedback] = useState(review?.manager_feedback || '');
    const [strengths, setStrengths] = useState(review?.strengths || '');
    const [improvements, setImprovements] = useState(review?.areas_for_improvement || '');

    if (!isOpen || !review) return null;

    const employeeName = review.employee_name || review.employee?.username || 'Employee';

    return (
        <div className="neo-modal-overlay" onClick={onClose}>
            <div className="neo-modal max-w-[900px]" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500 border border-indigo-100 dark:border-slate-700">
                                {employeeName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Reviewing {employeeName}</h3>
                                <p className="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                                    {review.review_period_name || 'Assessment Workspace'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="modal-content">
                    <div className="assessment-layout">
                        {/* Left: Self Discovery */}
                        <div className="assessment-panel">
                            <h4 className="panel-title"><MessageSquareCode size={14} /> Self Assessment</h4>
                            <div className="space-y-6">
                                <div className="feedback-bubble">
                                    {review.self_assessment || "No self-assessment submitted yet."}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Self Rating</span>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">
                                        {review.self_rating || '--'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Manager Insight */}
                        <div className="assessment-panel bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                            <h4 className="panel-title text-indigo-500"><Award size={14} /> Manager Evaluation</h4>
                            <div className="space-y-6">
                                <div className="score-display">
                                    {rating}
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="5" 
                                    step="0.1" 
                                    className="rating-slider"
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}
                                />
                                <div className="space-y-4">
                                    <textarea 
                                        className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl font-bold text-sm h-32 resize-none border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Detailed feedback..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <textarea 
                                            className="bg-white dark:bg-slate-900 p-3 rounded-xl font-bold text-[0.7rem] h-20 resize-none border-0"
                                            placeholder="Core Strengths..."
                                            value={strengths}
                                            onChange={(e) => setStrengths(e.target.value)}
                                        />
                                        <textarea 
                                            className="bg-white dark:bg-slate-900 p-3 rounded-xl font-bold text-[0.7rem] h-20 resize-none border-0"
                                            placeholder="Growth Areas..."
                                            value={improvements}
                                            onChange={(e) => setImprovements(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="flex-1 py-4 font-black uppercase text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl" onClick={onClose}>
                        Save Draft
                    </button>
                    <button 
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        onClick={() => onSubmit(review.id, {
                            manager_rating: Number(rating),
                            manager_feedback: feedback,
                            strengths: strengths,
                            areas_for_improvement: improvements
                        })}
                    >
                        <Send size={16} /> Finalize Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Framework Controller ---

export default function PerformanceReviews() {
    const [reviews, setReviews] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [activePeriod, setActivePeriod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, review: null });

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const [p, r] = await Promise.all([
                performanceService.getReviewPeriods(),
                performanceService.getPerformanceReviews()
            ]);
            
            const reviewPeriods = p?.results || p || [];
            setPeriods(reviewPeriods);
            
            // Default to latest active period
            const current = reviewPeriods.find(per => per.status === 'active') || reviewPeriods[0];
            setActivePeriod(current);

            setReviews(r?.results || r || []);
        } catch (e) {
            notify('System failed to sync review data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const notify = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleReviewSubmit = async (id, data) => {
        try {
            await performanceService.submitManagerReview(id, data);
            notify('Manager assessment synchronized successfully');
            setModal({ isOpen: false, review: null });
            loadReviews(); // Reload to get updated status
        } catch (e) {
            notify(e.message, 'error');
        }
    };

    const getStatusUI = (status) => {
        switch (status) {
            case 'pending': return { label: 'Self Assess', class: 'pending' };
            case 'self_submitted': return { label: 'Under Review', class: 'self' };
            case 'under_review': return { label: 'Review Draft', class: 'manager' };
            case 'completed': return { label: 'Completed', class: 'complete' };
            default: return { label: status, class: 'pending' };
        }
    };

    const stats = useMemo(() => {
        const active = reviews.length;
        const completed = reviews.filter(r => r.status === 'completed').length;
        const pendingSelf = reviews.filter(r => r.status === 'pending').length;
        const avg = reviews.length ? (reviews.reduce((acc, r) => acc + (Number(r.manager_rating) || 0), 0) / reviews.length).toFixed(1) : '0.0';
        
        return { active, completed, pendingSelf, avg };
    }, [reviews]);

    const filteredReviews = reviews.filter(r => {
        const empName = (r.employee_name || r.employee?.username || '').toLowerCase();
        return empName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="reviews-workspace max-w-[1200px] mx-auto px-8">
            {/* Dashboard Stats */}
            <div className="review-stats-grid">
                <StatCard 
                    label="Active Assessments" 
                    value={stats.active} 
                    icon={Target} 
                    gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" 
                />
                <StatCard 
                    label="Pending Self-Asst" 
                    value={stats.pendingSelf} 
                    icon={Clock} 
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
                />
                <StatCard 
                    label="Completed Sessions" 
                    value={stats.completed} 
                    icon={CheckCircle2} 
                    gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                />
                <StatCard 
                    label="Average Rating" 
                    value={stats.avg} 
                    icon={Star} 
                    gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)" 
                />
            </div>

            {/* Cycle Control */}
            <div className="cycle-control-bar">
                <div className="active-cycle-info">
                    <Calendar size={20} className="text-slate-400" />
                    <div>
                        <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest block">Active Cycle</span>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm">{activePeriod?.name || 'No Cycle Selected'}</span>
                            <span className="cycle-badge">{activePeriod?.status || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            className="bg-slate-50 dark:bg-slate-900/50 border-0 p-3 pl-10 rounded-xl font-bold text-xs w-60"
                            placeholder="Find employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Assessment Table */}
            {loading ? (
                <div className="flex justify-center py-32 opacity-30">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            ) : filteredReviews.length > 0 ? (
                <div className="assessment-table-wrap">
                    <table className="paradigm-table">
                        <thead>
                            <tr>
                                <th>Employee Entity</th>
                                <th>Assessment Status</th>
                                <th>Self Score</th>
                                <th>Mgr Score</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReviews.map((rev) => {
                                const statusUI = getStatusUI(rev.status);
                                const empName = rev.employee_name || rev.employee?.username || 'Employee';
                                return (
                                    <tr key={rev.id}>
                                        <td>
                                            <div className="emp-profile-row">
                                                <div className="emp-avatar">{empName.charAt(0)}</div>
                                                <div className="paradigm-name-wrap">
                                                    <h4>{empName}</h4>
                                                    <span className="paradigm-meta">ID: {rev.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-step-pill ${statusUI.class}`}>
                                                <div className="status-dot" />
                                                {statusUI.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-black text-slate-400">{rev.self_rating || '--'}</span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-black text-indigo-500">{rev.manager_rating || '--'}</span>
                                        </td>
                                        <td>
                                            <button 
                                                className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 font-black text-[0.65rem] uppercase tracking-widest"
                                                onClick={() => setModal({ isOpen: true, review: rev })}
                                            >
                                                {rev.status === 'completed' ? <Eye size={16} /> : <Edit3 size={16} />}
                                                {rev.status === 'completed' ? 'View' : 'Rate Now'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[2.25rem] shadow-sm border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <Activity size={64} className="text-slate-100 dark:text-slate-800 mb-6" />
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Review matrix is void</h2>
                    <p className="text-slate-400 font-bold mt-2 text-center max-w-xs">There are no active assessments scheduled for the current cycle.</p>
                </div>
            )}

            {/* Final Assessment Modal */}
            <AssessmentModal 
                isOpen={modal.isOpen}
                review={modal.review}
                onClose={() => setModal({ isOpen: false, review: null })}
                onSubmit={handleReviewSubmit}
            />

            {/* Notification Toast */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[500] animate-in slide-in-from-right duration-300">
                    <div className="px-8 py-5 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                        {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" size={24} /> : <AlertCircle className="text-rose-400" size={24} />}
                        <span className="font-extrabold text-sm uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
