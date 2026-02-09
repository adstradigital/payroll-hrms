'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Download, MoreVertical,
    CheckCircle2, XCircle, Clock, Wallet, ArrowRight,
    Briefcase, Calendar, ChevronRight, LayoutDashboard,
    FileText, User, IndianRupee, PieChart, TrendingUp
} from 'lucide-react';
import {
    getAdvances, getAdvanceStats, getMyProfile,
    updateAdvance, deleteAdvance, getAllEmployees
} from '@/api/api_clientadmin';
import RequestAdvanceModal from './RequestAdvanceModal';
import './AdvanceSalary.css';

export default function AdvanceSalary() {
    // State
    const [advances, setAdvances] = useState([]);
    const [stats, setStats] = useState({
        total_advances_given: 0,
        outstanding_amount: 0,
        pending_requests: 0,
        approved_this_month: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const profRes = await getMyProfile();
            const companyUser = profRes.data;
            setCurrentUser(companyUser);

            const [advRes, statsRes] = await Promise.all([
                getAdvances(),
                getAdvanceStats()
            ]);

            // Filter advances for current user
            const allAdvances = advRes.data.results || advRes.data || [];
            if (companyUser) {
                setAdvances(allAdvances.filter(a => a.employee === companyUser.id));
            } else {
                setAdvances([]);
            }

            setStats(statsRes.data || stats);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };



    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredAdvances = advances.filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesSearch =
            a.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.employee_id_display?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="adv-status pending"><Clock size={12} /> Pending</span>;
            case 'approved': return <span className="adv-status approved"><CheckCircle2 size={12} /> Approved</span>;
            case 'disbursed': return <span className="adv-status disbursed"><Wallet size={12} /> Disbursed</span>;
            case 'rejected': return <span className="adv-status rejected"><XCircle size={12} /> Rejected</span>;
            case 'completed': return <span className="adv-status completed"><CheckCircle2 size={12} /> Paid</span>;
            default: return <span className="adv-status default">{status}</span>;
        }
    };

    return (
        <div className="adv-container animate-fade-in">
            {/* Header Area */}
            <div className="adv-header">
                <div>
                    <h1 className="adv-title">My Advance <span className="text-gold">Salary</span></h1>
                    <p className="adv-subtitle">Request and track your short-term financial advances.</p>
                </div>
                <button className="adv-btn-primary" onClick={() => setShowRequestModal(true)}>
                    <Plus size={18} /> Request Advance
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="adv-stats-grid">
                <div className="adv-stat-card card-glass">
                    <div className="adv-stat-icon bg-gold-faded"><IndianRupee size={24} /></div>
                    <div className="adv-stat-content">
                        <span className="adv-stat-label">Total Disbursed</span>
                        <h2 className="adv-stat-value">{formatCurrency(stats.total_advances_given)}</h2>
                    </div>
                </div>
                <div className="adv-stat-card card-glass">
                    <div className="adv-stat-icon bg-red-faded"><Wallet size={24} /></div>
                    <div className="adv-stat-content">
                        <span className="adv-stat-label">Outstanding Balance</span>
                        <h2 className="adv-stat-value">{formatCurrency(stats.outstanding_amount)}</h2>
                    </div>
                </div>
                <div className="adv-stat-card card-glass">
                    <div className="adv-stat-icon bg-blue-faded"><Clock size={24} /></div>
                    <div className="adv-stat-content">
                        <span className="adv-stat-label">Pending My Requests</span>
                        <h2 className="adv-stat-value">{advances.filter(a => a.status === 'pending').length}</h2>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="adv-tabs-container card-glass">
                <div className="adv-tabs">
                    <button
                        className={`adv-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button
                        className={`adv-tab ${activeTab === 'my' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my')}
                    >
                        <User size={18} /> History & Status
                    </button>
                </div>

                <div className="adv-tab-content">
                    {/* Toolbar */}
                    <div className="adv-toolbar">
                        <div className="adv-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="adv-filters">
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="disbursed">Disbursed</option>
                                <option value="completed">Completed</option>
                            </select>
                            <button className="adv-btn-icon"><Download size={18} /></button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="adv-table-responsive">
                        <table className="adv-table">
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Principal</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                                ) : filteredAdvances.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div className="font-semibold">ADV-{a.id.slice(0, 8).toUpperCase()}</div>
                                            <div className="text-xs text-muted">{a.tenure_months} Months Plan</div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{formatCurrency(a.principal_amount)}</div>
                                            <div className="text-xs text-muted">Balance: {formatCurrency(a.balance_amount)}</div>
                                        </td>
                                        <td>{getStatusBadge(a.status)}</td>
                                        <td className="text-right">
                                            <button className="adv-btn-icon" title="View Details"><ArrowRight size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAdvances.length === 0 && !loading && (
                                    <tr><td colSpan="6" className="text-center py-20 text-muted">No records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showRequestModal && (
                <RequestAdvanceModal
                    onClose={() => setShowRequestModal(false)}
                    onSuccess={() => { fetchInitialData(); setShowRequestModal(false); }}
                />
            )}
        </div>
    );
}
