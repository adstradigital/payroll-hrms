'use client';

import { useState } from 'react';
import { Search, Plus, Filter, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import './LeaveList.css';

// Mock data
const mockLeaveRequests = [
    { id: 1, employeeId: 'EMP001', name: 'John Doe', leaveType: 'Casual Leave', startDate: '2026-01-20', endDate: '2026-01-22', days: 3, reason: 'Family function', status: 'pending' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', leaveType: 'Sick Leave', startDate: '2026-01-15', endDate: '2026-01-16', days: 2, reason: 'Medical checkup', status: 'approved' },
    { id: 3, employeeId: 'EMP003', name: 'Mike Johnson', leaveType: 'Earned Leave', startDate: '2026-01-25', endDate: '2026-01-30', days: 6, reason: 'Vacation', status: 'pending' },
    { id: 4, employeeId: 'EMP004', name: 'Sarah Wilson', leaveType: 'Casual Leave', startDate: '2026-01-18', endDate: '2026-01-18', days: 1, reason: 'Personal work', status: 'rejected' },
];

export default function LeaveList() {
    const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', class: 'badge-warning' },
            approved: { label: 'Approved', class: 'badge-success' },
            rejected: { label: 'Rejected', class: 'badge-danger' },
        };
        return badges[status] || { label: status, class: '' };
    };

    const filteredRequests = leaveRequests.filter(request => {
        const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleApprove = (id) => {
        setLeaveRequests(prev =>
            prev.map(req => req.id === id ? { ...req, status: 'approved' } : req)
        );
    };

    const handleReject = (id) => {
        setLeaveRequests(prev =>
            prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req)
        );
    };

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
                    </select>
                </div>

                <div className="leave-toolbar__right">
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Apply Leave
                    </button>
                </div>
            </div>

            {/* Leave Request Cards */}
            <div className="leave-cards">
                {filteredRequests.map(request => {
                    const badge = getStatusBadge(request.status);
                    return (
                        <div key={request.id} className="leave-card">
                            <div className="leave-card__header">
                                <div className="leave-card__employee">
                                    <div className="leave-card__avatar">
                                        {request.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="leave-card__employee-info">
                                        <span className="leave-card__name">{request.name}</span>
                                        <span className="leave-card__id">{request.employeeId}</span>
                                    </div>
                                </div>
                                <span className={`badge ${badge.class}`}>{badge.label}</span>
                            </div>

                            <div className="leave-card__body">
                                <div className="leave-card__type">{request.leaveType}</div>
                                <div className="leave-card__dates">
                                    <Calendar size={14} />
                                    <span>{request.startDate} to {request.endDate}</span>
                                    <span className="leave-card__days">({request.days} days)</span>
                                </div>
                                <div className="leave-card__reason">
                                    <strong>Reason:</strong> {request.reason}
                                </div>
                            </div>

                            {request.status === 'pending' && (
                                <div className="leave-card__actions">
                                    <button
                                        className="leave-action-btn leave-action-btn--approve"
                                        onClick={() => handleApprove(request.id)}
                                    >
                                        <CheckCircle size={16} />
                                        Approve
                                    </button>
                                    <button
                                        className="leave-action-btn leave-action-btn--reject"
                                        onClick={() => handleReject(request.id)}
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
