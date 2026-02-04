'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, Filter, Download, Eye, Calendar, User,
    Activity, Shield, Database, AlertCircle, CheckCircle,
    ChevronLeft, ChevronRight, X, Info, FileJson, Clock,
    RotateCcw, Zap, Terminal, ShieldAlert, Cpu, Globe,
    BarChart3, Fingerprint, Layers
} from 'lucide-react';
import * as activityLogApi from '@/api/activityLogApi';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'react-hot-toast';
import './Activitylog.css';

const ActivityLog = () => {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        module: '',
        action_type: '',
        status: '',
        search: ''
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                ...filters,
                // If activeTab is not 'all', add it to filters
                ...(activeTab !== 'all' ? { module: activeTab.toUpperCase() } : {})
            };
            const data = await activityLogApi.getActivityLogs(params);
            setLogs(data.results || []);
            setTotalCount(data.count || 0);
            setTotalPages(Math.ceil((data.count || 0) / 20));
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    }, [page, filters, activeTab]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({ module: '', action_type: '', status: '', search: '' });
        setActiveTab('all');
        setPage(1);
    };

    const stats = useMemo(() => [
        { label: 'Total Events', value: totalCount.toLocaleString(), icon: Activity, color: '#FFD700', trend: 'Live' },
        { label: 'Security Alerts', value: '0', icon: ShieldAlert, color: '#FF4D4D', trend: 'Stable' },
        { label: 'System Health', value: '99.9%', icon: Cpu, color: '#00FF9D', trend: 'Optimal' },
        { label: 'Network status', value: 'Active', icon: Globe, color: '#4DA6FF', trend: 'Online' },
    ], [totalCount]);

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return 'ot-status-success';
            case 'FAILED': return 'ot-status-failed';
            default: return 'ot-status-info';
        }
    };

    const getActionIcon = (actionType) => {
        switch (actionType?.toUpperCase()) {
            case 'LOGIN': return <Fingerprint size={16} className="text-amber" />;
            case 'CREATE': return <Layers size={16} className="text-blue" />;
            case 'UPDATE': return <RotateCcw size={16} className="text-purple" />;
            case 'DELETE': return <ShieldAlert size={16} className="text-red" />;
            case 'PROCESS': return <Zap size={16} className="text-yellow" />;
            default: return <Terminal size={16} className="text-muted" />;
        }
    };

    const handleExport = async () => {
        try {
            const allLogs = await activityLogApi.exportActivityLogs(filters);
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Timestamp,User,Role,Module,Action,Description,Status,IP Address\n"
                + allLogs.map(log => {
                    return `"${log.timestamp}","${log.user_detail?.full_name || 'System'}","${log.user_role || ''}","${log.module_display}","${log.action_type_display}","${log.description}","${log.status}","${log.ip_address || ''}"`;
                }).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Logs exported successfully');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="ot-matrix-container animate-fade-in">
            {/* Background Orbs */}
            <div className="ot-bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
            </div>

            <div className="ot-matrix-content">
                {/* Header Section */}
                <header className="ot-matrix-header">
                    <div className="header-brand">
                        <div className="brand-icon">
                            <Database size={24} />
                        </div>
                        <div className="brand-text">
                            <h1>System Audit Matrix</h1>
                            <p>Real-time monitoring and high-fidelity forensic logs for enterprise security oversight.</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="ot-btn ot-btn-glass" onClick={handleExport}>
                            <Download size={18} />
                            <span>Export Ledger</span>
                        </button>
                        <button className="ot-btn ot-btn-primary">
                            <Shield size={18} />
                            <span>Security Protocols</span>
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="ot-stats-grid">
                    {stats.map((stat, i) => (
                        <div key={i} className="ot-stat-card">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15` }}>
                                    <stat.icon size={20} style={{ color: stat.color }} />
                                </div>
                                <span className={`stat-trend ${stat.trend === 'Stable' || stat.trend === 'Optimal' || stat.trend === 'Online' ? 'trend-stable' : 'trend-up'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div className="stat-body">
                                <h3>{stat.label}</h3>
                                <p>{stat.value}</p>
                            </div>
                            <div className="stat-progress-bar" />
                        </div>
                    ))}
                </div>

                {/* Action Bar */}
                <div className="ot-action-bar">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Query by Transaction ID, User, or Description..."
                            value={filters.search}
                            name="search"
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="action-groups">
                        <div className="tab-group">
                            {['All', 'Auth', 'Employee', 'Payroll'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab.toLowerCase())}
                                    className={`tab-btn ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="ot-filters-panel animate-slide-down">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <label>Module Origin</label>
                                <select name="module" value={filters.module} onChange={handleFilterChange}>
                                    <option value="">All Sources</option>
                                    <option value="AUTH">Authentication</option>
                                    <option value="EMPLOYEE">Employee Mgmt</option>
                                    <option value="PAYROLL">Payroll Engine</option>
                                    <option value="SYSTEM">System Core</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Action Type</label>
                                <select name="action_type" value={filters.action_type} onChange={handleFilterChange}>
                                    <option value="">All Actions</option>
                                    <option value="CREATE">Creation</option>
                                    <option value="UPDATE">Update</option>
                                    <option value="DELETE">Deletion</option>
                                    <option value="LOGIN">Authentication</option>
                                    <option value="PROCESS">Processing</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Status</label>
                                <select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="">All Statuses</option>
                                    <option value="SUCCESS">Success</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                            </div>
                            <div className="filter-actions">
                                <button className="ot-btn-reset" onClick={resetFilters}>
                                    Reset Engine Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Log Table Container */}
                <div className="ot-table-card">
                    <div className="table-responsive">
                        <table className="ot-matrix-table">
                            <thead>
                                <tr>
                                    <th>Temporal Stamp</th>
                                    <th>Actor Entity</th>
                                    <th>Vector & Action</th>
                                    <th>Description Ledger</th>
                                    <th>Status</th>
                                    <th className="text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="skeleton-row">
                                            <td colSpan={6}><div className="skeleton-line" /></td>
                                        </tr>
                                    ))
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="matrix-row">
                                            <td className="col-temporal">
                                                <div className="temporal-cell">
                                                    <span className="time">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="date">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="col-actor">
                                                <div className="actor-cell">
                                                    <div className="actor-avatar">
                                                        {log.user_detail?.full_name ? log.user_detail.full_name[0] : 'S'}
                                                    </div>
                                                    <div className="actor-info">
                                                        <span className="name">{log.user_detail?.full_name || 'System'}</span>
                                                        <span className="role">{log.user_role || 'System Process'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-vector">
                                                <div className="vector-cell">
                                                    <div className="vector-icon">
                                                        {getActionIcon(log.action_type)}
                                                    </div>
                                                    <div className="vector-info">
                                                        <span className="type">{log.action_type_display}</span>
                                                        <span className="module">{log.module_display}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-description">
                                                <p className="desc-text" title={log.description}>
                                                    {log.description}
                                                </p>
                                            </td>
                                            <td className="col-status">
                                                <span className={`status-tag ${getStatusStyle(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="col-ops text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="op-btn-eye"
                                                    title="Inspect Transaction"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="empty-state">
                                            <div className="empty-content">
                                                <Search size={48} />
                                                <p>No results found in current matrix</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <footer className="ot-table-footer">
                        <div className="pagination-info">
                            Showing <span>{logs.length}</span> of <span>{totalCount}</span> entries
                        </div>
                        <div className="pagination-controls">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-btn"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="p-numbers">
                                {page > 2 && (
                                    <>
                                        <button onClick={() => setPage(1)} className="p-number">1</button>
                                        {page > 3 && <span className="p-dots">...</span>}
                                    </>
                                )}
                                {[page - 1, page, page + 1].filter(p => p > 0 && p <= totalPages).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`p-number ${p === page ? 'active' : ''}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                {page < totalPages - 1 && (
                                    <>
                                        {page < totalPages - 2 && <span className="p-dots">...</span>}
                                        <button onClick={() => setPage(totalPages)} className="p-number">{totalPages}</button>
                                    </>
                                )}
                            </div>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-btn"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Log Detail Inspector Modal */}
            {selectedLog && (
                <div className="ot-modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="ot-modal-container glass-effect" onClick={(e) => e.stopPropagation()}>
                        <header className="ot-modal-header">
                            <div className="modal-title">
                                <div className="title-icon">
                                    <Fingerprint size={24} />
                                </div>
                                <div className="title-text">
                                    <h2>Audit Inspection</h2>
                                    <p className="transaction-id">{selectedLog.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="ot-modal-close">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="ot-modal-body custom-scrollbar">
                            <div className="inspector-grid">
                                <div className="inspector-card">
                                    <label>Vector Origin</label>
                                    <div className="actor-preview">
                                        <div className="avatar">
                                            <User size={20} />
                                        </div>
                                        <div className="details">
                                            <p className="name">{selectedLog.user_detail?.full_name || 'System'}</p>
                                            <p className="ip">{selectedLog.ip_address || 'Internal Protocol'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="inspector-card">
                                    <label>Transaction Pulse</label>
                                    <div className="status-preview">
                                        <div className={`status-icon ${getStatusStyle(selectedLog.status)}`}>
                                            <Activity size={20} />
                                        </div>
                                        <div className="details">
                                            <p className="type">{selectedLog.action_type_display} Protocol</p>
                                            <p className="status">{selectedLog.status}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="inspector-card full">
                                    <label>Event Signature</label>
                                    <p className="description-text">{selectedLog.description}</p>
                                </div>

                                <div className="inspector-card full data-delta">
                                    <div className="delta-header">
                                        <div className="title">
                                            <BarChart3 size={18} />
                                            <h3>Data Delta Comparison</h3>
                                        </div>
                                        <div className="legend">
                                            <span className="tag removed">REMOVED</span>
                                            <span className="tag appended">APPENDED</span>
                                        </div>
                                    </div>

                                    <div className="delta-grid">
                                        <div className="delta-box pre">
                                            <span className="box-label">PRE-TRANSACTION</span>
                                            <pre className="custom-scrollbar">
                                                {JSON.stringify(selectedLog.old_value || { notice: "No pre-existing state found" }, null, 2)}
                                            </pre>
                                        </div>
                                        <div className="delta-box post">
                                            <span className="box-label">POST-TRANSACTION</span>
                                            <pre className="custom-scrollbar">
                                                {JSON.stringify(selectedLog.new_value || { notice: "Data wiped or final state immutable" }, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="ot-modal-footer">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="ot-btn ot-btn-secondary"
                            >
                                Close Inspector
                            </button>
                            <button className="ot-btn ot-btn-primary">
                                <FileJson size={18} />
                                <span>Download Raw JSON</span>
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
