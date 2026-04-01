import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, CheckCircle2, Circle, Clock, User, 
    AlertCircle, ChevronRight, Loader2, Calendar
} from 'lucide-react';
import { getEmployeeOnboardingProgress, updateEmployeeOnboardingStep } from '@/api/api_clientadmin';
import './ProfileOnboarding.css';

const ProfileOnboarding = ({ employeeId }) => {
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (employeeId) {
            fetchProgress();
        }
    }, [employeeId]);

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const res = await getEmployeeOnboardingProgress(employeeId);
            setSteps(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching onboarding progress:', err);
            setError('Failed to load onboarding progress.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStep = async (stepId, currentStatus) => {
        setUpdating(stepId);
        try {
            await updateEmployeeOnboardingStep(stepId, { is_completed: !currentStatus });
            // Local update for better UX
            setSteps(prev => prev.map(step => 
                step.id === stepId 
                    ? { ...step, is_completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null } 
                    : step
            ));
            // Refresh to get full data from backend (completed_by etc)
            fetchProgress();
        } catch (err) {
            console.error('Error updating step:', err);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="onboarding-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading onboarding checklist...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="onboarding-error">
                <AlertCircle size={40} />
                <p>{error}</p>
                <button onClick={fetchProgress} className="retry-btn">Retry</button>
            </div>
        );
    }

    if (steps.length === 0) {
        return (
            <div className="onboarding-empty">
                <ClipboardList size={48} />
                <h3>No Onboarding assigned</h3>
                <p>This employee hasn't been assigned an onboarding template yet.</p>
            </div>
        );
    }

    const completedCount = steps.filter(s => s.is_completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="profile-onboarding">
            {/* Header & Progress */}
            <div className="onboarding-header-card animate-slide-up">
                <div className="header-info">
                    <h3>Onboarding Progress</h3>
                    <div className="progress-stats">
                        <span className="count">{completedCount} of {steps.length} steps completed</span>
                        <span className="percent">{progressPercent}%</span>
                    </div>
                </div>
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>

            {/* Steps List */}
            <div className="onboarding-steps-list">
                {steps.map((step, index) => (
                    <div 
                        key={step.id} 
                        className={`onboarding-step-card animate-fade-in ${step.is_completed ? 'completed' : ''}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="step-main">
                            <button 
                                className={`step-checkbox ${step.is_completed ? 'checked' : ''}`}
                                onClick={() => handleToggleStep(step.id, step.is_completed)}
                                disabled={updating === step.id}
                            >
                                {updating === step.id ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : step.is_completed ? (
                                    <CheckCircle2 size={24} />
                                ) : (
                                    <Circle size={24} />
                                )}
                            </button>
                            
                            <div className="step-content">
                                <div className="step-top">
                                    <span className="step-order">Step {index + 1}</span>
                                    <h4>{step.step_name}</h4>
                                </div>
                                {step.notes && <p className="step-notes">{step.notes}</p>}
                                
                                {step.is_completed && (
                                    <div className="step-meta">
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>{new Date(step.completed_at).toLocaleDateString()}</span>
                                        </div>
                                        {step.completed_by_name && (
                                            <div className="meta-item">
                                                <User size={14} />
                                                <span>{step.completed_by_name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileOnboarding;
