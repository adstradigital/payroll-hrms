'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, User, Briefcase, Clock,
    AlertCircle, Loader2, ExternalLink,
    CheckCircle2, XCircle, HelpCircle
} from 'lucide-react';
import { getInterviews } from '@/api/api_clientadmin';
import './ProfileInterview.css';

export default function ProfileInterview({ employeeId, employeeUserId }) {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (employeeUserId || employeeId) {
            fetchInterviews();
        }
    }, [employeeUserId, employeeId]);

    const fetchInterviews = async () => {
        setLoading(true);
        setError(null);
        try {
            // Interviews are filtered by interviewer (User ID), not Employee ID.
            const resolvedUserId = employeeUserId?.id || employeeUserId || null;
            if (!resolvedUserId) {
                if (employeeId) {
                    const fallbackRes = await getInterviews({ employee_id: employeeId });
                    setInterviews(fallbackRes.data.results || fallbackRes.data || []);
                    setLoading(false);
                    return;
                }
                setInterviews([]);
                setError('No linked user account found. Please connect a user account to view interview history.');
                setLoading(false);
                return;
            }
            const res = await getInterviews({ interviewer_id: resolvedUserId });
            setInterviews(res.data.results || res.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching interviews:', err);
            setError('We couldn’t load interview history. Please try again in a moment.');
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'status-scheduled';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'pending': return 'status-pending';
            default: return 'status-default';
        }
    };

    const getResultIcon = (result) => {
        switch (result?.toLowerCase()) {
            case 'pass': return <CheckCircle2 size={16} className="result-pass" />;
            case 'fail': return <XCircle size={16} className="result-fail" />;
            case 'hold': return <HelpCircle size={16} className="result-hold" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="profile-interview-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading interviews...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-interview-error">
                <AlertCircle size={32} />
                <p>{error}</p>
                <button onClick={fetchInterviews} className="btn btn-outline btn-sm">Retry</button>
            </div>
        );
    }

    return (
        <div className="profile-interview-container animate-fade-in">
            <div className="card-header-flex">
                <h3 className="section-title">Interview History</h3>
                <span className="count-badge">{interviews.length} Interviews</span>
            </div>

            {interviews.length === 0 ? (
                <div className="interview-empty-state">
                    <Calendar size={48} className="empty-icon" />
                    <h4>No Interviews Found</h4>
                    <p>This employee hasn't conducted any interviews yet.</p>
                </div>
            ) : (
                <div className="interview-list">
                    {interviews.map((interview) => (
                        <div key={interview.id} className="interview-card">
                            <div className="interview-main">
                                <div className="candidate-info">
                                    <div className="info-icon">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="candidate-name">
                                            {interview.candidate_name || 'Anonymous Candidate'}
                                            {getResultIcon(interview.result)}
                                        </div>
                                        <div className="job-title">
                                            <Briefcase size={14} />
                                            {interview.job_opening_name || 'General Opening'}
                                        </div>
                                    </div>
                                </div>

                                <div className="interview-details">
                                    <div className="detail-item">
                                        <Calendar size={14} />
                                        <span>{new Date(interview.scheduled_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <Clock size={14} />
                                        <span>{new Date(interview.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="interview-actions">
                                    <span className={`status-badge ${getStatusStyle(interview.status)}`}>
                                        {interview.status}
                                    </span>
                                    <button className="icon-btn" title="View Details">
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            </div>

                            {interview.feedback && (
                                <div className="interview-feedback">
                                    <strong>Feedback Summary:</strong>
                                    <p>{interview.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
