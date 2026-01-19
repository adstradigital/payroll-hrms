'use client';

import { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2,
    Layers, Users, X, CheckCircle2,
    Building2, MapPin
} from 'lucide-react';
import {
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getOrganization
} from '@/api/api_clientadmin';
import './Departments.css';

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [org, setOrg] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, orgRes] = await Promise.all([
                getAllDepartments(),
                getOrganization()
            ]);
            setDepartments(deptRes.data.results || deptRes.data);
            setOrg(orgRes.data.organization);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (dept = null) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                code: dept.code,
                description: dept.description || '',
                is_active: dept.is_active
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                company: org.id
            };

            if (editingDept) {
                await updateDepartment(editingDept.id, payload);
            } else {
                await createDepartment(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await deleteDepartment(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting department:', error);
            }
        }
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="departments-container">
            <div className="module-header">
                <div className="header-info">
                    <h2>Departments Management</h2>
                    <p>Organize your company structure by defining departments and units.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Department
                </button>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading departments...</div>
            ) : (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Code</th>
                                <th>Employees</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDepartments.map(dept => (
                                <tr key={dept.id}>
                                    <td>
                                        <div className="dept-info">
                                            <div className="dept-icon-wrapper">
                                                <Building2 size={16} />
                                            </div>
                                            <div className="dept-details">
                                                <span className="dept-name">{dept.name}</span>
                                                <span className="dept-desc">{dept.description || 'No description provided'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge-outline">{dept.code}</span>
                                    </td>
                                    <td>
                                        <span className="emp-count">
                                            <Users size={14} />
                                            {dept.employee_count || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${dept.is_active ? 'active' : 'inactive'}`}>
                                            {dept.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" onClick={() => handleOpenModal(dept)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(dept.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h3>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Department Name*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Engineering"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department Code*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. ENG"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of department functions..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span>Department is active</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDept ? 'Update Department' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
