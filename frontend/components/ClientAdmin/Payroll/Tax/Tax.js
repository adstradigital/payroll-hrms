'use client';

import React, { useState, useEffect } from 'react';
import {
    getTaxDashboardStats,
    updateTaxDeclaration,
    getTaxSlabs,
    getTaxDeclarations,
    createTaxSlab,
    updateTaxSlab,
    deleteTaxSlab,
    getPayrollSettings,
    updatePayrollSettings
} from '../../../../api/api_clientadmin';
import './Tax.css';
import {
    Percent,
    FileCheck,
    Users,
    TrendingUp,
    ChevronRight,
    Plus,
    Filter,
    Download,
    Check,
    X,
    Eye,
    Loader,
    Pencil,
    Trash2,
    AlertCircle,
    Settings,
    Save,
    Calendar,
    Shield
} from 'lucide-react';
import TaxSlabModal from './TaxSlabModal';

const TaxManagement = () => {
    const [activeTab, setActiveTab] = useState('slabs');
    const [regime, setRegime] = useState('new');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({
        projected_tds: 0,
        pending_declarations: 0,
        regime_split: { new: 0, old: 0 }
    });
    const [taxSlabs, setTaxSlabs] = useState([]);
    const [declarations, setDeclarations] = useState([]);
    const [payrollSettings, setPayrollSettings] = useState({
        enable_auto_tds: true,
        financial_year: '2025-2026',
        default_tax_regime: 'new',
        allow_manual_tds_override: false,
        apply_tds_monthly: true,

        // PF Settings
        pf_enabled: true,
        pf_contribution_rate_employer: 12.00,
        pf_contribution_rate_employee: 12.00,
        pf_wage_ceiling: 15000.00,
        pf_is_restricted_basic: true,
        pf_include_employer_share_in_ctc: true,

        // ESI Settings
        esi_enabled: true,
        esi_contribution_rate_employer: 3.25,
        esi_contribution_rate_employee: 0.75,
        esi_wage_ceiling: 21000.00
    });

    // Modal & Action States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlab, setEditingSlab] = useState(null);
    const [notification, setNotification] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Clear notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, slabsRes, declRes, settingsRes] = await Promise.all([
                getTaxDashboardStats(),
                getTaxSlabs({ limit: 100 }), // Fetch all slabs
                getTaxDeclarations({ limit: 50, ordering: '-created_at' }),
                getPayrollSettings()
            ]);

            console.log("Tax data fetched successfully", { stats: statsRes.data, slabs: slabsRes.data, decls: declRes.data, settings: settingsRes.data });
            setStats(statsRes.data);
            setTaxSlabs(slabsRes.data.results || slabsRes.data); // Handle pagination
            setDeclarations(declRes.data.results || declRes.data);
            if (settingsRes.data) {
                setPayrollSettings(settingsRes.data);
            }
        } catch (err) {
            console.error("Error fetching tax data:", err);
            const msg = err.response?.data?.error || err.response?.data?.detail || err.message;
            setError(`Failed to load tax management data: ${msg}`);
        } finally {
            setLoading(false);
        }
    };



    // --- Slab Actions ---

    const handleAddSlab = () => {
        setEditingSlab(null);
        setIsModalOpen(true);
    };

    const handleEditSlab = (slab) => {
        setEditingSlab(slab);
        setIsModalOpen(true);
    };

    const handleSaveSlab = async (data) => {
        try {
            if (editingSlab) {
                await updateTaxSlab(editingSlab.id, data);
                showNotification('Tax slab updated successfully');
            } else {
                await createTaxSlab({ ...data, company: 'auto' }); // Company handled by backend
                showNotification('Tax slab created successfully');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving slab:", error);
            showNotification('Failed to save tax slab', 'error');
        }
    };

    const handleDeleteSlab = async (id) => {
        if (window.confirm('Are you sure you want to delete this tax slab?')) {
            try {
                await deleteTaxSlab(id);
                showNotification('Tax slab deleted successfully');
                fetchData();
            } catch (error) {
                console.error("Error deleting slab:", error);
                showNotification('Failed to delete tax slab', 'error');
            }
        }
    };

    // --- Declaration Actions ---

    const handleUpdateDeclaration = async (id, status) => {
        try {
            await updateTaxDeclaration(id, { status });
            showNotification(`Declaration ${status} successfully`);

            // Optimistic update
            setDeclarations(prev => prev.map(d =>
                d.id === id ? { ...d, status } : d
            ));

            // Refresh stats slightly delayed to allow backend processing
            setTimeout(() => {
                getTaxDashboardStats().then(res => setStats(res.data));
            }, 500);

        } catch (error) {
            console.error("Error updating declaration:", error);
            showNotification('Failed to update status', 'error');
        }
    };

    const handleUpdateSettings = async (e) => {
        if (e) e.preventDefault();
        console.log("Saving settings:", payrollSettings);
        setSaving(true);
        try {
            await updatePayrollSettings(payrollSettings);
            console.log("Settings updated successfully");
            showNotification('Payroll settings updated successfully');
            // Fallback alert to be absolutely sure
            alert('Settings saved successfully!');
        } catch (error) {
            console.error("Error updating settings:", error);
            const msg = error.response?.data?.error || error.message;
            showNotification(`Failed to update settings: ${msg}`, 'error');
            alert(`Error saving settings: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    // Filter slabs based on selected regime
    const currentSlabs = taxSlabs.filter(slab => slab.regime === regime)
        .sort((a, b) => a.min_income - b.min_income);

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return 'No Limit';
        return '₹' + new Intl.NumberFormat('en-IN').format(val);
    };

    const StatusBadge = ({ status }) => (
        <span className={`tax-badge ${status}`}>
            {status}
        </span>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="text-rose-500 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Failed to Load</h2>
                <p className="text-muted max-w-md mx-auto mb-6">{error}</p>
                <button
                    className="tax-btn-primary"
                    onClick={fetchData}
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    // Calculate stats for display
    const totalRegimeCount = stats.regime_split.new + stats.regime_split.old;
    const newRegimePct = totalRegimeCount > 0 ? Math.round((stats.regime_split.new / totalRegimeCount) * 100) : 0;

    return (
        <div className="tax-container">
            <div className="tax-header">
                <div>
                    <h1 className="tax-title">Tax Management</h1>
                    <p className="text-muted text-sm mt-1">Configure income tax slabs and verify employee declarations</p>
                </div>
                <button className="tax-btn-primary">
                    <Download size={18} className="mr-2 inline" /> Export TDS Report
                </button>
            </div>

            <div className="tax-stats-grid">
                <div className="tax-stat-card">
                    <div className="tax-stat-label">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Total TDS Projected
                    </div>
                    <div className="tax-stat-value">{formatCurrency(stats.projected_tds)}</div>
                    <div className="tax-stat-trend text-emerald-500">
                        Annual Projection
                    </div>
                </div>
                <div className="tax-stat-card">
                    <div className="tax-stat-label">
                        <FileCheck size={16} className="text-amber-500" />
                        Pending Declarations
                    </div>
                    <div className="tax-stat-value">{stats.pending_declarations}</div>
                    <div className="tax-stat-trend text-amber-500">
                        Require verification
                    </div>
                </div>
                <div className="tax-stat-card">

                    <div className="tax-stat-label">
                        <Users size={16} className="text-blue-500" />
                        Tax Regime Split
                    </div>
                    <div className="tax-stat-value">62% / 38%</div>
                    <div className="tax-stat-trend text-blue-500">
                        New Regime vs Old Regime
                    </div>
                </div>
            </div>

            <div className="tax-tabs">
                <button
                    className={`tax-tab ${activeTab === 'slabs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('slabs')}
                >
                    Income Tax Slabs
                </button>
                <button
                    className={`tax-tab ${activeTab === 'declarations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('declarations')}
                >
                    Declarations Queue
                </button>
                <button
                    className={`tax-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    TDS Settings
                </button>
                <button
                    className={`tax-tab ${activeTab === 'esi-pf' ? 'active' : ''}`}
                    onClick={() => setActiveTab('esi-pf')}
                >
                    ESI & PF
                </button>
            </div>

            <div className="tax-content">
                {activeTab === 'slabs' && (
                    <>
                        <div className="tax-toolbar">
                            <div className="tax-regime-selector">
                                <button
                                    className={`tax-regime-btn ${regime === 'new' ? 'active' : ''}`}
                                    onClick={() => setRegime('new')}
                                >
                                    New Regime (FY 2025-26)
                                </button>
                                <button
                                    className={`tax-regime-btn ${regime === 'old' ? 'active' : ''}`}
                                    onClick={() => setRegime('old')}
                                >
                                    Old Regime
                                </button>
                            </div>

                            <button className="tax-btn-action" onClick={handleAddSlab}>
                                <Plus size={16} /> Add Custom Slab
                            </button>
                        </div>

                        <table className="tax-table">
                            <thead>
                                <tr>
                                    <th>Income Range</th>
                                    <th>Tax Rate</th>
                                    <th>Calculated Tax (at Max)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentSlabs.map(slab => (
                                    <tr key={slab.id}>
                                        <td className="font-medium">
                                            {formatCurrency(slab.min_income)} - {formatCurrency(slab.max_income)}
                                        </td>
                                        <td>
                                            <span className="text-brand font-bold">{slab.tax_rate}%</span>
                                            {Number(slab.cess) > 0 && <span className="text-xs text-muted ml-2">(+ {slab.cess}% Cess)</span>}
                                        </td>
                                        <td className="text-muted">
                                            {slab.max_income ? formatCurrency((slab.max_income - slab.min_income) * (slab.tax_rate / 100)) : 'Balance Amount'}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-400"
                                                    onClick={() => handleEditSlab(slab)}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-rose-400"
                                                    onClick={() => handleDeleteSlab(slab.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {currentSlabs.length === 0 && (
                            <div className="text-center py-12 text-muted">
                                <p>No tax slabs found for this regime.</p>
                                <button className="text-brand text-sm mt-2 hover:underline" onClick={handleAddSlab}>
                                    Create your first slab
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'declarations' && (
                    <>
                        <div className="tax-toolbar">
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <select className="bg-transparent border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary">
                                    <option>All Types</option>
                                    <option>80C Investments</option>
                                    <option>HRA / Rent</option>
                                    <option>80D Medical</option>
                                </select>
                            </div>
                        </div>

                        <table className="tax-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Regime</th>
                                    <th>Declared Amount</th>
                                    <th>Status</th>
                                    <th>Date Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {declarations.map(dec => (
                                    <tr key={dec.id}>
                                        <td>
                                            <div className="font-medium">{dec.employee_name}</div>
                                            <div className="text-xs text-muted">ID: {dec.employee_id_display}</div>
                                        </td>
                                        <td><span className="tax-badge">{dec.regime}</span></td>
                                        <td className="font-mono font-bold">{formatCurrency(dec.total_declared_amount)}</td>
                                        <td><StatusBadge status={dec.status} /></td>
                                        <td className="text-muted text-sm">{new Date(dec.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="p-2 hover:bg-white/5 rounded-lg text-blue-400" title="View Proof">
                                                    <Eye size={18} />
                                                </button>
                                                {dec.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="p-2 hover:bg-white/5 rounded-lg text-emerald-400"
                                                            title="Approve"
                                                            onClick={() => handleUpdateDeclaration(dec.id, 'approved')}
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            className="p-2 hover:bg-white/5 rounded-lg text-rose-400"
                                                            title="Reject"
                                                            onClick={() => handleUpdateDeclaration(dec.id, 'rejected')}
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {declarations.length === 0 && (
                            <div className="text-center py-12 text-muted">
                                <FileCheck size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No tax declarations found.</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="tax-settings-panel">
                        <div className="tax-settings-header">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Tax & Statutory Configuration</h3>
                                    <p className="text-sm text-muted">Manage organization-wide TDS calculation rules</p>
                                </div>
                            </div>
                            <button
                                className="tax-btn-primary"
                                onClick={handleUpdateSettings}
                                disabled={saving}
                            >
                                {saving ? <Loader size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="tax-settings-grid">
                            {/* Auto TDS Toggle */}
                            <div className="tax-settings-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                            <Percent size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">Auto TDS Calculation</div>
                                            <div className="text-xs text-muted">Automatic deduction during payroll</div>
                                        </div>
                                    </div>
                                    <label className="tax-toggle">
                                        <input
                                            type="checkbox"
                                            checked={payrollSettings.enable_auto_tds}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, enable_auto_tds: e.target.checked })}
                                        />
                                        <span className="tax-toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="text-sm text-muted">
                                    When enabled, the system will automatically calculate and deduct TDS based on income tax slabs and employee declarations.
                                </p>
                            </div>

                            {/* Financial Year & Regime */}
                            <div className="tax-settings-card">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="font-bold">Period & Regime</div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-muted mb-1.5">Active Financial Year</label>
                                        <select
                                            className="tax-input"
                                            value={payrollSettings.financial_year}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, financial_year: e.target.value })}
                                        >
                                            <option value="2024-2025">2024 - 2025</option>
                                            <option value="2025-2026">2025 - 2026</option>
                                            <option value="2026-2027">2026 - 2027</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-muted mb-1.5">Default Tax Regime</label>
                                        <select
                                            className="tax-input"
                                            value={payrollSettings.default_tax_regime}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, default_tax_regime: e.target.value })}
                                        >
                                            <option value="new">New Tax Regime (Simplified)</option>
                                            <option value="old">Old Tax Regime (With Deductions)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Overrides */}
                            <div className="tax-settings-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                            <Pencil size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">Manual Overrides</div>
                                            <div className="text-xs text-muted">Allow admin adjustments</div>
                                        </div>
                                    </div>
                                    <label className="tax-toggle">
                                        <input
                                            type="checkbox"
                                            checked={payrollSettings.allow_manual_tds_override}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, allow_manual_tds_override: e.target.checked })}
                                        />
                                        <span className="tax-toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="text-sm text-muted mb-4">
                                    Allow HR admins to manually adjust the TDS amount for specific employees during payroll processing.
                                </p>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-xs text-amber-500/80">
                                    <AlertCircle size={14} />
                                    <span>Manual overrides bypass the system's tax slab calculations.</span>
                                </div>
                            </div>

                            {/* Application Frequency */}
                            <div className="tax-settings-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">Apply TDS Monthly</div>
                                            <div className="text-xs text-muted">Deduction frequency</div>
                                        </div>
                                    </div>
                                    <label className="tax-toggle">
                                        <input
                                            type="checkbox"
                                            checked={payrollSettings.apply_tds_monthly}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, apply_tds_monthly: e.target.checked })}
                                        />
                                        <span className="tax-toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="text-sm text-muted">
                                    Divide the annual tax liability by 12 and deduct it monthly. If unchecked, tax will only be deducted during final settlement.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'esi-pf' && (
                    <div className="tax-settings-panel">
                        <div className="tax-settings-header">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">ESI & PF Configuration</h3>
                                    <p className="text-sm text-muted">Manage statutory contribution rates and ceilings</p>
                                </div>
                            </div>
                            <button
                                className="tax-btn-primary"
                                onClick={handleUpdateSettings}
                                disabled={saving}
                            >
                                {saving ? <Loader size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="tax-settings-grid">
                            {/* PF Settings */}
                            <div className="tax-settings-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">Provident Fund (PF)</div>
                                            <div className="text-xs text-muted">Statutory retirement benefit</div>
                                        </div>
                                    </div>
                                    <label className="tax-toggle">
                                        <input
                                            type="checkbox"
                                            checked={payrollSettings.pf_enabled}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, pf_enabled: e.target.checked })}
                                        />
                                        <span className="tax-toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div>
                                        <label className="block text-xs text-muted mb-1.5">Emp. Contribution %</label>
                                        <input
                                            type="number" className="tax-input" step="0.01"
                                            value={payrollSettings.pf_contribution_rate_employee}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, pf_contribution_rate_employee: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted mb-1.5">Org. Contribution %</label>
                                        <input
                                            type="number" className="tax-input" step="0.01"
                                            value={payrollSettings.pf_contribution_rate_employer}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, pf_contribution_rate_employer: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted mb-1.5">Wage Ceiling (₹)</label>
                                        <input
                                            type="number" className="tax-input"
                                            value={payrollSettings.pf_wage_ceiling}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, pf_wage_ceiling: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <label className="tax-toggle scale-75">
                                            <input
                                                type="checkbox"
                                                checked={payrollSettings.pf_is_restricted_basic}
                                                onChange={(e) => setPayrollSettings({ ...payrollSettings, pf_is_restricted_basic: e.target.checked })}
                                            />
                                            <span className="tax-toggle-slider"></span>
                                        </label>
                                        <span className="text-xs text-muted leading-tight">Restrict to Ceiling</span>
                                    </div>
                                </div>
                            </div>

                            {/* ESI Settings */}
                            <div className="tax-settings-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                            <Percent size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">ESI Configuration</div>
                                            <div className="text-xs text-muted">Employee State Insurance</div>
                                        </div>
                                    </div>
                                    <label className="tax-toggle">
                                        <input
                                            type="checkbox"
                                            checked={payrollSettings.esi_enabled}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, esi_enabled: e.target.checked })}
                                        />
                                        <span className="tax-toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div>
                                        <label className="block text-xs text-muted mb-1.5">Emp. Contribution %</label>
                                        <input
                                            type="number" className="tax-input" step="0.01"
                                            value={payrollSettings.esi_contribution_rate_employee}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, esi_contribution_rate_employee: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted mb-1.5">Org. Contribution %</label>
                                        <input
                                            type="number" className="tax-input" step="0.01"
                                            value={payrollSettings.esi_contribution_rate_employer}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, esi_contribution_rate_employer: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-muted mb-1.5">Wage Limit for Eligibility (₹)</label>
                                        <input
                                            type="number" className="tax-input"
                                            value={payrollSettings.esi_wage_ceiling}
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, esi_wage_ceiling: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Info */}
                        <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-4">
                            <Shield className="text-blue-500 shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-sm text-blue-400">Statutory Compliance</h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                    PF and ESI contributions are mandatory welfare schemes. These settings directly affect the deductions on employee payslips.
                                    Ensure that the contribution rates are aligned with the latest EPFO and ESIC notifications.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <TaxSlabModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSlab}
                initialData={editingSlab}
                regime={regime}
            />

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-in ${notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                    {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}
        </div>
    );
};

export default TaxManagement;
