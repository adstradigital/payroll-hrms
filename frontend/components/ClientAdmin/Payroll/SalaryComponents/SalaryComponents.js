'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, Plus, Edit2, Trash2, X, IndianRupee,
    Percent, Calculator, FileText, CheckCircle2,
    AlertCircle, Info, ArrowUpDown, Copy,
    TrendingUp, ShieldCheck, Zap, Layers,
    ChevronRight, ChevronLeft, PlayCircle, Save, LayoutGrid,
    List, FileUp, Download, FileSpreadsheet,
    UploadCloud, Check, AlertTriangle, MoreHorizontal,
    Activity, PieChart, Shield, ExternalLink
} from 'lucide-react';
import {
    getSalaryComponents, createSalaryComponent,
    updateSalaryComponent, deleteSalaryComponent
} from '@/api/api_clientadmin';
import './SalaryComponents.css';

/**
 * ORACLE VAULT - PREMIUM SALARY COMPONENT CUSTODIAN
 */

// --- MOCK DATA FOR FAILSAFE ---
const INITIAL_COMPONENTS = [
    { id: '1', name: 'Basic Salary', code: 'BASIC', component_type: 'earning', calculation_type: 'fixed', amount: 3000, is_taxable: true, is_statutory: true, is_active: true, description: 'Base pay for all employees' },
    { id: '2', name: 'House Rent Allowance', code: 'HRA', component_type: 'earning', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 40, is_taxable: true, is_active: true, description: 'Accommodation support' },
    { id: '3', name: 'Provident Fund', code: 'PF', component_type: 'deduction', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 12, is_statutory: true, is_active: true, description: 'Retirement savings' },
    { id: '4', name: 'Professional Tax', code: 'PT', component_type: 'deduction', calculation_type: 'fixed', amount: 200, is_statutory: true, is_active: true, description: 'State professional tax' },
    { id: '5', name: 'Medical Allowance', code: 'MED', component_type: 'earning', calculation_type: 'fixed', amount: 500, is_taxable: false, is_active: true },
    { id: '6', name: 'Gratuity', code: 'GRAT', component_type: 'earning', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 4.81, is_statutory: true, is_active: true },
    { id: '7', name: 'Income Tax', code: 'TDS', component_type: 'deduction', calculation_type: 'percentage', percentage_of: 'BASIC', percentage_value: 10, is_taxable: false, is_statutory: true, is_active: true },
];

const PRESET_TEMPLATES = [
    { name: 'Health Insurance', code: 'INS', type: 'deduction', calc: 'fixed', amount: 150, description: 'Monthly health coverage' },
    { name: 'Transport Allowance', code: 'TRANS', type: 'earning', calc: 'fixed', amount: 250, description: 'Commute reimbursement' },
    { name: 'Performance Bonus', code: 'BONUS', type: 'earning', calc: 'percentage', amount: 10, description: 'Quarterly incentives' },
];

// --- SUB-COMPONENTS ---

const GoldButton = ({ children, onClick, variant = 'solid', className = "", disabled = false, type = "button" }) => {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`vault-btn-gold ${variant} ${className}`}
        >
            {children}
        </button>
    );
};

