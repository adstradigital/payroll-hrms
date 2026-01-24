import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getAllLeaves, approveLeave, rejectLeave, getMyProfile, getLeaveTypes, cancelLeave } from '@/api/api_clientadmin';
import ApplyLeaveModal from './ApplyLeaveModal';
import './LeaveList.css';

export default function LeaveList() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentUser, setCurrentUser] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const isAdmin = currentUser?.is_staff || currentUser?.is_admin || currentUser?.role === 'admin';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [leavesRes, profileRes, typesRes] = await Promise.all([
                getAllLeaves(),
                getMyProfile(),
                getLeaveTypes()
            ]);
            // Check if response is paginated (DRF usually returns { results: [], ... })
            const leavesData = leavesRes.data.results || (Array.isArray(leavesRes.data) ? leavesRes.data : []);
            const typesData = typesRes.data.results || (Array.isArray(typesRes.data) ? typesRes.data : []);
            setLeaveRequests(leavesData);
            // profileRes.data structure is { success: true, employee: {...} }
            setCurrentUser(profileRes.data.employee || profileRes.data);
            setLeaveTypes(typesData);
            setError(null);
        } catch (err) {
            console.error('Error fetching leave data:', err);
            setError('Failed to load leave requests. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await getAllLeaves();
            const leavesData = res.data.results || (Array.isArray(res.data) ? res.data : []);
            setLeaveRequests(leavesData);
        } catch (err) {
            console.error('Error refreshing leaves:', err);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', class: 'badge-warning' },
            approved: { label: 'Approved', class: 'badge-success' },
            rejected: { label: 'Rejected', class: 'badge-danger' },
            cancelled: { label: 'Cancelled', class: 'badge-secondary' },
        };
        return badges[status] || { label: status, class: '' };
    };

    const filteredRequests = (leaveRequests || []).filter(request => {
        const name = request.employee_name || '';
        const empId = request.employee_id_display || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            empId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleApprove = async (id) => {
        try {
            setProcessingId(id);
            await approveLeave(id, currentUser?.id);
            await fetchLeaves();
        } catch (err) {
            console.error('Error approving leave:', err);
            alert('Failed to approve leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Please enter a reason for rejection:');
        if (reason === null) return; // Cancelled prompt

        try {
            setProcessingId(id);
            await rejectLeave(id, reason);
            await fetchLeaves();
        } catch (err) {
            console.error('Error rejecting leave:', err);
            alert('Failed to reject leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            setProcessingId(id);
            await cancelLeave(id);
            await fetchLeaves();
        } catch (err) {
            console.error('Error cancelling leave:', err);
            alert('Failed to cancel leave request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleApplyLeaveSuccess = () => {
        // Refresh the leave list after successful submission
        fetchLeaves();
    };

    if (loading) {
        return (
            <div className="leave-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading leave requests...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leave-error">
                <XCircle size={40} />
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchInitialData}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="leave-list">
            {/* Toolbar */}
            <div className="leave-toolbar">
                <div className="leave-toolbar__left">
                    <div className="leave-search">
                        <Search size={18} className="leave-search__icon" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            className="leave-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="leave-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="leave-toolbar__right">
                    <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
                        <Plus size={18} />
                        Apply Leave
                    </button>
                </div>
            </div>

            {/* Leave Request Cards */}
            <div className="leave-cards">
                {filteredRequests.length === 0 ? (
                    <div className="leave-empty">
                        <Calendar size={48} />
                        <p>No leave requests found.</p>
                    </div>
                ) : (
                    filteredRequests.map(request => {
                        const badge = getStatusBadge(request.status);
                        const isProcessing = processingId === request.id;

                        return (
                            <div key={request.id} className="leave-card">
                                <div className="leave-card__header">
                                    <div className="leave-card__employee">
                                        <div className="leave-card__avatar">
                                            {(request.employee_name || 'E').split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="leave-card__employee-info">
                                            <span className="leave-card__name">{request.employee_name}</span>
                                            <span className="leave-card__id">{request.employee_id_display}</span>
                                        </div>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                                </div>

                                <div className="leave-card__body">
                                    <div className="leave-card__type">{request.leave_type_name}</div>
                                    <div className="leave-card__dates">
                                        <Calendar size={14} />
                                        <span>{request.start_date} to {request.end_date}</span>
                                        <span className="leave-card__days">({request.days_count} days)</span>
                                    </div>
                                    <div className="leave-card__reason">
                                        <strong>Reason:</strong> {request.reason}
                                    </div>
                                    {request.rejection_reason && (
                                        <div className="leave-card__rejection">
                                            <strong>Rejection Reason:</strong> {request.rejection_reason}
                                        </div>
                                    )}
                                </div>

                                {['pending', 'approved'].includes(request.status) && (
                                    <div className="leave-card__actions" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
                                        {request.status === 'pending' && isAdmin && (
                                            <>
                                                <button
                                                    className="leave-action-btn leave-action-btn--approve"
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                    Approve
                                                </button>
                                                <button
                                                    className="leave-action-btn leave-action-btn--reject"
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {/* Cancellation for employee (self) or admin */}
                                        <button
                                            className="leave-action-btn"
                                            style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                            onClick={() => handleCancel(request.id)}
                                            disabled={isProcessing}
                                        >
                                            <XCircle size={16} />
                                            {request.status === 'approved' ? 'Withdraw Leave' : 'Cancel Request'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <ApplyLeaveModal
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    currentUser={currentUser}
                    leaveTypes={leaveTypes}
                    onSuccess={handleApplyLeaveSuccess}
                />
            )}
        </div>
    );
}
