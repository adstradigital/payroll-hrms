'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, CheckCircle, XCircle, MoreVertical, Loader, AlertCircle, User } from 'lucide-react';
import './AttendanceRequests.css';
import attendanceApi from '@/api/attendance_api';
import { getAllEmployees } from '@/api/api_clientadmin';

const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

export default function AttendanceRequests() {
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load requests and employees from backend
    useEffect(() => {
        fetchRequests();
        fetchEmployees();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await attendanceApi.getRegularizationRequests();
            const data = response.data.results || response.data;
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to load attendance requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await getAllEmployees();
            const data = response.data.results || response.data;
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const filteredRequests = requests.filter(req => {
        const employeeName = req.employee_name?.toLowerCase() || '';
        const employeeId = req.employee_id?.toLowerCase() || '';

        if (!employeeName.includes(search.toLowerCase()) &&
            !employeeId.includes(search.toLowerCase())) return false;

        if (activeTab !== 'all' && req.status !== activeTab) return false;
        return true;
    });

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (e) => {
        setSelected(e.target.checked ? filteredRequests.map(r => r.id) : []);
    };

    const updateRequestStatus = async (id, newStatus, comments = '') => {
        try {
            setSubmitting(true);
            const data = { comments };

            if (newStatus === STATUS.APPROVED) {
                await attendanceApi.approveRequest(id, data);
            } else if (newStatus === STATUS.REJECTED) {
                await attendanceApi.rejectRequest(id, data);
            }

            // Update local state
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
            setError('');
        } catch (err) {
            console.error('Error updating request:', err);
            setError('Failed to update request');
        } finally {
            setSubmitting(false);
        }
    };

    const bulkUpdate = async (newStatus) => {
        try {
            setSubmitting(true);

            for (const id of selected) {
                if (newStatus === STATUS.APPROVED) {
                    await attendanceApi.approveRequest(id);
                } else if (newStatus === STATUS.REJECTED) {
                    await attendanceApi.rejectRequest(id);
                }
            }

            // Update local state
            setRequests(prev => prev.map(req =>
                selected.includes(req.id) ? { ...req, status: newStatus } : req
            ));
            setSelected([]);
            setError('');
        } catch (err) {
            console.error('Error updating requests:', err);
            setError('Failed to update some requests');
        } finally {
            setSubmitting(false);
        }
    };

    const addRequest = async (newReq) => {
        try {
            setSubmitting(true);
            const payload = {
                employee: newReq.employee,
                request_type: newReq.requestType || 'full_day',
                requested_check_in: newReq.checkIn ? new Date(`${newReq.date}T${newReq.checkIn}`).toISOString() : null,
                requested_check_out: newReq.checkOut ? new Date(`${newReq.date}T${newReq.checkOut}`).toISOString() : null,
                reason: newReq.reason || '',
                attendance_date: newReq.date,
            };

            const response = await attendanceApi.createRegularizationRequest(payload);
            setRequests(prev => [response.data, ...prev]);
            setShowModal(false);
            setError('');
        } catch (err) {
            console.error('Error creating request:', err);
            let errorMessage = 'Failed to create request';
            if (err.response && err.response.data) {
                if (typeof err.response.data === 'object' && err.response.data !== null) {
                    errorMessage = Object.entries(err.response.data)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                        .join(' | ');
                } else {
                    errorMessage = String(err.response.data);
                }
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="attendance-requests">
            {/* Error Alert */}
            {error && (
                <div className="error-alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X size={16} /></button>
                </div>
            )}

            {/* Header */}
            <div className="requests-header">
                <div>
                    <h1>Attendance Requests</h1>
                    <p className="subtitle">Manage employee attendance approvals</p>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)} disabled={submitting}>
                        <Plus size={18} /> New Request
                    </button>
                </div>
            </div>

            {/* Tabs & Bulk Actions */}
            <div className="requests-toolbar">
                <div className="tabs">
                    {['all', 'pending', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="badge">{requests.filter(r => r.status === 'pending').length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {selected.length > 0 && (
                    <div className="bulk-actions">
                        <span>{selected.length} selected</span>
                        <button
                            className="btn-sm success"
                            onClick={() => bulkUpdate(STATUS.APPROVED)}
                            disabled={submitting}
                        >
                            <CheckCircle size={16} /> Approve
                        </button>
                        <button
                            className="btn-sm danger"
                            onClick={() => bulkUpdate(STATUS.REJECTED)}
                            disabled={submitting}
                        >
                            <XCircle size={16} /> Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading-state">
                    <Loader size={32} className="spinner" />
                    <p>Loading attendance requests...</p>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="requests-table-container">
                    {filteredRequests.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={32} />
                            <p>No attendance requests found</p>
                        </div>
                    ) : (
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" onChange={toggleSelectAll} checked={selected.length === filteredRequests.length && filteredRequests.length > 0} /></th>
                                    <th>Employee</th>
                                    <th>Request Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(req => (
                                    <tr key={req.id} className={selected.includes(req.id) ? 'selected' : ''}>
                                        <td><input type="checkbox" checked={selected.includes(req.id)} onChange={() => toggleSelect(req.id)} /></td>
                                        <td>
                                            <div className="employee-info">
                                                <div className="avatar">{(req.employee_name || 'U').split(' ').map((n, i) => i < 2 ? n[0] : '').join('')}</div>
                                                <div>
                                                    <div className="name">{req.employee_name}</div>
                                                    <div className="emp-id">{req.employee_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{req.request_type?.replace('_', ' ') || 'Full Day'}</td>
                                        <td>{req.attendance_date}</td>
                                        <td>
                                            <div className={`status ${req.status}`}>
                                                {req.status}
                                            </div>
                                        </td>
                                        <td>
                                            {req.status === STATUS.PENDING ? (
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn success"
                                                        onClick={() => updateRequestStatus(req.id, STATUS.APPROVED)}
                                                        disabled={submitting}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        className="action-btn danger"
                                                        onClick={() => updateRequestStatus(req.id, STATUS.REJECTED)}
                                                        disabled={submitting}
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="status-locked">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && <CreateModal onClose={() => setShowModal(false)} onSubmit={addRequest} submitting={submitting} employees={employees} />}
        </div>
    );
}

function CreateModal({ onClose, onSubmit, submitting, employees }) {
    const [form, setForm] = useState({
        employee: '',
        date: '',
        checkIn: '',
        checkOut: '',
        requestType: 'full_day',
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form.employee && form.date) {
            onSubmit(form);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create Attendance Request</h3>
                    <button className="close-btn" onClick={onClose} disabled={submitting}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label><User size={14} /> Employee *</label>
                            <select
                                required
                                value={form.employee}
                                onChange={e => setForm({ ...form, employee: e.target.value })}
                                disabled={submitting}
                            >
                                <option value="">Select employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.full_name} ({emp.employee_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Request Type</label>
                            <select
                                value={form.requestType}
                                onChange={e => setForm({ ...form, requestType: e.target.value })}
                                disabled={submitting}
                            >
                                <option value="full_day">Full Day</option>
                                <option value="missed_checkin">Missed Check-in</option>
                                <option value="missed_checkout">Missed Check-out</option>
                                <option value="late_arrival">Late Arrival</option>
                                <option value="early_departure">Early Departure</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Attendance Date *</label>
                        <input
                            type="date"
                            required
                            value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Check In Time</label>
                            <input
                                type="time"
                                value={form.checkIn}
                                onChange={e => setForm({ ...form, checkIn: e.target.value })}
                                disabled={submitting}
                            />
                        </div>

                        <div className="form-group">
                            <label>Check Out Time</label>
                            <input
                                type="time"
                                value={form.checkOut}
                                onChange={e => setForm({ ...form, checkOut: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="Enter reason for request"
                            disabled={submitting}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? <Loader size={16} className="spinner-small" /> : <Plus size={16} />}
                            Create Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}