const UploadModal = ({ onClose }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const simulateUpload = () => {
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setSuccess(true);
            setTimeout(() => onClose(), 1500);
        }, 2000);
    };

    return (
        <div className="vault-modal-overlay">
            <div className="vault-modal medium animate-fade-in shadow-2xl">
                <div className="vault-modal-header">
                    <div className="vault-modal-title-group">
                        <FileSpreadsheet className="vault-logo-icon" size={20} />
                        <h2 className="vault-modal-title">Data Ingestion Hub</h2>
                    </div>
                    <button onClick={onClose} className="vault-action-btn"><X size={24} /></button>
                </div>
                <div className="vault-modal-body">
                    {!success ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); simulateUpload(); }}
                            className={`vault-upload-drop ${dragActive ? 'active' : ''}`}
                        >
                            {uploading ? (
                                <div className="animate-pulse">
                                    <div className="vault-spinner mx-auto mb-4"></div>
                                    <p className="vault-title-accent font-bold uppercase tracking-widest">Decrypting Ledger...</p>
                                </div>
                            ) : (
                                <>
                                    <UploadCloud size={48} className="vault-logo-icon mb-4 mx-auto" />
                                    <h3 className="text-white font-bold mb-2 uppercase italic tracking-tighter">Import Master CSV</h3>
                                    <p className="vault-subtitle mb-6">Drop your attendance or bonus matrix here.</p>
                                    <GoldButton onClick={() => fileInputRef.current?.click()} className="mx-auto">Browse Files</GoldButton>
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={simulateUpload} />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500 mb-6 mx-auto shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                <Check size={40} className="text-green-500" />
                            </div>
                            <p className="text-white font-black uppercase italic tracking-widest">Ingestion Complete</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ComponentForm = ({ component, allComponents, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '', code: '', component_type: 'earning', calculation_type: 'fixed',
        amount: '', percentage_of: 'BASIC', percentage_value: '', description: '',
        is_taxable: false, is_statutory: false, is_active: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (component) setFormData({ ...component });
    }, [component]);

    const earningsOnly = allComponents.filter(c => c.component_type === 'earning' && c.id !== component?.id);

    const simulationResult = useMemo(() => {
        const baseVal = 5000; // Sample basic
        const workingDays = 30;
        const presentDays = 22; // Sample attendance for projection

        if (formData.calculation_type === 'fixed') return parseFloat(formData.amount) || 0;
        if (formData.calculation_type === 'percentage') return (parseFloat(formData.percentage_value) / 100) * baseVal;

        // Attendance Based Projections
        if (formData.calculation_type === 'attendance_prorated') {
            const fullVal = parseFloat(formData.amount) || 0;
            return (fullVal / workingDays) * presentDays;
        }
        if (formData.calculation_type === 'per_day') {
            const dailyRate = parseFloat(formData.amount) || 0;
            return dailyRate * presentDays;
        }
        return 0;
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vault-modal-overlay">
            <div className="vault-modal medium animate-fade-in">
                <div className="vault-modal-header">
                    <div className="vault-modal-title-group">
                        <Zap className="vault-logo-icon" size={20} />
                        <h2 className="vault-modal-title">{component ? 'Architect Asset' : 'New Financial Logic'}</h2>
                    </div>
                    <button onClick={onClose} className="vault-action-btn"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="vault-modal-body vault-form">
                    <div className="vault-grid-2">
                        <div className="vault-input-group">
                            <label className="vault-label">Asset Name</label>
                            <input
                                name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                                className="vault-input" placeholder="e.g. Performance Bonus"
                            />
                        </div>
                        <div className="vault-input-group">
                            <label className="vault-label">Identifier Code</label>
                            <input
                                name="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required
                                className="vault-input uppercase font-mono" placeholder="e.g. BONUS"
                            />
                        </div>
                    </div>

                    <div className="vault-grid-2">
                        <div className="vault-input-group">
                            <label className="vault-label">Classification</label>
                            <div className="vault-type-toggle">
                                <button
                                    type="button" onClick={() => setFormData({ ...formData, component_type: 'earning' })}
                                    className={`vault-type-btn earning ${formData.component_type === 'earning' ? 'active' : ''}`}
                                >EARNING</button>
                                <button
                                    type="button" onClick={() => setFormData({ ...formData, component_type: 'deduction' })}
                                    className={`vault-type-btn deduction ${formData.component_type === 'deduction' ? 'active' : ''}`}
                                >DEDUCTION</button>
                            </div>
                        </div>
                        <div className="vault-input-group">
                            <label className="vault-label">Statutory Mapping</label>
                            <select
                                value={formData.statutory_type} onChange={(e) => setFormData({ ...formData, statutory_type: e.target.value })}
                                className="vault-select"
                            >
                                <option value="">None (Custom Component)</option>
                                <option value="pf">Provident Fund (PF)</option>
                                <option value="esi">Employee State Insurance (ESI)</option>
                                <option value="tds">Income Tax (TDS)</option>
                                <option value="pt">Professional Tax (PT)</option>
                            </select>
                        </div>
                    </div>

                    <div className="vault-input-group">
                        <label className="vault-label">Logic Source</label>
                        <select
                            value={formData.calculation_type} onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                            className="vault-select"
                        >
                            <option value="fixed">Nominal Sum (Fixed)</option>
                            <option value="percentage">Ratio (% of Earning)</option>
                            <option value="attendance_prorated">Attendance Prorated</option>
                            <option value="per_day">Per Present Day (Daily)</option>
                        </select>
                    </div>

                    {formData.calculation_type === 'percentage' && (
                        <div className="vault-grid-2 animate-fade-in">
                            <div className="vault-input-group">
                                <label className="vault-label">Target Component</label>
                                <select
                                    value={formData.percentage_of} onChange={(e) => setFormData({ ...formData, percentage_of: e.target.value })}
                                    className="vault-select"
                                >
                                    <option value="BASIC">Base Salary</option>
                                    {earningsOnly.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="vault-input-group">
                                <label className="vault-label">Ratio %</label>
                                <input
                                    type="number" value={formData.percentage_value} onChange={(e) => setFormData({ ...formData, percentage_value: e.target.value })}
                                    className="vault-input"
                                    placeholder="e.g. 12"
                                />
                            </div>
                        </div>
                    )}

                    {(formData.calculation_type === 'fixed' || formData.calculation_type === 'attendance_prorated' || formData.calculation_type === 'per_day') && (
                        <div className="vault-input-group animate-fade-in">
                            <label className="vault-label">
                                {formData.calculation_type === 'per_day' ? 'Daily Rate' : 'Base Value (₹)'}
                            </label>
                            <input
                                type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="vault-input"
                                placeholder="0.00"
                            />
                            {formData.calculation_type === 'attendance_prorated' && (
                                <p className="vault-subtitle text-xs mt-1 italic">Value will reduce based on LOP/Absent days.</p>
                            )}
                        </div>
                    )}

                    <div className="vault-projection">
                        <div className="vault-title-group">
                            <span className="vault-label">Impact Projection</span>
                            <span className={`vault-stat-value ${formData.component_type === 'earning' ? 'text-green-400' : 'text-red-400'}`}>
                                {formData.component_type === 'earning' ? '+' : '-'} ₹{simulationResult.toLocaleString()}
                            </span>
                        </div>
                        <div className="vault-controls">
                            <button type="button" onClick={onClose} className="vault-subtitle hover:text-white cursor-pointer border-none bg-transparent">Cancel</button>
                            <GoldButton type="submit" disabled={loading}>
                                {loading ? <span className="vault-spinner small"></span> : <><Save size={18} /> Manifest Changes</>}
                            </GoldButton>
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
};

// --- MAIN REGISTRY ---
export default function SalaryComponents() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [editComp, setEditComp] = useState(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            const res = await getSalaryComponents();
            if (res.data && Array.isArray(res.data.results || res.data)) {
                const fetched = res.data.results || res.data;
                // Only use mock data if backend returns absolutely nothing AND it's a fresh load
                if (fetched.length === 0 && components.length === 0) {
                    // Decide: Should we show empty or mock? 
                    // Let's show empty if the API worked, to avoid confusing "ghost" data.
                    setComponents([]);
                } else {
                    setComponents(fetched);
                }
            } else {
                setComponents(INITIAL_COMPONENTS);
            }
        } catch (error) {
            console.error("Fetch error", error);
            setComponents(INITIAL_COMPONENTS);
        } finally {
            setLoading(false);
        }
    };

    // --- DERIVED ANALYTICS ---
    const totals = useMemo(() => {
        return components.reduce((acc, curr) => {
            const val = curr.calculation_type === 'fixed' ? (parseFloat(curr.amount) || 0) : ((parseFloat(curr.percentage_value) || 0) / 100) * 5000;
            if (curr.component_type === 'earning') acc.earnings += val;
            else acc.deductions += val;
            return acc;
        }, { earnings: 0, deductions: 0 });
    }, [components]);

    const earningRatio = useMemo(() => {
        const total = totals.earnings + totals.deductions;
        return total > 0 ? (totals.earnings / total) * 100 : 100;
    }, [totals]);

    const filtered = components.filter(c =>
        (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())) &&
        (activeTab === 'all' || c.component_type === activeTab)
    );

    const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const handleSave = async (data) => {
        try {
            setLoading(true);

            // CLEAN DATA: Remove empty strings and handle logic types
            const cleanData = { ...data };
            if (cleanData.amount === '' || cleanData.amount === null) delete cleanData.amount;
            if (cleanData.percentage_value === '' || cleanData.percentage_value === null) delete cleanData.percentage_value;

            // percentage_of should be null if not using percentage logic or set to 'BASIC'
            if (cleanData.calculation_type !== 'percentage') {
                cleanData.percentage_of = null;
            } else if (cleanData.percentage_of === 'BASIC') {
                cleanData.percentage_of = null; // Backend assumes null is BASIC or handled by code
            }

            if (editComp) {
                await updateSalaryComponent(editComp.id, cleanData);
            } else {
                await createSalaryComponent(cleanData);
            }

            setSearch('');
            setActiveTab('all');
            setCurrentPage(1);

            await fetchComponents();
            setShowForm(false);
            setEditComp(null);
        } catch (error) {
            console.error("Save failed", error);
            const detail = error.response?.data
                ? JSON.stringify(error.response.data)
                : error.message;
            alert(`Manifestation Failed [400]: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to decommission this asset?')) return;
        try {
            await deleteSalaryComponent(id);
            setComponents(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
            setComponents(prev => prev.filter(c => c.id !== id));
        }
    };

    const addPreset = (p) => {
        handleSave({
            name: p.name, code: p.code, component_type: p.type,
            calculation_type: p.calc, amount: p.calc === 'fixed' ? p.amount : 0,
            percentage_value: p.calc === 'percentage' ? p.amount : 0,
            percentage_of: 'BASIC', is_active: true
        });
    };

    const cloneComp = (comp) => {
        handleSave({
            ...comp,
            name: `${comp.name} (Copy)`,
            code: `${comp.code}_CLONE`,
        });
    };

    return (
        <div className="vault-container">

            {/* GLOBAL HUD */}
            <div className="vault-hud">
                <div className="vault-title-group">
                    <div className="vault-brand">
                        <Shield className="vault-logo-icon" size={36} />
                        <h1 className="vault-title">HRMS PAYROLL <span className="vault-title-accent">VAULT</span></h1>
                    </div>
                    <p className="vault-subtitle">Enterprise Asset Custodian</p>
                </div>

                <div className="vault-controls">
                    <div className="vault-search-wrapper">
                        <Search size={18} className="vault-search-icon" />
                        <input
                            type="text" placeholder="Filter Vault..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="vault-search-input"
                        />
                    </div>
                    <div className="vault-view-toggle">
                        <button onClick={() => setViewMode('grid')} className={`vault-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`vault-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}><List size={18} /></button>
                    </div>
                    <GoldButton onClick={() => { setEditComp(null); setShowForm(true); }}><Plus size={20} /> New Asset</GoldButton>
                </div>
            </div>

            {/* BALANCE SHEET HEADER */}
            <div className="vault-stats-grid">
                <div className="vault-stats-card premium">
                    <div className="vault-stats-glow" />
                    <h3 className="vault-stats-label">Financial Distribution</h3>
                    <div className="vault-stats-flex">
                        <div className="vault-stats-group">
                            <div>
                                <p className="vault-stat-item-label">Total Earnings</p>
                                <p className="vault-stat-value">₹{totals.earnings.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="vault-stat-item-label">Total Deductions</p>
                                <p className="vault-stat-value danger">₹{totals.deductions.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="vault-stat-item-label">Effective Ratio</p>
                            <p className="vault-stat-value accent">{earningRatio.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="vault-progress-track">
                        <div className="vault-progress-fill" style={{ width: `${earningRatio}%` }}></div>
                        <div className="vault-progress-fill negative" style={{ width: `${100 - earningRatio}%` }}></div>
                    </div>
                </div>

                <div className="vault-ingestion-card" onClick={() => setShowUpload(true)}>
                    <div className="vault-ingestion-header">
                        <UploadCloud className="vault-logo-icon" size={32} />
                        <div className="vault-ingestion-badge">System Live</div>
                    </div>
                    <div className="vault-ingestion-info">
                        <h3>Ingestion Hub</h3>
                        <p>Sync external registers directly to vault.</p>
                    </div>
                    <div className="vault-ingestion-footer">
                        Deploy Upload <ChevronRight size={14} />
                    </div>
                </div>
            </div>

            <div className="vault-main-layout">

                {/* SIDEBAR PRESETS */}
                <div className="vault-sidebar">
                    <div className="vault-sidebar-card">
                        <div className="vault-section-header">
                            <Activity className="vault-logo-icon" size={18} />
                            <h3 className="vault-section-title">Logic Presets</h3>
                        </div>
                        <div className="vault-preset-list">
                            {PRESET_TEMPLATES.map((p, i) => (
                                <div key={i} onClick={() => addPreset(p)} className="vault-preset-item">
                                    <div>
                                        <p className="vault-preset-name">{p.name}</p>
                                        <p className="vault-preset-desc">{p.description}</p>
                                    </div>
                                    <Plus size={14} className="vault-logo-icon" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="vault-sidebar-card">
                        <div className="vault-section-header">
                            <PieChart className="vault-logo-icon" size={18} />
                            <h3 className="vault-section-title">Export Options</h3>
                        </div>
                        <div className="vault-preset-list">
                            <button className="vault-preset-item w-full border-none bg-tertiary cursor-pointer hover:bg-secondary">
                                <span className="vault-preset-name">Download Vault JSON</span>
                                <Download size={14} className="text-accent" />
                            </button>
                            <button className="vault-preset-item w-full border-none bg-tertiary cursor-pointer hover:bg-secondary">
                                <span className="vault-preset-name">Print Asset Ledger</span>
                                <ExternalLink size={14} className="text-accent" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN REGISTER */}
                <div className="vault-register-area">
                    <div className="vault-register-tabs">
                        {['all', 'earning', 'deduction'].map(tab => (
                            <button
                                key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                className={`vault-tab-btn ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="vault-spinner mx-auto mb-4"></div>
                            <p className="vault-subtitle">Accessing Secure Records...</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="vault-grid">
                            {paginatedItems.map(comp => (
                                <div key={comp.id} className="vault-card">
                                    <div className="vault-card-header">
                                        <div className={`vault-card-icon-box ${comp.component_type}`}>
                                            {comp.component_type === 'earning' ? <TrendingUp size={24} /> : <ShieldCheck size={24} />}
                                        </div>
                                        <div className="vault-card-actions">
                                            <button onClick={() => cloneComp(comp)} className="vault-action-btn" title="Clone"><Copy size={16} /></button>
                                            <button onClick={() => { setEditComp(comp); setShowForm(true); }} className="vault-action-btn" title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(comp.id)} className="vault-action-btn delete" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <h4 className="vault-card-title">{comp.name}</h4>
                                    <p className="vault-card-code">{comp.code}</p>

                                    <div className="vault-card-details">
                                        <div className="vault-detail-box">
                                            <p className="vault-detail-label">Logic Source</p>
                                            <p className="vault-detail-value uppercase">{comp.calculation_type === 'fixed' ? 'FIXED SUM' : `% of ${comp.percentage_of}`}</p>
                                        </div>
                                        <div className="vault-detail-box">
                                            <p className="vault-detail-label">Vault Impact</p>
                                            <p className={`vault-detail-value ${comp.component_type}`}>
                                                {comp.component_type === 'earning' ? '+' : '-'} {comp.calculation_type === 'fixed' ? `₹${comp.amount}` : `${comp.percentage_value}%`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {paginatedItems.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-color rounded-3xl">
                                    <p className="vault-subtitle">No matching personnel assets found in this sector.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="vault-list-container">
                            <table className="vault-table">
                                <thead>
                                    <tr>
                                        <th className="vault-th">Component Asset</th>
                                        <th className="vault-th text-center">Logic Method</th>
                                        <th className="vault-th text-right" style={{ paddingRight: '40px' }}>Value Mapping</th>
                                        <th className="vault-th text-right">Options</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map(comp => (
                                        <tr key={comp.id} className="vault-tr group">
                                            <td className="vault-td">
                                                <div className="vault-compact-info">
                                                    <div className={`vault-mini-icon ${comp.component_type}`}>
                                                        {comp.component_type === 'earning' ? <TrendingUp size={18} className="text-orange-400" /> : <ShieldCheck size={18} className="text-red-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="vault-card-title">{comp.name}</p>
                                                        <p className="vault-card-code !mb-0 !text-[10px] !text-secondary uppercase">{comp.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="vault-td text-center">
                                                <p className="vault-method-tag">
                                                    {comp.calculation_type === 'fixed' ? 'FIXED SUM' :
                                                        comp.calculation_type === 'percentage' ? `RATIO OF ${comp.percentage_of}` :
                                                            comp.calculation_type === 'attendance_prorated' ? 'PRO-RATA' : 'DAILY RATE'}
                                                </p>
                                            </td>
                                            <td className="vault-td text-right" style={{ paddingRight: '40px' }}>
                                                <p className={`vault-impact-text ${comp.component_type === 'earning' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {comp.component_type === 'earning' ? '+' : '-'} {comp.calculation_type === 'fixed' || comp.calculation_type === 'per_day' || comp.calculation_type === 'attendance_prorated' ? `₹${comp.amount}` : `${comp.percentage_value}%`}
                                                </p>
                                            </td>
                                            <td className="vault-td text-right">
                                                <div className="vault-card-actions" style={{ justifyContent: 'flex-end' }}>
                                                    <button onClick={() => { setEditComp(comp); setShowForm(true); }} className="vault-action-btn"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(comp.id)} className="vault-action-btn delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    )}

                    {/* PAGINATION HUD - UNIVERSAL */}
                    {!loading && filtered.length > 0 && (
                        <div className="vault-pagination-hud">
                            <div className="vault-pagination-info">
                                Vault Sector <span className="vault-title-accent">{currentPage}</span> / {totalPages}
                            </div>
                            <div className="vault-pagination-controls">
                                <GoldButton variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="vault-page-nav">
                                    <ChevronLeft size={16} />
                                </GoldButton>
                                <div className="vault-page-numbers">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`vault-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <GoldButton variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="vault-page-nav">
                                    <ChevronRight size={16} />
                                </GoldButton>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {showForm && (
                <ComponentForm
                    component={editComp} allComponents={components}
                    onClose={() => { setShowForm(false); setEditComp(null); }}
                    onSave={handleSave}
                />
            )}

            {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
        </div>
    );
}
