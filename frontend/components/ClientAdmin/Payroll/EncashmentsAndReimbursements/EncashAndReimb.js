import React, { useState, useEffect } from 'react';
import {
    getReimbursementRequests, createReimbursementRequest, updateReimbursementRequest,
    getEncashmentRequests, createEncashmentRequest, updateEncashmentRequest,
    getAllEmployees, getLeaveTypes
} from '../../../../api/api_clientadmin';
import './EncashAndReimb.css';
import { Plus, Check, X, FileText, DollarSign, Calendar, Upload } from 'lucide-react';

const EncashAndReimb = () => {
    const [activeTab, setActiveTab] = useState('reimbursement');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        employee: '',
        amount: '',
        request_date: new Date().toISOString().split('T')[0],
        description: '',
        attachment: null,
        leave_type: '',
        encashment_days: '',
        reason: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        if (showModal) {
            loadDependencies();
        }
    }, [showModal]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'reimbursement') {
                res = await getReimbursementRequests();
            } else {
                res = await getEncashmentRequests();
            }
            setRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDependencies = async () => {
        try {
            const empRes = await getAllEmployees();
            setEmployees(empRes.data.results || empRes.data);

            if (activeTab === 'encashment') {
                const ltRes = await getLeaveTypes();
                setLeaveTypes(ltRes.data);
            }
        } catch (error) {
            console.error("Failed to load form dependencies", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'reimbursement') {
                const data = new FormData();
                data.append('employee', formData.employee);
                data.append('amount', formData.amount);
                data.append('request_date', formData.request_date);
                data.append('description', formData.description);
                if (formData.attachment) {
                    data.append('attachment', formData.attachment);
                }
                await createReimbursementRequest(data);
            } else {
                await createEncashmentRequest({
                    employee: formData.employee,
                    leave_type: formData.leave_type,
                    encashment_days: formData.encashment_days,
                    reason: formData.reason
                });
            }
            setShowModal(false);
            setFormData({
                employee: '', amount: '', request_date: new Date().toISOString().split('T')[0],
                description: '', attachment: null, leave_type: '', encashment_days: '', reason: ''
            });
            fetchData();
        } catch (error) {
            alert("Failed to create request: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this request?`)) return;

        try {
            if (activeTab === 'reimbursement') {
                await updateReimbursementRequest(id, { status: newStatus });
            } else {
                await updateEncashmentRequest(id, { status: newStatus });
            }
            fetchData();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const StatusBadge = ({ status }) => (
        <span className={`er-badge ${status.toLowerCase()}`}>
            {status === 'approved' && <Check size={12} />}
            {status === 'rejected' && <X size={12} />}
            {status === 'pending' && <Calendar size={12} />}
            {status}
        </span>
    );

    return (
        <div className="er-container">
            <div className="er-header">
                <div>
                    <h1 className="er-title">Encashments & Reimbursements</h1>
                    <p className="text-muted text-sm mt-1">Manage financial requests from employees</p>
                </div>
            </div>

            <div className="er-tabs">
                <button
                    className={`er-tab ${activeTab === 'reimbursement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reimbursement')}
                >
                    Reimbursements
                </button>
                <button
                    className={`er-tab ${activeTab === 'encashment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('encashment')}
                >
                    Leave Encashments
                </button>
            </div>

            <div className="er-toolbar">
                <div className="text-muted text-sm">
                    Showing {requests.length} requests
                </div>
                <button className="er-btn-create" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Request
                </button>
            </div>

            <div className="er-table-wrapper">
                <table className="er-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>{activeTab === 'reimbursement' ? 'Date' : 'Leave Type'}</th>
                            <th>{activeTab === 'reimbursement' ? 'Amount' : 'Days'}</th>
                            <th>Description/Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colspan="6" className="text-center py-8 text-muted">No requests found</td>
                            </tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="font-bold">{req.employee_name}</div>
                                        <div className="text-xs text-muted">{req.employee_code}</div>
                                    </td>
                                    <td>
                                        {activeTab === 'reimbursement'
                                            ? new Date(req.request_date).toLocaleDateString()
                                            : <span className="text-brand">{req.leave_type_name}</span>
                                        }
                                    </td>
                                    <td className="font-mono font-bold">
                                        {activeTab === 'reimbursement'
                                            ? `₹${parseFloat(req.amount).toLocaleString()}`
                                            : `${req.encashment_days} Days`
                                        }
                                    </td>
                                    <td className="max-w-xs truncate" title={req.description || req.reason}>
                                        {req.description || req.reason}
                                        {req.attachment && (
                                            <a href={req.attachment} target="_blank" rel="noreferrer" className="block text-xs text-brand mt-1 flex items-center gap-1">
                                                <FileText size={10} /> View Receipt
                                            </a>
                                        )}
                                    </td>
                                    <td><StatusBadge status={req.status} /></td>
                                    <td>
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                                    className="p-1 rounded bg-green-900/30 text-green-500 hover:bg-green-900/50"
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                                    className="p-1 rounded bg-red-900/30 text-red-500 hover:bg-red-900/50"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="er-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
                    <div className="er-modal">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            New {activeTab === 'reimbursement' ? 'Reimbursement' : 'Encashment'} Request
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="er-form-group">
                                <label>Employee</label>
                                <select
                                    name="employee"
                                    className="er-select"
                                    value={formData.employee}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.employee_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {activeTab === 'reimbursement' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="er-form-group">
                                            <label>Amount (₹)</label>
                                            <input
                                                type="number"
                                                name="amount"
                                                className="er-input"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="er-form-group">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                name="request_date"
                                                className="er-input"
                                                value={formData.request_date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="er-form-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            className="er-textarea"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="er-form-group">
                                        <label>Receipt (Optional)</label>
                                        <div className="border border-dashed border-gray-600 rounded p-4 text-center cursor-pointer hover:border-brand-primary transition-colors relative">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-muted">
                                                <Upload size={20} />
                                                <span className="text-sm">{formData.attachment ? formData.attachment.name : "Click to upload file"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="er-form-group">
                                        <label>Leave Type</label>
                                        <select
                                            name="leave_type"
                                            className="er-select"
                                            value={formData.leave_type}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Leave Type</option>
                                            {leaveTypes.filter(lt => lt.is_encashable).map(lt => (
                                                <option key={lt.id} value={lt.id}>
                                                    {lt.name} (Encashable)
                                                </option>
                                            ))}
                                            {/* Show others disabled or filter out? Filtered 'is_encashable' */}
                                        </select>
                                    </div>
                                    <div className="er-form-group">
                                        <label>Days to Encash</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            name="encashment_days"
                                            className="er-input"
                                            value={formData.encashment_days}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="er-form-group">
                                        <label>Reason</label>
                                        <textarea
                                            name="reason"
                                            className="er-textarea"
                                            rows="3"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            required
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            <div className="er-modal-actions">
                                <button type="button" className="er-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="er-btn-submit">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EncashAndReimb;
