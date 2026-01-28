'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Plus, User,
    Mail, Calendar, Eye, Edit2, Trash2,
    Users, List, LayoutGrid, Shield, ChevronLeft, ChevronRight,
    Download, TrendingUp, UserCheck, UserX, ArrowUpDown, Briefcase
} from 'lucide-react';
import { getAllEmployees, getAllDepartments } from '@/api/api_clientadmin';
import './EmployeeList.css';

// --- Stat Card Component ---
const StatCard = ({ icon: Icon, label, value, colorClass, trend }) => (
    <div className="emplist-stat-card">
        <div>
            <p className="emplist-stat-label">{label}</p>
            <h3 className="emplist-stat-value">{value}</h3>
            {trend && (
                <span className="emplist-stat-trend">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div className={`emplist-stat-icon ${colorClass}`}>
            <Icon size={24} />
        </div>
    </div>
);

export default function EmployeeList({ onAdd, onEdit, onView, refreshTrigger }) {
    // --- State ---
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Pagination & View
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('table');

    // Selection & Sorting
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // --- Effects ---
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, [currentPage, filterDept, statusFilter, refreshTrigger]);

    // --- API Calls ---
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

    // --- Handlers ---
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchEmployees();
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sorted = [...employees].sort((a, b) => {
            const aVal = a[key] || '';
            const bVal = b[key] || '';
            if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setEmployees(sorted);
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === employees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(employees.map(e => e.id));
        }
    };

    const handleExport = () => {
        const headers = ["Name", "ID", "Email", "Department", "Role", "Status"];
        const rows = employees.map(e => [
            e.full_name,
            e.employee_id,
            e.email,
            e.department?.name || e.department,
            e.designation?.name || e.designation,
            e.status
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(row => row.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "employees_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Helpers ---
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.match(/(\b\S)?/g).join("").match(/(^\S|\S$)?/g).join("").toUpperCase();
    };

    const getAvatarColor = (id) => {
        const colors = ['emplist-avatar--indigo', 'emplist-avatar--purple', 'emplist-avatar--pink', 'emplist-avatar--emerald', 'emplist-avatar--orange', 'emplist-avatar--blue'];
        return colors[(id || 0) % colors.length];
    };

    const getDeptName = (emp) => emp.department?.name || (typeof emp.department === 'string' ? emp.department : 'N/A');
    const getDesignation = (emp) => emp.designation?.name || (typeof emp.designation === 'string' ? emp.designation : 'N/A');

    // --- Render ---
    return (
        <div className="emplist-container emplist-animate-fade-in">
            {/* ========== Header Section ========== */}
            <div className="emplist-header">
                <div className="emplist-header-row">
                    <div>
                        <h1 className="emplist-title">Employee Directory</h1>
                        <p className="emplist-subtitle">Manage your team members and their account permissions.</p>
                    </div>
                    <div className="emplist-header-actions">
                        <button onClick={handleExport} className="emplist-btn emplist-btn-secondary">
                            <Download size={16} /> Export
                        </button>
                        <button onClick={onAdd} className="emplist-btn emplist-btn-primary">
                            <Plus size={16} /> Add Employee
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="emplist-stats-grid">
                    <StatCard icon={Users} label="Total Employees" value={pagination.count || 0} colorClass="emplist-stat-icon--indigo" trend="+12%" />
                    <StatCard icon={UserCheck} label="Active" value={employees.filter(e => e.status === 'active').length} colorClass="emplist-stat-icon--emerald" />
                    <StatCard icon={Briefcase} label="Departments" value={departments.length} colorClass="emplist-stat-icon--blue" />
                    <StatCard icon={UserX} label="On Leave" value={employees.filter(e => e.status === 'on_leave').length} colorClass="emplist-stat-icon--amber" />
                </div>
            </div>

            {/* ========== Toolbar ========== */}
            <div className="emplist-toolbar">
                <div className="emplist-toolbar-inner">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="emplist-search-form">
                        <Search className="emplist-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or email..."
                            className="emplist-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>

                    {/* Filters & Actions */}
                    <div className="emplist-toolbar-actions">
                        {selectedIds.length > 0 && (
                            <div className="emplist-selection-badge">
                                <span>{selectedIds.length} Selected</span>
                                <button onClick={() => setSelectedIds([])} title="Clear Selection"><Trash2 size={16} /></button>
                            </div>
                        )}

                        <div className="emplist-filter-select">
                            <Users size={16} />
                            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                                <option value="All">All Depts</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <div className="emplist-filter-select">
                            <Filter size={16} />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>

                        {/* View Toggle */}
                        <div className="emplist-view-toggle">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`emplist-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`emplist-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== Content Area ========== */}
            {viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="emplist-table-container emplist-animate-fade-in-up">
                    <div className="emplist-table-scroll">
                        <table className="emplist-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '3rem', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selectedIds.length === employees.length && employees.length > 0}
                                            className="emplist-checkbox"
                                        />
                                    </th>
                                    <th className="sortable" onClick={() => handleSort('full_name')}>
                                        <div className="emplist-th-content">
                                            Employee <ArrowUpDown size={12} className="emplist-sort-icon" />
                                        </div>
                                    </th>
                                    <th className="emplist-hidden-sm">ID & Joined</th>
                                    <th className="emplist-hidden-md">Role</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="emplist-skeleton-row">
                                            <td colSpan="6">
                                                <div className="emplist-skeleton-cell">
                                                    <div className="emplist-skeleton-avatar"></div>
                                                    <div className="emplist-skeleton-text">
                                                        <div className="emplist-skeleton-line emplist-skeleton-line--short"></div>
                                                        <div className="emplist-skeleton-line emplist-skeleton-line--medium"></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : employees.length > 0 ? (
                                    employees.map((emp) => (
                                        <tr key={emp.id} className={selectedIds.includes(emp.id) ? 'selected' : ''}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(emp.id)}
                                                    onChange={() => toggleSelection(emp.id)}
                                                    className="emplist-checkbox"
                                                />
                                            </td>
                                            <td>
                                                <div className="emplist-employee-cell">
                                                    <div className={`emplist-avatar ${getAvatarColor(emp.id)}`}>
                                                        {getInitials(emp.full_name)}
                                                    </div>
                                                    <div className="emplist-employee-info">
                                                        <div className="emplist-employee-name">
                                                            {emp.full_name}
                                                            {emp.has_user_account && <Shield size={12} />}
                                                        </div>
                                                        <div className="emplist-employee-email">
                                                            <Mail size={10} /> {emp.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="emplist-hidden-sm">
                                                <div className="emplist-id-badge">{emp.employee_id}</div>
                                                <div className="emplist-date">
                                                    <Calendar size={10} /> {emp.date_of_joining}
                                                </div>
                                            </td>
                                            <td className="emplist-hidden-md">
                                                <div className="emplist-role-title">{getDesignation(emp)}</div>
                                                <div className="emplist-dept-name">{getDeptName(emp)}</div>
                                            </td>
                                            <td>
                                                <span className={`emplist-status-badge emplist-status-badge--${emp.status || 'inactive'}`}>
                                                    <span className={`emplist-status-dot emplist-status-dot--${emp.status || 'inactive'}`}></span>
                                                    {emp.status ? emp.status.replace('_', ' ') : 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="emplist-actions">
                                                    <button onClick={() => onView && onView(emp.id)} className="emplist-action-btn" title="View Profile">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => onEdit(emp.id)} className="emplist-action-btn emplist-action-btn--edit" title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="emplist-action-btn emplist-action-btn--delete" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="emplist-empty-state">
                                                <div className="emplist-empty-icon">
                                                    <User size={32} />
                                                </div>
                                                <p className="emplist-empty-title">No employees found</p>
                                                <p className="emplist-empty-text">Try adjusting your filters or add a new employee.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="emplist-grid emplist-animate-fade-in-up">
                    {employees.map(emp => (
                        <div key={emp.id} className="emplist-card">
                            {/* Status Dot */}
                            <span
                                className={`emplist-card-status-dot emplist-status-dot--${emp.status || 'inactive'}`}
                                title={emp.status}
                            ></span>

                            <div className="emplist-card-header">
                                <div className={`emplist-card-avatar ${getAvatarColor(emp.id)}`}>
                                    {getInitials(emp.full_name)}
                                </div>
                                <h3 className="emplist-card-name">
                                    {emp.full_name}
                                    {emp.has_user_account && <Shield size={14} />}
                                </h3>
                                <p className="emplist-card-designation">{getDesignation(emp)}</p>
                            </div>

                            <div className="emplist-card-info">
                                <div className="emplist-card-info-row">
                                    <span className="emplist-card-info-label">Department</span>
                                    <span className="emplist-card-info-value">{getDeptName(emp)}</span>
                                </div>
                                <div className="emplist-card-info-row">
                                    <span className="emplist-card-info-label">ID</span>
                                    <span className="emplist-card-info-value" style={{ fontFamily: 'monospace' }}>{emp.employee_id}</span>
                                </div>
                                <div className="emplist-card-info-row">
                                    <span className="emplist-card-info-label">Email</span>
                                    <span className="emplist-card-info-value" title={emp.email}>{emp.email}</span>
                                </div>
                            </div>

                            <div className="emplist-card-actions">
                                <button onClick={() => onView && onView(emp.id)} className="emplist-card-btn-profile">
                                    Profile
                                </button>
                                <button onClick={() => onEdit(emp.id)} className="emplist-card-btn-edit">
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {employees.length === 0 && (
                        <div className="emplist-grid-empty">
                            <p>No results found for your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ========== Pagination ========== */}
            {pagination.count > 0 && (
                <div className="emplist-pagination">
                    <span className="emplist-pagination-text">
                        Showing <strong>{employees.length}</strong> of <strong>{pagination.count}</strong> employees
                    </span>
                    <div className="emplist-pagination-controls">
                        <button
                            disabled={!pagination.previous}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="emplist-pagination-btn"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="emplist-page-indicator">Page {currentPage}</span>
                        <button
                            disabled={!pagination.next}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="emplist-pagination-btn"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
