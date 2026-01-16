'use client';

import { useState } from 'react';
import {
    Search, Filter, Plus, User,
    Mail, Phone, MapPin, MoreVertical,
    Edit2, Trash2, Eye
} from 'lucide-react';
import './Employee.css';

const MOCK_EMPLOYEES = [
    {
        id: 'EMP001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        department: 'Engineering',
        designation: 'Senior Developer',
        status: 'Active',
        joinDate: '2023-01-15'
    },
    {
        id: 'EMP002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+91 87654 32109',
        department: 'Human Resources',
        designation: 'HR Manager',
        status: 'Active',
        joinDate: '2022-11-20'
    },
    {
        id: 'EMP003',
        name: 'Robert Wilson',
        email: 'robert.w@example.com',
        phone: '+91 76543 21098',
        department: 'Operations',
        designation: 'Ops Lead',
        status: 'On Leave',
        joinDate: '2023-03-10'
    },
    {
        id: 'EMP004',
        name: 'Sarah Parker',
        email: 'sarah.p@example.com',
        phone: '+91 65432 10987',
        department: 'Engineering',
        designation: 'Product Designer',
        status: 'Active',
        joinDate: '2023-05-22'
    }
];

export default function Employee() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');

    const filteredEmployees = MOCK_EMPLOYEES.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'All' || emp.department === filterDept;
        return matchesSearch && matchesDept;
    });

    return (
        <div className="employee-module">
            {/* Toolbar */}
            <div className="employee-toolbar">
                <div className="toolbar-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="filter-select">
                        <Filter size={16} />
                        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="All">All Departments</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>

                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Employee Table */}
            <div className="table-container animate-fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>ID & Join Date</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp) => (
                            <tr key={emp.id}>
                                <td>
                                    <div className="user-info-cell">
                                        <div className="user-avatar-sm">
                                            {emp.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{emp.name}</span>
                                            <span className="user-email">{emp.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="id-cell">
                                        <span className="emp-id">{emp.id}</span>
                                        <span className="emp-date">{emp.joinDate}</span>
                                    </div>
                                </td>
                                <td>{emp.department}</td>
                                <td>{emp.designation}</td>
                                <td>
                                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' :
                                            emp.status === 'On Leave' ? 'badge-warning' :
                                                'badge-danger'
                                        }`}>
                                        <span className={`status-dot ${emp.status === 'Active' ? 'status-dot--active' :
                                                emp.status === 'On Leave' ? 'status-dot--warning' :
                                                    'status-dot--inactive'
                                            }`}></span>
                                        {emp.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button className="action-btn" title="View"><Eye size={16} /></button>
                                        <button className="action-btn" title="Edit"><Edit2 size={16} /></button>
                                        <button className="action-btn action-btn--danger" title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredEmployees.length === 0 && (
                <div className="empty-state">
                    <User size={48} />
                    <p>No employees found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
