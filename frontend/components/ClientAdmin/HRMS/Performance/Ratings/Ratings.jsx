'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Search, Plus, Star, Edit2, Trash2, Settings, X, 
    AlertCircle, Check, ChevronDown, Filter, Copy, 
    Eye, EyeOff, Layers, Activity, BarChart3,
    CheckCircle2, Loader2, Sparkles, SlidersHorizontal,
    ArrowRight, Info, Zap, LayoutGrid, Target,
    Users, MoreHorizontal, Activity as PulseIcon
} from 'lucide-react';
import {
    getRatingScales,
    createRatingScale,
    updateRatingScale,
    deleteRatingScale,
    getRatingCategories,
    createRatingCategory,
    updateRatingCategory,
    deleteRatingCategory
} from '../services/performanceService';
import './Rating.css';

// --- Sub-Components ---

const PulsePoint = ({ label, value, colorClass }) => (
    <div className="pulse-point">
        <span className="pulse-point__label">{label}</span>
        <div className="pulse-point__value">
            <div className={`pulse-dot ${colorClass}`} />
            {value}
        </div>
    </div>
);

const ParadigmTable = ({ scales, categories, onEdit, onDelete }) => {
    // Mock data for Department and Last Updated to match screenshot exactly
    const getMockDept = (name) => {
        if (name.includes('Eng')) return 'Engineering';
        if (name.includes('Sales')) return 'Sales';
        return 'All Company';
    };

    const getMockUpdated = (index) => {
        const days = [2, 7, 30][index % 3];
        if (days < 7) return `Updated ${days} days ago`;
        if (days < 30) return `Updated 1 week ago`;
        return `Updated 1 month ago`;
    };

    return (
        <div className="paradigm-table-container">
            <table className="paradigm-table">
                <thead>
                    <tr>
                        <th>Paradigm Name</th>
                        <th>Department</th>
                        <th>Tiers</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {scales.map((scale, i) => {
                        const tierCount = categories.filter(c => c.rating_scale === scale.id).length;
                        return (
                            <tr key={scale.id}>
                                <td>
                                    <div className="paradigm-row">
                                        <div className="paradigm-icon">
                                            <PulseIcon size={18} />
                                        </div>
                                        <div className="paradigm-name-wrap">
                                            <h4>{scale.name}</h4>
                                            <span className="paradigm-meta">{getMockUpdated(i)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="department-wrap">
                                        <Users size={16} />
                                        <span>{getMockDept(scale.name)}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="tier-pill">{tierCount}</span>
                                </td>
                                <td>
                                    <span className={`status-pill ${scale.is_active ? 'active' : 'draft'}`}>
                                        <div className="status-dot" />
                                        {scale.is_active ? 'Active' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button className="action-btn" onClick={() => onEdit(scale)}><Edit2 size={16} /></button>
                                        <button className="action-btn hover:text-red-500" onClick={() => onDelete(scale.id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const DefinitionModal = ({ isOpen, data, onClose, onSubmit, onChange }) => {
    if (!isOpen) return null;

    return (
        <div className="neo-modal-overlay" onClick={onClose}>
            <div className="neo-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight dark:text-white">Configure Paradigm</h3>
                            <p className="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Matrix definitions</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="modal-content space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Paradigm Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 p-4 rounded-xl font-bold transition-all outline-none dark:text-white" 
                            value={data.name} onChange={e => onChange({...data, name: e.target.value})} placeholder="e.g. Talent Matrix 2026" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Min Score</label>
                            <input type="number" step="0.1" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 p-4 rounded-xl font-bold transition-all outline-none dark:text-white" 
                                value={data.min_value} onChange={e => onChange({...data, min_value: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Max Score</label>
                            <input type="number" step="0.1" className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 p-4 rounded-xl font-bold transition-all outline-none dark:text-white" 
                                value={data.max_value} onChange={e => onChange({...data, max_value: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Documentation</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 p-4 rounded-xl font-bold h-32 resize-none transition-all outline-none dark:text-white" 
                            value={data.description} onChange={e => onChange({...data, description: e.target.value})} placeholder="Philosophy behind this metric..." />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="flex-1 py-3.5 font-black uppercase text-[0.7rem] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all" onClick={onClose}>Discard</button>
                    <button className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[0.7rem] shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all" onClick={onSubmit}>Apply Paradigm</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Framework Controller ---

export default function Ratings() {
    const [scales, setScales] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, data: { name: '', min_value: 0, max_value: 5, description: '', is_active: true } });

    useEffect(() => {
        loadFramework();
    }, []);

    const loadFramework = async () => {
        setLoading(true);
        try {
            const [s, c] = await Promise.all([getRatingScales(), getRatingCategories()]);
            setScales(s?.results || s || []);
            setCategories(c?.results || c || []);
        } catch (e) {
            notify('System failed to load core paradigms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const notify = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleParadigmSubmit = async () => {
        try {
            if (modal.data.id) await updateRatingScale(modal.data.id, modal.data);
            else await createRatingScale(modal.data);
            notify('Evaluation paradigm synchronized');
            setModal({ ...modal, isOpen: false });
            loadFramework();
        } catch (e) { notify(e.message, 'error'); }
    };

    const confirmAndDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this paradigm?')) return;
        try {
            await deleteRatingScale(id);
            notify('Paradigm removed from system');
            loadFramework();
        } catch (err) { notify(err.message, 'error'); }
    };

    const filteredScales = scales.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ratings max-w-[1200px] mx-auto px-8">
            {/* Header */}
            <header className="ratings-header">
                <h1 className="ratings-header__title">Evaluation Framework</h1>
                <div className="pulse-grid">
                    <PulsePoint label="Scaling Paradigms" value={scales.length} colorClass="indigo" />
                    <PulsePoint label="Total Assessment Tiers" value={categories.length} colorClass="emerald" />
                    <PulsePoint label="Operational Status" value={scales.every(s => s.is_active) ? 'Healthy' : 'Warning'} colorClass="emerald" />
                </div>
            </header>

            {/* Actions */}
            <div className="framework-actions">
                <div className="search-container">
                    <Search size={18} />
                    <input 
                        placeholder="Find paradigms..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <button 
                    className="btn-create-paradigm"
                    onClick={() => setModal({ isOpen: true, data: { name: '', min_value: 0, max_value: 5, description: '', is_active: true } })}
                >
                    <Plus size={18} /> Create Paradigm
                </button>
            </div>

            {/* Table or Empty State */}
            {loading ? (
                <div className="flex justify-center py-32 opacity-30">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            ) : filteredScales.length > 0 ? (
                <ParadigmTable 
                    scales={filteredScales} 
                    categories={categories}
                    onEdit={(s) => setModal({ isOpen: true, data: s })}
                    onDelete={confirmAndDelete}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.25rem] shadow-sm border-2 border-dashed border-slate-100">
                    <PulseIcon size={64} className="text-slate-100 mb-6" />
                    <h2 className="text-2xl font-black text-slate-800">No core paradigms established</h2>
                    <p className="text-slate-400 font-bold mt-2">Initialize your first evaluation matrix to begin.</p>
                </div>
            )}

            {/* Notification */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[500] animate-in slide-in-from-right duration-300">
                    <div className="px-8 py-5 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-4">
                        {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" size={24} /> : <AlertCircle className="text-rose-400" size={24} />}
                        <span className="font-extrabold text-sm uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Config Modal */}
            <DefinitionModal 
                isOpen={modal.isOpen}
                data={modal.data}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onChange={(d) => setModal({ ...modal, data: d })}
                onSubmit={handleParadigmSubmit}
            />
        </div>
    );
}
