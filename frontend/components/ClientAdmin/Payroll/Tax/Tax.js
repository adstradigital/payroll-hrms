'use client';

import React, { useState, useEffect } from 'react';
import {
    getAllEmployees,
    getSalaryComponents,
    getPayslipDashboardStats
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
    Eye
} from 'lucide-react';

const TaxManagement = () => {
    const [activeTab, setActiveTab] = useState('slabs');
    const [regime, setRegime] = useState('new');
    const [loading, setLoading] = useState(false);

    // Mock Data for Slabs
    const taxSlabs = {
        new: [
            { id: 1, min: 0, max: 300000, rate: 0 },
            { id: 2, min: 300001, max: 600000, rate: 5 },
            { id: 3, min: 600001, max: 900000, rate: 10 },
            { id: 4, min: 900001, max: 1200000, rate: 15 },
            { id: 5, min: 1200001, max: 1500000, rate: 20 },
            { id: 6, min: 1500001, max: null, rate: 30 },
        ],
        old: [
            { id: 1, min: 0, max: 250000, rate: 0 },
            { id: 2, min: 250001, max: 500000, rate: 5 },
            { id: 3, min: 500001, max: 1000000, rate: 20 },
            { id: 4, min: 1000001, max: null, rate: 30 },
        ]
    };

    // Mock Data for Declarations
    const [declarations, setDeclarations] = useState([
        { id: 'DEC001', employee: 'John Doe', type: '80C', amount: 150000, status: 'approved', date: '2026-01-15' },
        { id: 'DEC002', employee: 'Alice Smith', type: 'HRA', amount: 240000, status: 'pending', date: '2026-02-01' },
        { id: 'DEC003', employee: 'Bob Wilson', type: '80D', amount: 25000, status: 'pending', date: '2026-02-10' },
        { id: 'DEC004', employee: 'Emma Brown', type: 'Investment', amount: 50000, status: 'rejected', date: '2026-01-20' },
    ]);

    const formatCurrency = (val) => {
        if (val === null) return 'No Limit';
        return '₹' + new Intl.NumberFormat('en-IN').format(val);
    };

    const StatusBadge = ({ status }) => (
        <span className={`tax-badge ${status}`}>
            {status}
        </span>
    );

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
                    <div className="tax-stat-value">₹12,45,000</div>
                    <div className="tax-stat-trend text-emerald-500">
                        +8.2% from last quarter
                    </div>
                </div>
                <div className="tax-stat-card">
                    <div className="tax-stat-label">
                        <FileCheck size={16} className="text-amber-500" />
                        Pending Declarations
                    </div>
                    <div className="tax-stat-value">24</div>
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
                            <button className="tax-btn-action">
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
                                {taxSlabs[regime].map(slab => (
                                    <tr key={slab.id}>
                                        <td className="font-medium">
                                            {formatCurrency(slab.min)} - {formatCurrency(slab.max)}
                                        </td>
                                        <td>
                                            <span className="text-brand font-bold">{slab.rate}%</span>
                                        </td>
                                        <td className="text-muted">
                                            {slab.max ? formatCurrency((slab.max - slab.min) * (slab.rate / 100)) : 'Balance Amount'}
                                        </td>
                                        <td>
                                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    <th>Section</th>
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
                                            <div className="font-medium">{dec.employee}</div>
                                            <div className="text-xs text-muted">ID: {dec.id}</div>
                                        </td>
                                        <td><span className="tax-badge old">{dec.type}</span></td>
                                        <td className="font-mono font-bold">{formatCurrency(dec.amount)}</td>
                                        <td><StatusBadge status={dec.status} /></td>
                                        <td className="text-muted text-sm">{dec.date}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="p-2 hover:bg-white/5 rounded-lg text-blue-400" title="View Proof">
                                                    <Eye size={18} />
                                                </button>
                                                {dec.status === 'pending' && (
                                                    <>
                                                        <button className="p-2 hover:bg-white/5 rounded-lg text-emerald-400" title="Approve">
                                                            <Check size={18} />
                                                        </button>
                                                        <button className="p-2 hover:bg-white/5 rounded-lg text-rose-400" title="Reject">
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
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="p-8 text-center">
                        <Percent size={48} className="mx-auto mb-4 text-muted opacity-20" />
                        <h3 className="text-xl font-bold mb-2">TDS Auto-Calculation</h3>
                        <p className="text-muted max-w-md mx-auto mb-6">
                            Configure how the system automatically deducts TDS based on projected annual income and declared investments.
                        </p>
                        <button className="tax-btn-primary">Enable Automatic TDS</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaxManagement;
