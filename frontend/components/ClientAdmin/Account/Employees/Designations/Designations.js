'use client';

import { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2,
    Shield, Briefcase, ChevronRight, X,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import {
    getAllDesignations,
    getRoles,
    createDesignation,
    updateDesignation,
    deleteDesignation,
    getOrganization
} from '@/api/api_clientadmin';
import './Designations.css';

export default function Designations() {
    const [designations, setDesignations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDesig, setEditingDesig] = useState(null);
    const [org, setOrg] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        level: 1,
        description: '',
        roles: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [desigRes, rolesRes, orgRes] = await Promise.all([
                getAllDesignations(),
                getRoles(),
                getOrganization()
            ]);
            setDesignations(desigRes.data.results || desigRes.data);
            setRoles(rolesRes.data.roles);
            setOrg(orgRes.data.organization);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (desig = null) => {
        if (desig) {
            setEditingDesig(desig);
            setFormData({
                name: desig.name,
                code: desig.code,
                level: desig.level,
                description: desig.description || '',
                roles: desig.roles ? desig.roles.map(r => r.id) : []
            });
        } else {
            setEditingDesig(null);
            setFormData({
                name: '',
                code: '',
                level: 1,
                description: '',
                roles: []
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

            if (editingDesig) {
                await updateDesignation(editingDesig.id, payload);
            } else {
                await createDesignation(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving designation:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this designation?')) {
            try {
                await deleteDesignation(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting designation:', error);
            }
        }
    };

    const toggleRole = (roleId) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter(id => id !== roleId)
                : [...prev.roles, roleId]
        }));
    };

    const filteredDesignations = designations.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="designations-container">
            <div className="module-header">
                <div className="header-info">
                    <h2>Designations Management</h2>
                    <p>Define job titles and map them to system roles for automatic permission inheritance.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Designation
                </button>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search designations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading designations...</div>
            ) : (
                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Designation</th>
                                <th>Code & Level</th>
                                <th>Mapped Roles</th>
                                <th>Employees</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDesignations.map(desig => (
                                <tr key={desig.id}>
                                    <td>
                                        <div className="desig-info">
                                            <span className="desig-name">{desig.name}</span>
                                            <span className="desig-desc">{desig.description || 'No description'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="code-level">
                                            <span className="badge-outline">{desig.code}</span>
                                            <span className="level-text">Lvl {desig.level}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="roles-list">
                                            {desig.roles && desig.roles.length > 0 ? (
                                                desig.roles.map(role => (
                                                    <span key={role.id} className="role-tag">
                                                        <Shield size={12} />
                                                        {role.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted italic">No roles linked</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="emp-count">
                                            <Briefcase size={14} />
                                            {desig.employee_count || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" onClick={() => handleOpenModal(desig)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(desig.id)}>
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
                            <h3>{editingDesig ? 'Edit Designation' : 'Add New Designation'}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Designation Name*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Senior Software Engineer"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Designation Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. SSE"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Hierarchy Level (1 = Highest)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief role description..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Map Automatic Roles</label>
                                <p className="label-help">Employees with this designation will automatically inherit these roles and their permissions.</p>
                                <div className="roles-selector">
                                    {roles.map(role => (
                                        <div
                                            key={role.id}
                                            className={`role-option ${formData.roles.includes(role.id) ? 'selected' : ''}`}
                                            onClick={() => toggleRole(role.id)}
                                        >
                                            <div className="role-option-check">
                                                {formData.roles.includes(role.id) ? <CheckCircle2 size={16} /> : <div className="empty-check"></div>}
                                            </div>
                                            <div className="role-option-info">
                                                <span className="role-name">{role.name}</span>
                                                <span className="role-code">{role.code}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDesig ? 'Update Designation' : 'Create Designation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
