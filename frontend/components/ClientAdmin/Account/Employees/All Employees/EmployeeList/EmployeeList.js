'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Plus, User,
    Mail, Calendar, Eye, Edit2, Trash2,
    Users, List, LayoutGrid, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllEmployees, getAllDepartments } from '@/api/api_clientadmin';
import './EmployeeList.css';

export default function EmployeeList({ onAdd, onEdit, onView, refreshTrigger }) {
    const router = useRouter(); // Keeping router for now, but primary action is onView from props
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, [currentPage, filterDept, statusFilter, refreshTrigger]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                search: searchTerm,
                department: filterDept !== 'All' ? filterDept : undefined,
                status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined
            };
            const res = await getAllEmployees(params);
            setEmployees(res.data.results);
            setPagination({
                count: res.data.count,
                next: res.data.next,
                previous: res.data.previous
            });
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await getAllDepartments();
            setDepartments(res.data.results || res.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchEmployees();
    };

    return (
        <div className="employee-list-container animate-fade-in">
            {/* Toolbar */}
            <div className="employee-toolbar">
                <form className="toolbar-search" onSubmit={handleSearch}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                <div className="toolbar-actions">

                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <div className="filter-select">
                        <Users size={16} />
                        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="All">All Depts</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-select">
                        <Filter size={16} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>

                    <button className="btn-add" onClick={onAdd}>
                        <Plus size={18} /> Add Employee
                    </button>

                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>ID & Joined</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="skeleton-row">
                                        <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center' }}>Loading...</td>
                                    </tr>
                                ))
                            ) : employees.length > 0 ? (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hoverable-row">
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-sm">
                                                    {emp.full_name ? emp.full_name.charAt(0) : 'U'}
                                                </div>
                                                <div className="user-details">
                                                    <div className="user-name">
                                                        {emp.full_name}
                                                        {emp.has_user_account && <Shield size={12} className="text-violet-500" />}
                                                    </div>
                                                    <div className="user-email">
                                                        <Mail size={12} /> {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="id-cell">
                                                <span className="emp-id">{emp.employee_id}</span>
                                                <span className="emp-date">
                                                    <Calendar size={10} /> {emp.date_of_joining}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{emp.designation?.name || emp.designation}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{emp.department?.name || emp.department}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.status === 'active' ? 'badge-success' :
                                                emp.status === 'on_leave' ? 'badge-warning' :
                                                    'badge-danger'
                                                }`}>
                                                <span className={`status-dot ${emp.status === 'active' ? 'status-dot--active' :
                                                    emp.status === 'on_leave' ? 'status-dot--warning' :
                                                        'status-dot--inactive'
                                                    }`}></span>
                                                {emp.status ? emp.status.replace('_', ' ') : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn" onClick={() => onView && onView(emp.id)} title="View Profile">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn" onClick={() => onEdit(emp.id)} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="action-btn action-btn--danger" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <User size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                            <p style={{ fontWeight: 500 }}>No employees found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="employee-grid animate-fade-in">
                    {employees.map(emp => (
                        <div key={emp.id} className="employee-card-grid">

                            <div className={`status-dot-grid ${emp.status ? emp.status.toLowerCase() : ''}`} title={emp.status}></div>

                            <div className="avatar-grid">
                                {emp.full_name ? emp.full_name.charAt(0) : 'U'}
                            </div>

                            <h3 className="card-name">
                                {emp.full_name}
                                {emp.has_user_account && <Shield size={14} style={{ color: '#7c3aed' }} />}
                            </h3>
                            <p className="card-designation">{emp.designation?.name || emp.designation}</p>

                            <div className="grid-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Dept</span>
                                    <span className="stat-value">{emp.department?.name || emp.department}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">ID</span>
                                    <span className="stat-value">{emp.employee_id}</span>
                                </div>
                            </div>

                            <div className="grid-actions">
                                <button onClick={() => onView && onView(emp.id)} className="btn-grid-profile">Profile</button>
                                <button onClick={() => onEdit(emp.id)} className="btn-grid-edit"><Edit2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {employees.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <p>No employees found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination.count > 0 && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', background: 'var(--card-bg, #fff)', borderRadius: '1rem',
                    border: '1px solid var(--border-color, #e2e8f0)'
                }}>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Showing <b>{employees.length}</b> of <b>{pagination.count}</b> employees
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={!pagination.previous}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            style={{
                                padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'transparent',
                                cursor: pagination.previous ? 'pointer' : 'default', opacity: pagination.previous ? 1 : 0.5
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={!pagination.next}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            style={{
                                padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: 'transparent',
                                cursor: pagination.next ? 'pointer' : 'default', opacity: pagination.next ? 1 : 0.5
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
