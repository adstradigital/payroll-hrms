'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, Eye, Users,
    X, Building2, DollarSign, CheckCircle,
    Clock, FolderOpen, LayoutGrid, List, AlertCircle
} from 'lucide-react';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/api/api_clientadmin';
import './Departments.css';

// --- MOCK API & DATA (Augmenting real API) ---
const MOCK_STATS = {
    budget: '1,200,000',
    budget_used: '850,000',
    head: 'Not Assigned',
    projects: [
        { id: 1, name: 'Internal Audit', status: 'In Progress', progress: 65, due: '2023-12-01' },
        { id: 2, name: 'System Upgrade', status: 'Review', progress: 90, due: '2023-10-15' },
    ],
    employees: [
        { id: 101, full_name: 'John Doe', designation: 'Senior Staff', status: 'active' },
        { id: 102, full_name: 'Sarah Smith', designation: 'Junior Staff', status: 'on_leave' },
    ]
};

// Helper: Merge API data with mock stats
const mergeWithMockData = (dept) => ({
    ...dept,
    budget: dept.budget || (Math.floor(Math.random() * 500) + 500) + ',000',
    budget_used: dept.budget_used || (Math.floor(Math.random() * 400)) + ',000',
    head: dept.head_name || 'Unassigned',
    employee_count: dept.employee_count || Math.floor(Math.random() * 20),
    projects: dept.projects || MOCK_STATS.projects,
    employees: dept.employees || MOCK_STATS.employees
});

// --- COMPONENTS ---

