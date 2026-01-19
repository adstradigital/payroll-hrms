'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Plus, User,
    Mail, Phone, MoreVertical,
    Edit2, Trash2, Eye, Download,
    FileSpreadsheet, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllEmployees, getAllDepartments } from '@/api/api_clientadmin';
import './EmployeeList.css';

export default function EmployeeList({ onAdd, onEdit }) {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, [currentPage, filterDept, statusFilter]);

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
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                <div className="toolbar-actions">
                    <div className="filter-select">
                        <Users size={16} />
                        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="All">All Departments</option>
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

                    <button className="btn btn-primary" onClick={onAdd}>
                        <Plus size={18} />
                        Add Employee
                    </button>

                    <button className="btn btn-secondary icon-only" title="Export to Excel">
                        <FileSpreadsheet size={18} />
                    </button>
                </div>
            </div>

            {/* Employee Table */}
            <div className="table-container shadow-sm">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>ID & Joined</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td colSpan="6"><div className="skeleton"></div></td>
                                </tr>
                            ))
                        ) : employees.length > 0 ? (
                            employees.map((emp) => (
                                <tr key={emp.id} className="hoverable-row">
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="user-avatar-sm">
                                                {emp.profile_photo ? (
                                                    <img src={emp.profile_photo} alt={emp.full_name} />
                                                ) : (
                                                    emp.full_name.split(' ').map(n => n[0]).join('')
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{emp.full_name}</span>
                                                <span className="user-email">{emp.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="id-cell">
                                            <span className="emp-id">{emp.employee_id}</span>
                                            <span className="emp-date">{emp.date_of_joining}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="dept-badge">{emp.department || 'N/A'}</span>
                                    </td>
                                    <td>
                                        <span className="desig-text">{emp.designation || 'N/A'}</span>
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
                                            {emp.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="action-btn" onClick={() => router.push(`/dashboard/employees/${emp.id}`)} title="View Detail"><Eye size={16} /></button>
                                            <button className="action-btn" onClick={() => onEdit(emp.id)} title="Edit Employee"><Edit2 size={16} /></button>
                                            <button className="action-btn action-btn--danger" title="Terminate"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <User size={48} />
                                        <p>No employees found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.count > 0 && (
                <div className="pagination">
                    <span className="pagination-info">
                        Showing <b>{employees.length}</b> of <b>{pagination.count}</b> employees
                    </span>
                    <div className="pagination-btns">
                        <button
                            className="btn btn-outline btn-sm"
                            disabled={!pagination.previous}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            disabled={!pagination.next}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
