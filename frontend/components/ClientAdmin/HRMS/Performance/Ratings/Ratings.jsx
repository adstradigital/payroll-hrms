'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Search, Plus, Star, Edit2, Trash2, Settings, X, 
    AlertCircle, Check, ChevronDown, Filter, Copy, 
    Eye, EyeOff, Layers, Activity, BarChart3,
    CheckCircle2, Loader2, Sparkles, SlidersHorizontal
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

const StatsGrid = ({ scales, categories }) => {
    const stats = [
        { label: 'Evaluation Scales', value: scales.length, icon: Layers, class: 'stat-card-indigo' },
        { label: 'Rating Categories', value: categories.length, icon: Star, class: 'stat-card-emerald' },
        { label: 'Active Policies', value: scales.filter(s => s.is_active).length, icon: CheckCircle2, class: 'stat-card-amber' }
    ];

    return (
        <div className="ratings-stats-grid">
            {stats.map((stat, i) => (
                <div key={i} className={`rating-stat-card ${stat.class}`}>
                    <div>
                        <div className="stat-info-label">{stat.label}</div>
                        <div className="stat-info-value">{stat.value}</div>
                    </div>
                    <div className="stat-icon-wrapper">
                        <stat.icon size={24} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const ScaleVisualPreview = ({ scale, categories }) => {
    const scaleCategories = categories.filter(c => c.rating_scale === scale.id)
        .sort((a, b) => Number(a.min_score) - Number(b.min_score));
    
    const min = Number(scale.min_value);
    const max = Number(scale.max_value);
    const range = max - min;

    return (
        <div className="scale-visualization-wrap">
            <div className="scale-value-box">
                <span>Min: {min}</span>
                <span>Max: {max}</span>
            </div>
            <div className="scale-visual-bar shadow-inner">
                {scaleCategories.map((cat, i) => {
                    const width = ((Number(cat.max_score) - Number(cat.min_score)) / range) * 100;
                    return (
                        <div 
                            key={cat.id} 
                            className="scale-visual-segment" 
                            style={{ 
                                width: `${width}%`, 
                                backgroundColor: cat.color_code,
                                opacity: 0.85
                            }}
                            title={`${cat.name}: ${cat.min_score}-${cat.max_score}`}
                        />
                    );
                })}
            </div>
            <div className="flex justify-between mt-2">
                {scaleCategories.length > 0 ? (
                    <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-tighter">
                        {scaleCategories.length} Categories Defined
                    </span>
                ) : (
                    <span className="text-[0.7rem] font-bold text-rose-400 uppercase tracking-tighter">
                        No Categories Assigned
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Core Components ---

const ScaleCard = ({ scale, categories, onEdit, onDelete, onDuplicate, onToggleActive }) => (
    <div className={`rating-card ${!scale.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <div className="rating-card__header">
            <div className="rating-card__icon shadow-sm">
                <BarChart3 size={20} />
            </div>
            <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest ${scale.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {scale.is_active ? 'Active' : 'Archived'}
            </span>
        </div>

        <h3 className="rating-card__name">{scale.name}</h3>
        <p className="rating-card__description">{scale.description || 'No description provided for this rating scale.'}</p>

        <ScaleVisualPreview scale={scale} categories={categories} />

        <div className="rating-card__actions mt-6">
            <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:text-indigo-600 transition-all" onClick={() => onEdit(scale)} title="Edit Settings">
                <Edit2 size={16} />
            </button>
            <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:text-indigo-600 transition-all" onClick={() => onDuplicate(scale)} title="Duplicate Scale">
                <Copy size={16} />
            </button>
            <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:text-indigo-600 transition-all" onClick={() => onToggleActive(scale)} title={scale.is_active ? 'Archive' : 'Restore'}>
                {scale.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-all ml-auto" onClick={() => onDelete(scale)} title="Delete Forever">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

const CategoryItem = ({ category, scale, onEdit, onDelete, onDuplicate }) => (
    <div className="category-item group">
        <div 
            className="category-color-dot" 
            style={{ backgroundColor: category.color_code }}
        >
            <Star size={18} fill="currentColor" />
        </div>
        
        <div className="category-info-wrap">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <div className="category-name-text">{category.name}</div>
                    <div className="category-scale-name">{scale?.name || 'Global Scale'}</div>
                </div>
                <div className="category-range-tag">{category.min_score} - {category.max_score}</div>
            </div>
            
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all">
                <button className="text-[0.7rem] font-extrabold text-slate-400 hover:text-indigo-600 uppercase" onClick={() => onEdit(category)}>Edit</button>
                <button className="text-[0.7rem] font-extrabold text-slate-400 hover:text-indigo-600 uppercase" onClick={() => onDuplicate(category)}>Copy</button>
                <button className="text-[0.7rem] font-extrabold text-slate-400 hover:text-rose-600 uppercase ml-auto" onClick={() => onDelete(category)}>Delete</button>
            </div>
        </div>
    </div>
);

// --- Main Layout ---

export default function Ratings() {
    const [activeTab, setActiveTab] = useState('scales');
    const [scales, setScales] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    const [form, setForm] = useState({
        name: '', min_value: 0, max_value: 5, description: '', is_active: true
    });

    const [catForm, setCatForm] = useState({
        rating_scale: '', name: '', min_score: 0, max_score: 5, description: '', color_code: '#4f46e5'
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [scalesRes, catsRes] = await Promise.all([
                getRatingScales(),
                getRatingCategories()
            ]);
            setScales(scalesRes?.results || scalesRes || []);
            setCategories(catsRes?.results || catsRes || []);
        } catch (error) {
            console.error('Data load failed:', error);
            showNotification('Failed to fetch evaluation configurations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleScaleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRatingScale(editingItem.id, form);
                showNotification('Rating scale updated successfully');
            } else {
                await createRatingScale(form);
                showNotification('New rating scale defined');
            }
            setShowModal(false);
            loadAllData();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRatingCategory(editingItem.id, catForm);
                showNotification('Category refined successfully');
            } else {
                await createRatingCategory(catForm);
                showNotification('Assessment category added');
            }
            setShowModal(false);
            loadAllData();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const confirmAndDelete = async (id, type) => {
        if (!window.confirm('Are you sure? This may affect historical performance reviews.')) return;
        try {
            if (type === 'scale') await deleteRatingScale(id);
            else await deleteRatingCategory(id);
            showNotification('Permanent deletion complete');
            loadAllData();
        } catch (err) {
            showNotification('Deletion failed: ' + err.message, 'error');
        }
    };

    const filteredScales = scales.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="ratings max-w-7xl mx-auto px-4 py-8">
            {/* Header Area */}
            <div className="flex justify-between items-start mb-10">
                <div className="ratings-header">
                    <h1 className="ratings-header__title">Evaluation Framework</h1>
                    <p className="ratings-header__subtitle">Standardize how you measure and reward performance across your talent pool.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingItem(null);
                        setForm({ name: '', min_value: 0, max_value: 5, description: '', is_active: true });
                        setCatForm({ rating_scale: scales[0]?.id || '', name: '', min_score: 0, max_score: 5, description: '', color_code: '#4f46e5' });
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus size={20} /> New {activeTab === 'scales' ? 'Rating Scale' : 'Category'}
                </button>
            </div>

            {/* Stats */}
            <StatsGrid scales={scales} categories={categories} />

            {/* Navigation Tabs and Search */}
            <div className="flex justify-between items-center mb-8 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="ratings-tabs m-0">
                    <button className={`ratings-tab ${activeTab === 'scales' ? 'active' : ''}`} onClick={() => setActiveTab('scales')}>
                        <BarChart3 size={18} /> Scale Matrix
                        <span className="ratings-tab__count">{scales.length}</span>
                    </button>
                    <button className={`ratings-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                        <SlidersHorizontal size={18} /> Performance Tiers
                        <span className="ratings-tab__count">{categories.length}</span>
                    </button>
                </div>
                
                <div className="relative w-80 mr-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={`Find ${activeTab}...`} 
                        className="w-full bg-white dark:bg-slate-900 pl-11 pr-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                    <p className="font-extrabold text-slate-400 uppercase tracking-widest text-sm">Initializing framework...</p>
                </div>
            ) : (activeTab === 'scales' ? (
                filteredScales.length > 0 ? (
                    <div className="ratings-grid">
                        {filteredScales.map(scale => (
                            <ScaleCard 
                                key={scale.id} 
                                scale={scale} 
                                categories={categories}
                                onEdit={(s) => { setEditingItem(s); setForm(s); setShowModal(true); }}
                                onDelete={(s) => confirmAndDelete(s.id, 'scale')}
                                onDuplicate={(s) => { setEditingItem(null); setForm({...s, name: `${s.name} (Copy)`}); setShowModal(true); }}
                                onToggleActive={async (s) => {
                                    await updateRatingScale(s.id, { ...s, is_active: !s.is_active });
                                    loadAllData();
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-900 transform translate-x-1/4 -translate-y-1/4 rotate-12">
                            <Layers size={300} />
                        </div>
                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-500 mb-6 relative">
                            <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={24} />
                            <Layers size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Evaluation Scales Found</h3>
                        <p className="text-slate-400 font-medium text-center max-w-xs mb-8">Establish your first performance ranking methodology to start measuring excellence.</p>
                        <button 
                            onClick={() => {
                                setEditingItem(null);
                                setForm({ name: '', min_value: 0, max_value: 5, description: '', is_active: true });
                                setShowModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none"
                        >
                            + Draft First Scale
                        </button>
                    </div>
                )
            ) : (
                filteredCategories.length > 0 ? (
                    <div className="categories-list">
                        {filteredCategories.map(cat => (
                            <CategoryItem 
                                key={cat.id} 
                                category={cat} 
                                scale={scales.find(s => s.id === cat.rating_scale)}
                                onEdit={(c) => { setEditingItem(c); setCatForm(c); setShowModal(true); }}
                                onDelete={(c) => confirmAndDelete(c.id, 'category')}
                                onDuplicate={(c) => { setEditingItem(null); setCatForm({...c, name: `${c.name} (Copy)`}); setShowModal(true); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 p-12 opacity-[0.03] text-emerald-900 transform -translate-x-1/4 translate-y-1/4 -rotate-12">
                            <Star size={300} />
                        </div>
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 relative">
                            <Activity className="absolute -bottom-2 -left-2 text-emerald-400 animate-bounce" size={24} />
                            <Star size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Performance Tiers</h3>
                        <p className="text-slate-400 font-medium text-center max-w-xs mb-8">Define performance levels (e.g., Exceptional, Good) for your active scales.</p>
                        {scales.length > 0 ? (
                            <button 
                                onClick={() => {
                                    setEditingItem(null);
                                    setCatForm({ rating_scale: scales[0]?.id || '', name: '', min_score: 0, max_score: 0, description: '', color_code: '#10b981' });
                                    setShowModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-emerald-100 dark:shadow-none"
                            >
                                + Add Rating Tier
                            </button>
                        ) : (
                            <p className="text-indigo-600 font-bold text-sm">Create a Rating Scale first to add categories.</p>
                        )}
                    </div>
                )
            ))}

            {/* Notification */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-[1000] flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300">
                    {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle className="text-rose-400" size={20} />}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}

            {/* Management Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                    {editingItem ? 'Refine Logic' : 'Define Concept'}
                                </h2>
                                <p className="text-[0.65rem] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Framework Configuration</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl transition-all"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={activeTab === 'scales' ? handleScaleSubmit : handleCategorySubmit} className="p-8 space-y-6">
                            {activeTab === 'scales' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Scale Label</label>
                                        <input className="form-premium-input w-full outline-none" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Performance Matrix 2026" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Minimum Value</label>
                                            <input type="number" step="0.1" className="form-premium-input w-full outline-none" required value={form.min_value} onChange={e => setForm({...form, min_value: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Maximum Value</label>
                                            <input type="number" step="0.1" className="form-premium-input w-full outline-none" required value={form.max_value} onChange={e => setForm({...form, max_value: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Business Logic / Description</label>
                                        <textarea className="form-premium-input w-full h-32 resize-none outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Explain how this scale should be utilized by reviewers..." />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Scale</label>
                                            <select className="form-premium-input w-full outline-none" required value={catForm.rating_scale} onChange={e => setCatForm({...catForm, rating_scale: e.target.value})}>
                                                {scales.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Tier Name</label>
                                            <input className="form-premium-input w-full outline-none" required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Top Performer" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Threshold Start</label>
                                            <input type="number" step="0.1" className="form-premium-input w-full outline-none" required value={catForm.min_score} onChange={e => setCatForm({...catForm, min_score: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Threshold End</label>
                                            <input type="number" step="0.1" className="form-premium-input w-full outline-none" required value={catForm.max_score} onChange={e => setCatForm({...catForm, max_score: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest ml-1">Identification Color</label>
                                            <input type="color" className="w-full h-[58px] p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer" value={catForm.color_code} onChange={e => setCatForm({...catForm, color_code: e.target.value})} />
                                        </div>
                                        <div className="space-y-2 flex flex-col justify-end">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-center font-bold text-indigo-500">{catForm.color_code}</div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">
                                    {editingItem ? 'Update Logic' : 'Save Definition'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
