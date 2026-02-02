'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, LayoutGrid, List, MoreVertical, Building2, Users, DollarSign, Activity, Edit2, Trash2, ChevronRight, Mail, Phone, MapPin, Download, X, Briefcase, FolderOpen, Eye } from 'lucide-react';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getAllEmployees
} from '@/api/api_clientadmin';
import './Departments.css';

// --- MOCK API & DATA (Augmenting real API) ---
// Since the backend might not have 'projects' or detailed 'budget' fields yet, 
// we augment real API data with some mock stats for visual completeness until backend catches up.
const MOCK_STATS_DEFAULTS = {
    budget: '0',
    budget_used: '0',
    head_name: 'Unassigned',
    projects: [
        { id: 1, name: 'Internal Audit', status: 'In Progress', progress: 65, due: '2023-12-01' },
    ]
};

const mergeWithMockData = (dept) => ({
    ...dept,
    name: dept.name || 'Unnamed Dept',
    head_name: dept.head_name || 'Unassigned',
    employee_count: dept.employee_count || 0,
    // Use API data if available, else Fallback
    projects: dept.projects || MOCK_STATS_DEFAULTS.projects,
    budget: dept.budget || Math.floor(Math.random() * 500000) + 100000,
    budget_used: dept.budget_used || Math.floor(Math.random() * 90000)
});

