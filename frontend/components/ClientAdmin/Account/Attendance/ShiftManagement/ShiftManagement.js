'use client';

import { useState, useEffect } from 'react';
import { 
    Clock, CheckCircle, Plus, X, Loader2, Check, 
    Calendar, Download, AlertTriangle, Trash2, 
    Edit2, Moon, Sun, RotateCw, Settings,
    FileText, Activity, Layers, BarChart3
} from 'lucide-react';
import attendanceApi from '@/api/attendance_api';
import './ShiftManagement.css';

export default function ShiftManagement() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await attendanceApi.getShifts();
            setShifts(res.data?.results || res.data || []);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this shift definition? Existing employee assignments will be affected.')) return;
        setSubmitting(true);
        try {
            await attendanceApi.deleteShift(id);
            fetchShifts();
        } catch (err) {
            console.error('Deletion failed:', err);
            alert('Failed to delete shift.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        try {
            if (editingShift) {
                await attendanceApi.updateShift(editingShift.id, formData);
            } else {
                await attendanceApi.createShift(formData);
            }
            setShowModal(false);
            setEditingShift(null);
            fetchShifts();
        } catch (err) {
            console.error('Operation failed:', err);
            alert(err.response?.data?.error || 'Failed to save shift details.');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (shift) => {
        setEditingShift(shift);
        setShowModal(true);
    };

    const stats = {
        total: shifts.length,
        active: shifts.filter(s => s.is_active).length,
        night: shifts.filter(s => s.shift_type === 'night').length,
        rotational: shifts.filter(s => s.shift_type === 'rotational').length
    };

    return (
        <div className="shift-management">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="shift-page-title">Shift Configuration</h1>
                    <p className="shift-page-subtitle">Standardize working hours and attendance policies for your organization</p>
                </div>
                <button 
                    onClick={() => { setEditingShift(null); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                >
                    <Plus size={18} /> Define New Shift
                </button>
            </div>

            {/* Stats Grid */}
            <div className="shift-stats-grid">
                <div className="shift-stat-card shift-card-indigo">
                    <div>
                        <div className="shift-stat-label">Total Shifts</div>
                        <div className="shift-stat-value">{stats.total}</div>
                    </div>
                    <div className="shift-stat-icon-wrapper"><Layers size={21} /></div>
                </div>
                <div className="shift-stat-card shift-card-emerald">
                    <div>
                        <div className="shift-stat-label">Active Policies</div>
                        <div className="shift-stat-value">{stats.active}</div>
                    </div>
                    <div className="shift-stat-icon-wrapper"><CheckCircle size={21} /></div>
                </div>
                <div className="shift-stat-card shift-card-amber">
                    <div>
                        <div className="shift-stat-label">Night Shifts</div>
                        <div className="shift-stat-value">{stats.night}</div>
                    </div>
                    <div className="shift-stat-icon-wrapper"><Moon size={21} /></div>
                </div>
                <div className="shift-stat-card shift-card-rose">
                    <div>
                        <div className="shift-stat-label">Rotational Support</div>
                        <div className="shift-stat-value">{stats.rotational}</div>
                    </div>
                    <div className="shift-stat-icon-wrapper"><RotateCw size={21} /></div>
                </div>
            </div>

            {/* Shift List Table */}
            <div className="shift-list-card">
                <div className="shift-table-header">
                    <h3 className="shift-table-title">Standard Shift Definitions</h3>
                    <div className="flex gap-4">
                        <button className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                            <Download size={18} /> Export CSV
                        </button>
                        <button className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                            <Settings size={18} /> Global Rules
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="shift-table">
                        <thead>
                            <tr>
                                <th>Identification</th>
                                <th>Timing Range</th>
                                <th>Shift Type</th>
                                <th>Grace Period</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-20 text-slate-400 font-medium"><Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={32} /> Loading configuration...</td></tr>
                            ) : shifts.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-20 text-slate-500 font-medium">No shifts defined yet. Start by defining a core shift.</td></tr>
                            ) : shifts.map(shift => (
                                <tr key={shift.id}>
                                    <td>
                                        <div className="flex items-center gap-4">
                                            <div className="shift-color-identifier shadow-sm" style={{ backgroundColor: shift.color_code || '#4f46e5' }}></div>
                                            <div>
                                                <div className="shift-name-bold">{shift.name}</div>
                                                <span className="shift-code-tag uppercase tracking-tighter">Code: {shift.code}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="w-1/4">
                                        <div className="shift-time-labels">
                                            <div className="flex items-center gap-1"><Sun size={12} className="text-amber-500" /> {shift.start_time?.slice(0,5)}</div>
                                            <div className="flex items-center gap-1"><Moon size={12} className="text-slate-400" /> {shift.end_time?.slice(0,5)}</div>
                                        </div>
                                        <div className="shift-timeline-track">
                                            <div 
                                                className="shift-timeline-bar shadow-sm" 
                                                style={{ 
                                                    backgroundColor: shift.color_code || '#4f46e5', 
                                                    left: '25%', 
                                                    width: '50%',
                                                    opacity: 0.8
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
                                            {shift.shift_type === 'day' ? <Sun size={14} /> : shift.shift_type === 'night' ? <Moon size={14} /> : <RotateCw size={14} />}
                                            {shift.shift_type?.charAt(0).toUpperCase() + shift.shift_type?.slice(1)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-slate-500 dark:text-slate-400">
                                            {shift.grace_period_minutes} <span className="font-normal text-xs uppercase opacity-70">mins</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`shift-status-pill ${shift.is_active ? 'active' : 'inactive'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${shift.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            {shift.is_active ? 'Live' : 'Archived'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-1">
                                            <button 
                                                onClick={() => openEdit(shift)}
                                                className="shift-action-btn"
                                                title="Modify"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(shift.id)}
                                                className="shift-action-btn delete"
                                                title="Remove"
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

            {/* FAB */}
            <button className="shift-fab" onClick={() => { setEditingShift(null); setShowModal(true); }}>
                <Plus size={28} />
            </button>

            {showModal && (
                <ShiftModal 
                    shift={editingShift} 
                    onClose={() => { setShowModal(false); setEditingShift(null); }}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

function ShiftModal({ shift, onClose, onSubmit, submitting }) {
    const [form, setForm] = useState({
        name: shift?.name || '',
        code: shift?.code || '',
        shift_type: shift?.shift_type || 'day',
        start_time: shift?.start_time || '09:00:00',
        end_time: shift?.end_time || '18:00:00',
        grace_period_minutes: shift?.grace_period_minutes || 15,
        color_code: shift?.color_code || '#4f46e5',
        is_active: shift?.is_active ?? true
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="modal-overlay fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                            {shift ? 'Edit Shift Policy' : 'Define Work Shift'}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Attendance Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Shift Name</label>
                            <input 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                placeholder="e.g. Day General"
                                required
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Code / Abbr</label>
                            <input 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                placeholder="e.g. GS, NS"
                                required
                                value={form.code}
                                onChange={e => setForm({...form, code: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Shift Type</label>
                            <select 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                value={form.shift_type}
                                onChange={e => setForm({...form, shift_type: e.target.value})}
                            >
                                <option value="day">General (Day)</option>
                                <option value="night">Night Shift</option>
                                <option value="rotational">Rotational</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Color Theme</label>
                            <input 
                                type="color"
                                className="w-full h-[58px] p-1 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none cursor-pointer overflow-hidden"
                                value={form.color_code}
                                onChange={e => setForm({...form, color_code: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Starts at</label>
                            <input 
                                type="time"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                required
                                value={form.start_time}
                                onChange={e => setForm({...form, start_time: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ends at</label>
                            <input 
                                type="time"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                required
                                value={form.end_time}
                                onChange={e => setForm({...form, end_time: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Grace (Min)</label>
                            <input 
                                type="number"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 dark:text-white transition-all"
                                required
                                value={form.grace_period_minutes}
                                onChange={e => setForm({...form, grace_period_minutes: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-1">
                        <input 
                            type="checkbox"
                            checked={form.is_active}
                            onChange={e => setForm({...form, is_active: e.target.checked})}
                            className="w-5 h-5 rounded-md accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Set as live policy</span>
                    </div>

                    <div className="pt-6 flex gap-4">
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
                            {shift ? 'Update Shift' : 'Commit Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
