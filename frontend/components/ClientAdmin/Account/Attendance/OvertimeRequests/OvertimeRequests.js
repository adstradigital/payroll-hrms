'use client';

import { useState, useEffect } from 'react';
import { 
    Clock, CheckCircle, Search, Filter, 
    Plus, X, Loader2, Check, Calendar, 
    Download, AlertTriangle, AlertCircle,
    ArrowRight, Info, RefreshCw, Trash2,
    Sparkles, MoreHorizontal, DollarSign,
    FileText
} from 'lucide-react';
import attendanceApi from '@/api/attendance_api';
import { getAllEmployees } from '@/api/api_clientadmin';
import './OvertimeRequests.css';

export default function OvertimeRequests() {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        total_calculated: 0,
        pending_review: 0,
        policy_flags: 0,
        estimated_cost: 0
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [viewDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const month = viewDate.getMonth() + 1;
            const year = viewDate.getFullYear();
            
            const [reqRes, statRes, empRes] = await Promise.all([
                attendanceApi.getOvertimeRequests({ month, year }),
                attendanceApi.getOvertimeStats({ month, year }),
                getAllEmployees()
            ]);
            
            setRequests(reqRes.data?.results || reqRes.data || []);
            setStats(statRes.data || {});
            setEmployees(empRes.data?.results || empRes.data || []);
        } catch (err) {
            console.error('Error fetching overtime data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-');
        setViewDate(new Date(year, month - 1));
    };

    const handleAction = async (id, statusType) => {
        setSubmitting(true);
        try {
            if (statusType === 'approved') {
                await attendanceApi.approveOvertime(id);
            } else {
                await attendanceApi.rejectOvertime(id);
            }
            fetchData();
        } catch (err) {
            console.error('Action failed:', err);
            alert('Failed to update request status.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this overtime request?')) return;
        setSubmitting(true);
        try {
            await attendanceApi.deleteOvertimeRequest(id);
            fetchData();
        } catch (err) {
            console.error('Deletion failed:', err);
            alert('Failed to delete request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreate = async (formData) => {
        setSubmitting(true);
        try {
            await attendanceApi.createOvertimeRequest(formData);
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Creation failed:', err);
            alert(err.response?.data?.error || 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    const formattedPeriod = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="overtime-management">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="ot-page-title">Overtime & Exceptions</h1>
                    <p className="ot-page-subtitle">Review OT requests against attendance logs and payroll policies</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="ot-period-picker flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
                        <Calendar size={18} className="text-slate-400 mr-2" />
                        <input
                            type="month"
                            className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                            value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`}
                            onChange={handleMonthChange}
                        />
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                        <RefreshCw size={18} /> Run Payroll Sync
                    </button>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="ot-stats-grid">
                <div className="ot-stat-card ot-card-blue">
                    <div>
                        <div className="ot-stat-label">Total OT Calculated</div>
                        <div className="ot-stat-value">
                            {stats.total_calculated || 0}
                            <span className="ot-stat-unit">hrs</span>
                        </div>
                    </div>
                    <div className="ot-stat-icon-wrapper">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="ot-stat-card ot-card-orange">
                    <div>
                        <div className="ot-stat-label">Pending Review</div>
                        <div className="ot-stat-value">
                            {stats.pending_review || 0}
                            <span className="ot-stat-unit">requests</span>
                        </div>
                    </div>
                    <div className="ot-stat-icon-wrapper">
                        <FileText size={20} />
                    </div>
                </div>
                <div className="ot-stat-card ot-card-red">
                    <div>
                        <div className="ot-stat-label">Policy Flags</div>
                        <div className="ot-stat-value">
                            {stats.policy_flags || 0}
                            <span className="ot-stat-unit">discrepancies</span>
                        </div>
                    </div>
                    <div className="ot-stat-icon-wrapper">
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <div className="ot-stat-card ot-card-green">
                    <div>
                        <div className="ot-stat-label">Estimated OT Cost</div>
                        <div className="ot-stat-value">
                            <span className="text-emerald-500 mr-0.5">$</span>
                            {stats.estimated_cost?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div className="ot-stat-icon-wrapper">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>

            {/* Timesheet Verification Table */}
            <div className="ot-verification-card">
                <div className="ot-table-header">
                    <h3 className="ot-table-title">Timesheet Verification</h3>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                        >
                            <Plus size={18} /> Add Record
                        </button>
                        <button className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                            <Download size={18} /> Export Log
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="ot-table">
                        <thead>
                            <tr>
                                <th>Employee & Date</th>
                                <th>Attendance Match</th>
                                <th>OT Hours & Rate</th>
                                <th>Policy Check</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-20 text-slate-400 font-medium"><Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={32} /> Synchronizing timesheet data...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-20 text-slate-500 font-medium">No overtime records flagged for {formattedPeriod}</td></tr>
                            ) : requests.map(row => (
                                <tr key={row.id}>
                                    <td>
                                        <div className="ot-emp-cell">
                                            <div className="ot-avatar">
                                                {row.employee_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="ot-emp-name">{row.employee_name}</div>
                                                <div className="ot-emp-date">{row.date}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ot-match-container">
                                            <div className="ot-match-row">
                                                <span className="ot-match-label">Scheduled:</span> 
                                                <span className="ot-match-val">{row.attendance_match?.scheduled}</span>
                                            </div>
                                            <div className="ot-match-row">
                                                <span className="ot-match-label">Clock I/O:</span> 
                                                <span className={`ot-match-val ${row.attendance_match?.clock === 'No Punch' ? 'text-red-500' : 'blue'}`}>
                                                    {row.attendance_match?.clock}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ot-calc-container">
                                            <span className="ot-req-val">Req: {row.hours_requested}h</span>
                                            <ArrowRight size={14} className="ot-arrow" />
                                            <span className={`ot-calc-tag ${row.policy_status === 'verified' ? 'valid' : 'invalid'}`}>
                                                Calc: {row.calculated_ot}h
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">@ 1.5x (Regular OT)</div>
                                    </td>
                                    <td>
                                        {row.policy_status === 'verified' && (
                                            <div className="ot-policy-box verified">
                                                <CheckCircle size={14} className="mt-0.5" />
                                                <div>
                                                    <span className="ot-policy-title">Verified</span>
                                                    <span className="ot-policy-subtitle">Matches attendance log</span>
                                                </div>
                                            </div>
                                        )}
                                        {row.policy_status === 'mismatch' && (
                                            <div className="ot-policy-box mismatch">
                                                <AlertCircle size={14} className="mt-0.5" />
                                                <div>
                                                    <span className="ot-policy-title">Mismatch</span>
                                                    <span className="ot-policy-subtitle">Requested hours exceed attendance</span>
                                                </div>
                                            </div>
                                        )}
                                        {row.policy_status === 'cap_warning' && (
                                            <div className="ot-policy-box warning">
                                                <AlertTriangle size={14} className="mt-0.5" />
                                                <div>
                                                    <span className="ot-policy-title">Cap Warning</span>
                                                    <span className="ot-policy-subtitle">Exceeds daily max OT policy</span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`ot-status-pill ${row.status === 'pending' ? 'reviewing' : row.status}`}>
                                            {row.status === 'pending' ? <Clock size={12} /> : row.status === 'approved' ? <Check size={12} /> : <X size={12} />}
                                            {row.status === 'pending' ? 'Reviewing' : row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            {row.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleAction(row.id, 'approved')}
                                                        disabled={submitting}
                                                        className="ot-action-btn hover:text-emerald-600"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(row.id, 'rejected')}
                                                        disabled={submitting}
                                                        className="ot-action-btn hover:text-rose-600"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(row.id)}
                                                disabled={submitting}
                                                className="ot-action-btn hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vertical Side Tab */}
            <div className="attendance-side-tab">
                <MoreHorizontal size={14} />
                ATTENDANCE
            </div>

            {/* Floating Action Buttons */}
            <div className="fab-stack">
                <button className="ot-fab secondary" title="Automation Actions">
                    <Sparkles size={20} />
                </button>
                <button className="ot-fab" onClick={() => setShowModal(true)} title="Add New Request">
                    <Plus size={28} />
                </button>
            </div>

            {showModal && (
                <CreateOTModal 
                    employees={employees} 
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreate}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function CreateOTModal({ employees, onClose, onSubmit, submitting }) {
    const [form, setForm] = useState({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        hours_requested: '',
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="modal-overlay fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Apply Overtime</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Attendance Record</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Employee</label>
                        <select 
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-slate-700 dark:text-white font-bold transition-all"
                            required
                            value={form.employee}
                            onChange={e => setForm({...form, employee: e.target.value})}
                        >
                            <option value="">Search for employee...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-slate-700 dark:text-white font-bold transition-all"
                                required
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">OT Hours</label>
                            <input 
                                type="number" 
                                step="0.5" 
                                placeholder="0.0" 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-slate-700 dark:text-white font-bold transition-all"
                                required
                                value={form.hours_requested}
                                onChange={e => setForm({...form, hours_requested: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason / Justification</label>
                        <textarea 
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-slate-700 dark:text-white font-semibold min-h-[120px] transition-all"
                            placeholder="Briefly explain why this OT was required..."
                            required
                            value={form.reason}
                            onChange={e => setForm({...form, reason: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