// --- SUB-COMPONENT: Department Profile (Modal) ---
const DepartmentProfile = ({ department, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!department) return null;

    const safeBudget = (department.budget || '0').toString();
    const budgetTotal = parseInt(safeBudget.replace(/,/g, ''));
    const budgetUsed = parseInt((department.budget_used || '0').toString().replace(/,/g, '') || '0');
    const budgetPercent = budgetTotal > 0 ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100)) : 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                {/* Header */}
                <div className="modal-header">
                    <div className="profile-header">
                        <div className="profile-avatar"
                            style={{ background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-secondary)' }}>
                            {department.name.charAt(0)}
                        </div>
                        <div className="profile-info">
                            <h2 className="profile-title" style={{ color: 'var(--text-primary)' }}>{department.name}</h2>
                            <div className="profile-badges">
                                <span className="dept-code" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                    {department.code}
                                </span>
                                <span className={`badge badge-base ${department.is_active ? 'badge-success' : 'badge-warning'}`}>
                                    {department.is_active ? 'ACTIVE' : 'ARCHIVED'}
                                </span>
                            </div>
                        </div>
                        <div className="profile-actions">
                            <button onClick={() => onEdit(department)} className="profile-btn-edit">Edit</button>
                            <button onClick={onClose} className="profile-btn-close" title="Close"><X size={24} /></button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    {['overview', 'personnel', 'projects'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="modal-body">
                    {activeTab === 'overview' && (
                        <div>
                            <div className="profile-desc-box" style={{ borderColor: 'var(--brand-primary)' }}>
                                <p className="profile-desc-text" style={{ color: 'var(--text-secondary)' }}>
                                    "{department.description || 'Strategic oversight and corporate governance.'}"
                                </p>
                            </div>

                            <div className="profile-grid-layout">
                                <div className="dash-card">
                                    <h4 className="dash-label">Fiscal Budget</h4>
                                    <div className="metric-box" style={{ border: 'none', padding: '0.5rem 0', background: 'transparent' }}>
                                        <div className="flex items-end gap-2">
                                            <span className="metric-value-lg" style={{ color: 'var(--text-primary)' }}>${Number(budgetTotal).toLocaleString()}</span>
                                            <span className="metric-sub">allocated</span>
                                        </div>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-bar" style={{ width: `${budgetPercent}%` }}></div>
                                    </div>
                                    <div className="utilization-text">
                                        <span>Used: ${Number(budgetUsed).toLocaleString()}</span>
                                        <span style={{ color: budgetPercent > 90 ? 'var(--color-danger)' : 'var(--color-success)' }}>{budgetPercent}% Utilized</span>
                                    </div>
                                </div>

                                {/* Leadership Card */}
                                <div className="dash-card">
                                    <h4 className="dash-label">Leadership</h4>
                                    <div className="head-info mt-4" style={{ gap: '1rem' }}>
                                        <div className="head-avatar" style={{ width: '3rem', height: '3rem', fontSize: '1.2rem', background: 'var(--bg-secondary)', color: 'var(--brand-primary)', border: '1px solid var(--border-color)' }}>
                                            {department.head_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{department.head_name || 'Unassigned'}</div>
                                            <div className="text-xs text-secondary">Department Head</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'personnel' && (
                        <div className="personnel-grid">
                            {department.employees?.length > 0 ? department.employees.map(emp => (
                                <div key={emp.id} className="personnel-card" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="personnel-avatar" style={{ background: 'var(--bg-primary)' }}>
                                        {emp.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="personnel-name">{emp.full_name}</div>
                                        <div className="personnel-role">{emp.designation}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="personnel-empty">No personnel records found.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="project-list">
                            {department.projects?.map(proj => (
                                <div key={proj.id} className="project-card" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--brand-primary)' }}>
                                    <div className="project-header">
                                        <h4 className="project-title">{proj.name}</h4>
                                        <span className="badge badge-warning">{proj.status}</span>
                                    </div>
                                    <div className="project-meta">
                                        <span>Due: {proj.due}</span>
                                        <span>Progress: {proj.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

// --- SUB-COMPONENT: Department Form ---
const DepartmentForm = ({ department, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', code: '', description: '', is_active: true, budget: '', head: ''
    });
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        // Fetch active employees for Head selection
        // Fetch active employees for Head selection
        console.log("Fetching employees with status=active...");
        getAllEmployees({ status: 'active' }).then(res => {
            console.log("API Reference Response:", res);
            const empList = res.data.results || res.data || [];
            console.log("Parsed Employee List:", empList);
            setEmployees(empList);
        }).catch(err => {
            console.error("Failed to fetch employees:", err);
        });

        if (department) {
            setFormData({
                name: department.name,
                code: department.code,
                description: department.description || '',
                is_active: department.is_active,
                budget: department.budget || '',
                head: department.head || ''
            });
        }
    }, [department]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Ensure empty strings are sent as null
            const payload = {
                ...formData,
                budget: formData.budget === '' ? null : formData.budget,
                head: formData.head === '' ? null : formData.head
            };
            console.log("Saving Department Payload:", payload);
            let res;
            if (department) {
                res = await updateDepartment(department.id, payload);
            } else {
                res = await createDepartment(payload);
            }

            if (res.data) onSuccess({ ...formData, ...res.data }, !!department);
        } catch (error) {
            console.error("Failed to save department", error);
            if (error.response && error.response.data) {
                console.error("Server Error Details:", error.response.data);
                alert(`Operation failed: ${JSON.stringify(error.response.data)}`);
            } else {
                alert("Operation failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{department ? 'Edit Profile' : 'New Department'}</h3>
                    <button onClick={onClose} className="action-btn"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid-layout">
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Finance" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input type="text" className="form-input" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. FIN" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Budget Allocation ($)</label>
                            <input type="number" className="form-input" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Head of Dept</label>
                            <select className="form-select" value={formData.head} onChange={e => setFormData({ ...formData, head: e.target.value })}>
                                <option value="" style={{ color: '#000', backgroundColor: '#fff' }}>Unassigned</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id} style={{ color: '#000', backgroundColor: '#fff' }}>
                                        {e.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-checkbox-wrapper">
                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                            <span className="checkbox-label-text">Department is operational</span>
                        </label>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

// --- MAIN COMPONENT ---
export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('name'); // name, budget, staff

    // Modal States
    const [selectedDept, setSelectedDept] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewDetailId, setViewDetailId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getAllDepartments();
            const raw = res.data.results || res.data || [];
            if (Array.isArray(raw)) setDepartments(raw.map(mergeWithMockData));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Computed Stats for Dashboard ---
    const stats = useMemo(() => {
        return departments.reduce((acc, curr) => {
            acc.totalBudget += Number(curr.budget || 0);
            acc.totalStaff += Number(curr.employee_count || 0);
            acc.totalProjects += (curr.projects?.length || 0);
            if (curr.is_active) acc.activeCount++;
            return acc;
        }, { totalBudget: 0, totalStaff: 0, activeCount: 0, totalProjects: 0 });
    }, [departments]);

    // --- Filtering & Sorting ---
    const filteredAndSortedDepts = useMemo(() => {
        let result = departments.filter(d =>
            (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.code || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        return result.sort((a, b) => {
            if (sortBy === 'budget') return (Number(b.budget) - Number(a.budget));
            if (sortBy === 'staff') return (b.employee_count - a.employee_count);
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [departments, searchTerm, sortBy]);

    // --- Features ---
    const handleExportCSV = () => {
        const headers = ["ID,Name,Code,Head,Staff,Budget,Status"];
        const rows = filteredAndSortedDepts.map(d =>
            `${d.id},"${d.name}","${d.code}","${d.head_name}",${d.employee_count},${d.budget},${d.is_active ? 'Active' : 'Inactive'}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "corporate_departments.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (id) => {
        if (confirm("Confirm deletion of this department? This action cannot be undone.")) {
            try {
                await deleteDepartment(id);
                setDepartments(prev => prev.filter(d => d.id !== id));
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleSuccess = (data, isEdit) => {
        const newData = mergeWithMockData(data);
        setDepartments(prev => isEdit ? prev.map(d => d.id === data.id ? newData : d) : [...prev, newData]);
        setIsFormOpen(false);
        setSelectedDept(null);
    };

    return (
        <div className="departments-container">
            {/* 1. TOP HEADER & DASHBOARD */}
            <div className="header-spacer animate-fade-in">
                <div className="departments-header" style={{ border: 'none', padding: 0, margin: 0 }}>
                    <div className="header-title">
                        <h1>Corporate <span className="text-brand-gradient">Structure</span></h1>
                        <p className="header-subtitle">Manage organizational hierarchy, budgets, and leadership assignments.</p>
                    </div>
                </div>

                <div className="dept-dashboard-grid grid-spacer">
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div>
                                <div className="dash-label">Total Allocation</div>
                                <div className="dash-value">${(stats.totalBudget / 1000000).toFixed(1)}M</div>
                            </div>
                            <div className="dash-icon-box"><DollarSign /></div>
                        </div>
                    </div>
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div>
                                <div className="dash-label">Total Personnel</div>
                                <div className="dash-value">{stats.totalStaff}</div>
                            </div>
                            <div className="dash-icon-box"><Users /></div>
                        </div>
                    </div>
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div>
                                <div className="dash-label">Active Units</div>
                                <div className="dash-value">{stats.activeCount} <span className="dash-active-detail">/ {departments.length}</span></div>
                            </div>
                            <div className="dash-icon-box"><Activity /></div>
                        </div>
                    </div>
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <div>
                                <div className="dash-label">Total Projects</div>
                                <div className="dash-value">{stats.totalProjects}</div>
                            </div>
                            <div className="dash-icon-box"><Briefcase /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TOOLBAR */}
            <div className="departments-header">
                <div className="search-wrapper">
                    <Search className="text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Search division..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="departments-toolbar">
                    {/* Sort Dropdown */}
                    <div className="sort-wrapper">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="name">Sort: Name</option>
                            <option value="budget">Sort: Budget (High)</option>
                            <option value="staff">Sort: Staff Size</option>
                        </select>
                        <Filter className="sort-icon" size={14} />
                    </div>

                    <button onClick={handleExportCSV} className="btn-outline" title="Export CSV">
                        <Download size={18} />
                    </button>

                    <div className="toggle-group">
                        <button onClick={() => setViewMode('list')} className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}>
                            <List size={18} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}>
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <button onClick={() => { setSelectedDept(null); setIsFormOpen(true); }} className="btn-primary-action">
                        <Plus size={18} /> <span>New Unit</span>
                    </button>
                </div>
            </div>

            {/* 3. CONTENT AREA */}
            {/* 3. CONTENT AREA */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner loading-spinner" style={{ borderColor: 'var(--brand-primary)', borderRightColor: 'transparent' }}></div>
                    <p className="text-brand-gradient pulse-text">Retrieving secure data...</p>
                </div>
            ) : filteredAndSortedDepts.length === 0 ? (
                <div className="empty-state-container" style={{ borderColor: 'var(--border-color)' }}>
                    <FolderOpen className="empty-icon" size={48} />
                    <h3 className="empty-text">No departments found</h3>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="dept-grid animate-fade-in">
                    {filteredAndSortedDepts.map(dept => (
                        <div key={dept.id} className="dept-card group">
                            <div className={`dept-card-status ${dept.is_active ? 'active' : ''}`}></div>

                            <div className="dash-card-header mb-4">
                                <div>
                                    <h3 className="card-title-text">{dept.name}</h3>
                                    <span className="dept-code">{dept.code}</span>
                                </div>
                                <button onClick={() => setViewDetailId(dept.id)} className="action-btn">
                                    <Activity size={18} />
                                </button>
                            </div>

                            <p className="card-desc">
                                {dept.description || 'No description available.'}
                            </p>

                            <div className="card-metrics">
                                <div className="metric-box">
                                    <div className="metric-label">Budget</div>
                                    <div className="metric-value text-brand-gradient">${(dept.budget / 1000).toFixed(0)}k</div>
                                </div>
                                <div className="metric-box">
                                    <div className="metric-label">Team</div>
                                    <div className="metric-value">{dept.employee_count}</div>
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="head-info">
                                    <div className="head-avatar">
                                        {dept.head_name?.charAt(0) || '?'}
                                    </div>
                                    <span className="head-name">{dept.head_name}</span>
                                </div>
                                <div className="card-actions-hover">
                                    <button onClick={() => { setSelectedDept(dept); setIsFormOpen(true); }} className="action-btn"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(dept.id)} className="action-btn delete"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="animate-fade-in overflow-x-auto">
                    <table className="dept-table">
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th>Allocation</th>
                                <th>Head of Dept</th>
                                <th>Personnel</th>
                                <th>Status</th>
                                <th className="table-header-action">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedDepts.map(dept => (
                                <tr key={dept.id}>
                                    <td>
                                        <div className="table-text-bold">{dept.name}</div>
                                        <div className="table-text-code">{dept.code}</div>
                                    </td>
                                    <td className="table-money">${Number(dept.budget).toLocaleString()}</td>
                                    <td>
                                        <div className="table-text-sub">{dept.head_name}</div>
                                    </td>
                                    <td>
                                        <div className="table-progress-wrapper">
                                            <div className="table-progress-track">
                                                <div className="table-progress-fill" style={{ width: `${Math.min(dept.employee_count * 5, 100)}%` }}></div>
                                            </div>
                                            <span className="table-count-text">{dept.employee_count}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${dept.is_active ? 'badge-success' : 'badge-warning'}`}>
                                            {dept.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="table-cell-action">
                                        <div className="table-actions-wrapper">
                                            <button onClick={() => setViewDetailId(dept.id)} className="action-btn"><Eye size={18} /></button>
                                            <button onClick={() => { setSelectedDept(dept); setIsFormOpen(true); }} className="action-btn"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(dept.id)} className="action-btn delete"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODALS */}
            {isFormOpen && (
                <DepartmentForm
                    department={selectedDept}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}

            {viewDetailId && (
                <DepartmentProfile
                    department={departments.find(d => d.id === viewDetailId)}
                    onClose={() => setViewDetailId(null)}
                    onEdit={(d) => { setViewDetailId(null); setSelectedDept(d); setIsFormOpen(true); }}
                />
            )}
        </div>
    );
}

