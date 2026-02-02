'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, Download, Eye, Calendar, User,
    Activity, Shield, Database, AlertCircle, CheckCircle,
    ChevronLeft, ChevronRight, X, Info, FileJson, Clock, RotateCcw
} from 'lucide-react';
import * as activityLogApi from '@/api/activityLogApi';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'react-hot-toast';
import './Activitylog.css';

const ActivityLog = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        module: '',
        action_type: '',
        status: '',
        search: ''
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                ...filters
            };
            const data = await activityLogApi.getActivityLogs(params);
            setLogs(data.results);
            setTotalPages(Math.ceil(data.count / 20));
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

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
        setPage(1);
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return 'success';
            case 'FAILED': return 'failed';
            default: return 'info';
        }
    };

    const getActionIcon = (actionType) => {
        switch (actionType?.toUpperCase()) {
            case 'LOGIN': return <Shield size={16} />;
            case 'CREATE': return <Database size={16} />;
            case 'UPDATE': return <Activity size={16} />;
            case 'DELETE': return <AlertCircle size={16} />;
            case 'PROCESS': return <CheckCircle size={16} />;
            default: return <Info size={16} />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
        } catch (error) {
            alert('Export failed');
        }
    };

    return (
        <div className="activity-log-page">
            <div className="log-action-bar">
                <div className="log-search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        name="search"
                        placeholder="Search logs by description..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="log-header-btns">
                    <button
                        className={`log-btn log-btn--secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filters {Object.values(filters).filter(v => v !== '').length > 0 && `(${Object.values(filters).filter(v => v !== '').length})`}
                    </button>

                    <button className="log-btn log-btn--primary" onClick={handleExport}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="log-filters-panel glass-panel animate-slide-down">
                    <div className="filters-grid">
                        <div className="filter-item">
                            <label>Module</label>
                            <label>{t('audit.module')}</label>
                            <select name="module" value={filters.module} onChange={handleFilterChange}>
                                <option value="">{t('audit.allModules')}</option>
                                <option value="AUTH">{t('audit.moduleAuth')}</option>
                                <option value="EMPLOYEE">{t('audit.moduleEmployee')}</option>
                                <option value="PAYROLL">{t('audit.modulePayroll')}</option>
                                <option value="BULK_UPLOAD">{t('audit.moduleBulkUpload')}</option>
                                <option value="SYSTEM">{t('audit.moduleSystem')}</option>
                            </select>
                        </div>

                        <div className="filter-item">
                            <label>{t('audit.actionType')}</label>
                            <select name="action_type" value={filters.action_type} onChange={handleFilterChange}>
                                <option value="">{t('audit.allActions')}</option>
                                <option value="CREATE">{t('audit.actionCreate')}</option>
                                <option value="UPDATE">{t('audit.actionUpdate')}</option>
                                <option value="DELETE">{t('audit.actionDelete')}</option>
                                <option value="LOGIN">{t('audit.actionLogin')}</option>
                                <option value="PROCESS">{t('audit.actionProcess')}</option>
                            </select>
                        </div>

                        <div className="filter-item">
                            <label>{t('audit.status')}</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">{t('audit.allStatuses')}</option>
                                <option value="SUCCESS">{t('audit.statusSuccess')}</option>
                                <option value="FAILED">{t('audit.statusFailed')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="filters-footer">
                        <button className="reset-btn" onClick={resetFilters}>
                            {t('audit.resetFilters')}
                        </button>
                    </div>
                </div>
            )}

            <div className="log-card glass-panel">
                <div className="log-table-container">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>{t('audit.timestamp')}</th>
                                <th>{t('audit.user')}</th>
                                <th>{t('audit.module')}</th>
                                <th>{t('audit.action')}</th>
                                <th>{t('audit.description')}</th>
                                <th>{t('audit.status')}</th>
                                <th className="col-ops"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="log-empty">{t('audit.loadingLogs')}</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="log-empty">{t('audit.noLogsFound')}</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="activity-row">
                                        <td className="col-time">
                                            <div className="time-cell">
                                                <Clock size={14} />
                                                {formatDate(log.timestamp)}
                                            </div>
                                        </td>
                                        <td className="col-user">
                                            <div className="user-cell">
                                                <div className="avatar">
                                                    {log.user_detail?.full_name ? log.user_detail.full_name[0] : 'S'}
                                                </div>
                                                <div className="user-info">
                                                    <span className="name">{log.user_detail?.full_name || t('audit.system')}</span>
                                                    <span className="role">{log.user_role || t('audit.systemProcess')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="col-module">
                                            <span className="module-badge">{log.module_display}</span>
                                        </td>
                                        <td className="col-action">
                                            <div className="action-cell">
                                                {getActionIcon(log.action_type)}
                                                <span>{log.action_type_display}</span>
                                            </div>
                                        </td>
                                        <td className="col-desc">
                                            <p className="desc-text" title={log.description}>{log.description}</p>
                                        </td>
                                        <td className="col-status">
                                            <span className={`status-pill ${getStatusBadgeClass(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="col-ops">
                                            <button className="detail-trigger" title={t('audit.viewDetails')} onClick={() => setSelectedLog(log)}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="log-footer">
                    <div className="pagination-info">
                        {t('audit.showingResults', { count: logs.length })}
                    </div>
                    <div className="pagination-btns">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-btn"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="page-indicator">{t('audit.pageOf', { current: page, total: totalPages })}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="p-btn"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div className="log-detail-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="log-detail-modal glass-panel" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{t('audit.activityDetails')}</h2>
                                <p>{t('audit.transactionId')}: {selectedLog.id}</p>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedLog(null)}>
                                <X size={20} />
                            </button>
                        </header>
                        <div className="modal-body custom-scrollbar">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>{t('audit.timestamp')}</label>
                                    <p>{formatDate(selectedLog.timestamp)}</p>
                                </div>
                                <div className="info-item">
                                    <label>{t('audit.user')}</label>
                                    <p>{selectedLog.user_detail?.full_name || t('audit.system')}</p>
                                </div>
                                <div className="info-item">
                                    <label>{t('audit.ipAddress')}</label>
                                    <p>{selectedLog.ip_address || 'N/A'}</p>
                                </div>
                                <div className="info-item">
                                    <label>{t('audit.action')}</label>
                                    <p>{selectedLog.action_type_display}</p>
                                </div>
                                <div className="info-item">
                                    <label>{t('audit.module')}</label>
                                    <p>{selectedLog.module_display}</p>
                                </div>
                                <div className="info-item full">
                                    <label>{t('audit.description')}</label>
                                    <p className="description">{selectedLog.description}</p>
                                </div>

                                {(selectedLog.old_value || selectedLog.new_value) && (
                                    <div className="changes-section">
                                        <h3><RotateCcw size={16} /> {t('audit.dataChanges')}</h3>
                                        <div className="diff-grid">
                                            {selectedLog.old_value && (
                                                <div className="diff-panel">
                                                    <label>{t('audit.previousData')}</label>
                                                    <pre>{JSON.stringify(selectedLog.old_value, null, 2)}</pre>
                                                </div>
                                            )}
                                            {selectedLog.new_value && (
                                                <div className="diff-panel">
                                                    <label>{t('audit.newData')}</label>
                                                    <pre>{JSON.stringify(selectedLog.new_value, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <footer className="modal-footer">
                            <button className="log-btn log-btn--secondary" onClick={() => setSelectedLog(null)}>Close</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
