import { useState, useEffect } from 'react';
import {
    Clock, Briefcase, MapPin,
    Calendar, Loader2, AlertCircle,
    History, ArrowRightLeft, User
} from 'lucide-react';
import { getShiftAssignments, getShiftRequests, getWorkTypeRequests } from '@/api/api_clientadmin';
import './ProfileWorkShift.css';

export default function ProfileWorkShift({ employeeId, employee }) {
    const [shiftAssignment, setShiftAssignment] = useState(null);
    const [shiftRequests, setShiftRequests] = useState([]);
    const [workTypeRequests, setWorkTypeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (employeeId) {
            fetchWorkShiftData();
        }
    }, [employeeId]);

    const fetchWorkShiftData = async () => {
        try {
            setLoading(true);
            const [shiftRes, shiftReqRes, workReqRes] = await Promise.all([
                getShiftAssignments({ employee: employeeId, is_active: true }),
                getShiftRequests({ employee: employeeId }),
                getWorkTypeRequests({ employee: employeeId })
            ]);

            setShiftAssignment(shiftRes.data.results?.[0] || null);
            setShiftRequests(shiftReqRes.data.results || []);
            setWorkTypeRequests(workReqRes.data.results || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching work & shift details:', err);
            setError('Failed to load work and shift information');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="workshift-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading work & shift data...</p>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', class: 'status-pending' },
            approved: { label: 'Approved', class: 'status-approved' },
            rejected: { label: 'Rejected', class: 'status-rejected' },
            cancelled: { label: 'Cancelled', class: 'status-cancelled' },
        };
        return badges[status] || { label: status, class: '' };
    };

    return (
        <div className="profile-workshift-container animate-fade-in">
            {/* Current Configuration */}
            <div className="workshift-main-grid">
                {/* Employment Details */}
                <section className="workshift-section">
                    <div className="section-header">
                        <Briefcase size={20} />
                        <h3>Employment Details</h3>
                    </div>
                    <div className="details-card">
                        <div className="detail-item">
                            <span className="detail-label">Employment Type</span>
                            <span className="detail-value text-capitalize">{employee?.employment_type || 'Permanent'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Work Location</span>
                            <span className="detail-value">
                                <MapPin size={14} /> {employee?.work_location || (employee?.is_remote_employee ? 'Remote' : 'Office')}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Joined On</span>
                            <span className="detail-value">{employee?.date_of_joining}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Probation Period</span>
                            <span className="detail-value">{employee?.probation_period_months} Months</span>
                        </div>
                        {employee?.confirmation_date && (
                            <div className="detail-item">
                                <span className="detail-label">Confirmation Date</span>
                                <span className="detail-value">{employee?.confirmation_date}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Current Shift */}
                <section className="workshift-section">
                    <div className="section-header">
                        <Clock size={20} />
                        <h3>Active Shift</h3>
                    </div>
                    {shiftAssignment ? (
                        <div className="shift-card" style={{ borderColor: shiftAssignment.shift_color || 'var(--brand-primary)' }}>
                            <div className="shift-info">
                                <div className="shift-name">{shiftAssignment.shift_name}</div>
                                <div className="shift-time">
                                    {shiftAssignment.shift_start_time} - {shiftAssignment.shift_end_time}
                                </div>
                                <div className="shift-meta">
                                    <span>Effective From: {shiftAssignment.effective_from}</span>
                                </div>
                            </div>
                            <div className="shift-icon-bg">
                                <Clock size={48} />
                            </div>
                        </div>
                    ) : (
                        <div className="empty-shift-card">
                            <AlertCircle size={24} />
                            <p>No active shift assigned.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Request History */}
            <div className="workshift-history-grid">
                {/* Shift Requests */}
                <section className="workshift-section">
                    <div className="section-header">
                        <History size={18} />
                        <h3>Shift Change Requests</h3>
                    </div>
                    <div className="history-list-lite">
                        {shiftRequests.length === 0 ? (
                            <p className="empty-text">No shift change requests.</p>
                        ) : (
                            shiftRequests.map(req => (
                                <div key={req.id} className="history-item-lite">
                                    <div className="item-main">
                                        <div className="item-title">Requested Shift: {req.requested_shift_name}</div>
                                        <div className="item-date">Applied on {new Date(req.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`status-pill pill-sm ${getStatusBadge(req.status).class}`}>
                                        {getStatusBadge(req.status).label}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Work Type Requests */}
                <section className="workshift-section">
                    <div className="section-header">
                        <ArrowRightLeft size={18} />
                        <h3>Work Type Requests</h3>
                    </div>
                    <div className="history-list-lite">
                        {workTypeRequests.length === 0 ? (
                            <p className="empty-text">No work type requests.</p>
                        ) : (
                            workTypeRequests.map(req => (
                                <div key={req.id} className="history-item-lite">
                                    <div className="item-main">
                                        <div className="item-title">Type: {req.requested_work_type}</div>
                                        <div className="item-date">{req.reason}</div>
                                    </div>
                                    <span className={`status-pill pill-sm ${getStatusBadge(req.status).class}`}>
                                        {getStatusBadge(req.status).label}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