// 1. Department Profile (Detail View)
const DepartmentProfile = ({ department, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!department) return null;

    const budgetTotal = parseInt(department.budget.replace(/,/g, ''));
    const budgetUsed = parseInt(department.budget_used?.replace(/,/g, '') || '0');
    const budgetPercent = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-title-wrapper">
                        <div className="header-icon-box">
                            <Building2 size={24} />
                        </div>
                        <div className="header-info">
                            <div className="flex items-center gap-2">
                                <h2>{department.name}</h2>
                                <span className="dept-code">{department.code}</span>
                            </div>
                            <p>{department.description || 'No description provided.'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onEdit(department)} className="action-btn" title="Edit">
                            <Edit2 size={20} />
                        </button>
                        <button onClick={onClose} className="action-btn" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    {['overview', 'team', 'projects'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body">
                    {activeTab === 'overview' && (
                        <div className="profile-grid animate-fade-in">
                            <div className="space-y-6">
                                <div className="stat-box">
                                    <h4 className="stat-label">Head of Department</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="head-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                            {department.head?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{department.head}</p>
                                            <p className="text-sm text-secondary">Department Lead</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="stat-box">
                                        <div className="stat-label"><Users size={14} /> Total Staff</div>
                                        <p className="stat-value">{department.employee_count}</p>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-label"><CheckCircle size={14} /> Status</div>
                                        <p className="stat-value" style={{ color: department.is_active ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                            {department.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="budget-card">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-white/60 text-sm font-medium">Annual Budget</p>
                                        <h3 className="text-3xl font-bold mt-1">${department.budget}</h3>
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-lg"><DollarSign size={24} className="text-emerald-400" /></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-white/80">
                                        <span>Utilized: ${department.budget_used || '0'}</span>
                                        <span>{budgetPercent}%</span>
                                    </div>
                                    <div className="budget-progress">
                                        <div className={`budget-bar ${budgetPercent > 90 ? 'warning' : ''}`} style={{ width: `${budgetPercent}%` }}></div>
                                    </div>
                                    <p className="text-xs text-white/60 mt-2">
                                        {budgetPercent > 90 ? 'Warning: Budget approachable' : 'Budget status is healthy'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="animate-fade-in">
                            {department.employees && department.employees.length > 0 ? (
                                <div className="dept-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                    {department.employees.map(emp => (
                                        <div key={emp.id} className="stat-box flex items-center gap-3">
                                            <div className="head-avatar">{emp.full_name.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-sm">{emp.full_name}</p>
                                                <p className="text-xs text-secondary">{emp.designation}</p>
                                            </div>
                                            <div className="ml-auto w-2 h-2 rounded-full" style={{ background: emp.status === 'active' ? 'var(--color-success)' : 'var(--text-muted)' }}></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted border border-dashed border-color rounded-xl">
                                    <Users className="mx-auto mb-2 opacity-50" size={32} />
                                    <p>No employees found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="animate-fade-in">
                            {department.projects && department.projects.length > 0 ? (
                                <div className="space-y-3">
                                    {department.projects.map(proj => (
                                        <div key={proj.id} className="card p-4">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-bold">{proj.name}</h4>
                                                <span className="badge badge-warning">{proj.status}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-primary)' }}>
                                                <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, background: 'var(--brand-primary)' }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-secondary">
                                                <span>{proj.progress}%</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {proj.due}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted border border-dashed border-color rounded-xl">
                                    <FolderOpen className="mx-auto mb-2 opacity-50" size={32} />
                                    <p>No active projects.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Department Form Component
const DepartmentForm = ({ department, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true,
        budget: '',
        head: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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
            const payload = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                is_active: formData.is_active
            };
            let response;
            if (department) {
                response = await updateDepartment(department.id, payload);
            } else {
                response = await createDepartment(payload);
            }
            onSuccess({ ...response.data, budget: formData.budget, head: formData.head }, !!department);
        } catch (error) {
            console.error("Failed to save department", error);
            // In a real app, use toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="header-title-wrapper">
                        <div className="header-icon-box" style={{ width: '40px', height: '40px' }}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{department ? 'Edit Department' : 'New Department'}</h3>
                            <p className="text-xs text-secondary">Define structure and responsibilities</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="action-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form-container">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Dept Name</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="form-input" placeholder="e.g. Engineering" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dept Code</label>
                            <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                                className="form-input" placeholder="e.g. ENG" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="form-textarea" placeholder="Brief description of responsibilities..."
                        />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Annual Budget ($)</label>
                            <input type="text" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                className="form-input" placeholder="Optional (Demo)" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department Head</label>
                            <input type="text" value={formData.head} onChange={e => setFormData({ ...formData, head: e.target.value })}
                                className="form-input" placeholder="Optional (Demo)" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-color cursor-pointer hover:bg-primary transition-colors">
                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }} />
                            <span className="text-sm font-medium">Active Department</span>
                        </label>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '16px', borderTop: 'none', padding: 0 }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ color: '#000' }}>
                            {loading ? 'Saving...' : 'Save Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 3. Main Department Component
export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [viewDetail, setViewDetail] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await getAllDepartments();
            if (res.data) {
                const augmentedData = res.data.map(mergeWithMockData);
                setDepartments(augmentedData);
            } else {
                setDepartments([]);
            }
        } catch (error) {
            console.error("Error fetching departments", error);
            // Keep empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (data, isEdit) => {
        const augmented = mergeWithMockData(data);
        if (isEdit) {
            setDepartments(prev => prev.map(d => d.id === data.id ? augmented : d));
        } else {
            setDepartments(prev => [...prev, augmented]);
        }
        setShowForm(false);
        setSelectedDept(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await deleteDepartment(id);
                setDepartments(prev => prev.filter(d => d.id !== id));
            } catch (error) {
                console.error("Error deleting department", error);
            }
        }
    }

    const filteredDepts = departments.filter(d =>
        (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="departments-container">
            {/* Header / Toolbar */}
            <div className="departments-header">
                <div className="header-title-wrapper">
                    <div className="header-icon-box">
                        <Building2 size={24} />
                    </div>
                    <div className="header-info">
                        <h2>Departments</h2>
                        <p>Manage organizational structure and budgets</p>
                    </div>
                </div>

                <div className="departments-toolbar">
                    <div className="view-toggle">
                        <button onClick={() => setViewMode('list')} className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} title="List View">
                            <List size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} title="Grid View">
                            <LayoutGrid size={20} />
                        </button>
                    </div>

                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <input type="text" placeholder="Search departments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                    </div>

                    <button onClick={() => { setSelectedDept(null); setShowForm(true); }} className="btn-add-dept" style={{ color: '#000' }}>
                        <Plus size={20} /> <span>Add Dept</span>
                    </button>
                </div>
            </div>

            {/* Content Loading State */}
            {loading ? (
                <div className="state-container">
                    <div className="spinner"></div>
                    <h3>Loading Departments...</h3>
                    <p>Please wait while we fetch the latest data.</p>
                </div>
            ) : filteredDepts.length === 0 ? (
                /* Empty State */
                <div className="state-container">
                    <Building2 className="empty-icon" />
                    <h3>No Departments Found</h3>
                    <p>There are no departments matching your search or no departments created yet.</p>
                    <button onClick={() => { setSelectedDept(null); setShowForm(true); }} className="btn-add-dept mt-md" style={{ marginTop: '16px', color: '#000' }}>
                        <Plus size={18} /> <span>Create First Department</span>
                    </button>
                </div>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="dept-list-container animate-fade-in">
                    <table className="dept-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Head of Dept</th>
                                <th>Staff</th>
                                <th>Budget Usage</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDepts.map(dept => {
                                const budgetTotal = parseInt((dept.budget || '0').toString().replace(/,/g, ''));
                                const budgetUsed = parseInt((dept.budget_used || '0').toString().replace(/,/g, '') || '0');
                                const budgetPercent = budgetTotal ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100)) : 0;

                                return (
                                    <tr key={dept.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="head-avatar" style={{ width: '36px', height: '36px' }}>
                                                    {dept.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-primary">{dept.name}</div>
                                                    <div className="text-xs text-muted font-mono">{dept.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><div className="text-sm font-medium">{dept.head}</div></td>
                                        <td><div className="flex items-center gap-1.5 text-sm text-secondary"><Users size={14} /> {dept.employee_count}</div></td>
                                        <td style={{ width: '200px' }}>
                                            <div className="flex justify-between text-xs mb-1 text-muted">
                                                <span>{budgetPercent}%</span>
                                                <span>${dept.budget}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ width: `${budgetPercent}%`, height: '100%', background: budgetPercent > 90 ? 'var(--color-danger)' : 'var(--color-success)', borderRadius: '99px' }}></div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${dept.is_active ? 'badge-success' : 'badge-warning'}`}>
                                                {dept.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setViewDetail(dept.id)} className="action-btn"><Eye size={18} /></button>
                                                <button onClick={() => { setSelectedDept(dept); setShowForm(true); }} className="action-btn"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(dept.id)} className="action-btn delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Grid View */
                <div className="dept-grid animate-fade-in">
                    {filteredDepts.map(dept => (
                        <div key={dept.id} className="dept-card">
                            <div className={`dept-card-status ${dept.is_active ? 'active' : ''}`}></div>
                            <div className="card-header">
                                <div className="card-title">
                                    <h3>{dept.name}</h3>
                                    <span className="dept-code">{dept.code}</span>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => { setViewDetail(dept.id); }} className="action-btn"><Eye size={18} /></button>
                                    <button onClick={() => { setSelectedDept(dept); setShowForm(true); }} className="action-btn"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(dept.id)} className="action-btn delete"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <p className="dept-desc">{dept.description || 'No description available.'}</p>
                            <div className="card-stats">
                                <div className="stat-box">
                                    <div className="stat-label"><Users size={12} /> Employees</div>
                                    <span className="stat-value">{dept.employee_count}</span>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label"><DollarSign size={12} /> Budget</div>
                                    <span className="stat-value">${parseInt((dept.budget || '0').replace(/,/g, '')).toLocaleString().slice(0, 4)}k</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <div className="head-info">
                                    <div className="head-avatar">{dept.head?.charAt(0) || '?'}</div>
                                    <span className="head-name">Head: <strong>{dept.head}</strong></span>
                                </div>
                                <span onClick={() => setViewDetail(dept.id)} className="btn-view-details">View Details</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showForm && (
                <DepartmentForm
                    department={selectedDept}
                    onClose={() => { setShowForm(false); setSelectedDept(null); }}
                    onSuccess={handleSuccess}
                />
            )}

            {viewDetail && (
                <DepartmentProfile
                    department={departments.find(d => d.id === viewDetail)}
                    onClose={() => setViewDetail(null)}
                    onEdit={(dept) => { setViewDetail(null); setSelectedDept(dept); setShowForm(true); }}
                />
            )}
        </div>
    );
}
