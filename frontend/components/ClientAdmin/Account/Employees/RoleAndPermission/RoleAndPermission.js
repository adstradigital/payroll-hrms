'use client';

import { useState, useEffect } from 'react';
import {
    Shield, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronRight,
    Users, Key, Layers, Save, AlertCircle
} from 'lucide-react';
import {
    getRoles, createRole, updateRole, deleteRole,
    getPermissions, getScopes, getAllDesignations, updateDesignation
} from '@/api/api_clientadmin';
import './RoleAndPermission.css';

export default function RoleAndPermission() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [scopes, setScopes] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roles');

    // Role editing
    const [selectedRole, setSelectedRole] = useState(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleFormData, setRoleFormData] = useState({ name: '', code: '', description: '' });
    const [selectedPermissions, setSelectedPermissions] = useState({});

    // Designation mapping
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [designationRoles, setDesignationRoles] = useState([]);

    // Grouped permissions by module
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes, scopesRes, desigRes] = await Promise.all([
                getRoles(),
                getPermissions(),
                getScopes(),
                getAllDesignations()
            ]);

            console.log('Permissions API Response:', permsRes.data);
            console.log('Scopes API Response:', scopesRes.data);

            setRoles(rolesRes.data.roles || []);
            setPermissions(permsRes.data.permissions || []);
            setScopes(scopesRes.data.scopes || []);
            setDesignations(desigRes.data.results || desigRes.data || []);

            // Group permissions by module
            const grouped = (permsRes.data.permissions || []).reduce((acc, perm) => {
                const moduleName = perm.module_name || 'Other';
                if (!acc[moduleName]) acc[moduleName] = [];
                acc[moduleName].push(perm);
                return acc;
            }, {});
            setGroupedPermissions(grouped);

            // Auto-expand all modules so permissions are visible
            const allExpanded = {};
            Object.keys(grouped).forEach(key => { allExpanded[key] = true; });
            setExpandedModules(allExpanded);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (moduleName) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    const handleOpenRoleModal = (role = null) => {
        if (role) {
            setSelectedRole(role);
            setRoleFormData({ name: role.name, code: role.code, description: role.description || '' });
            // Build permission map from existing role
            const permMap = {};
            (role.permissions_data || []).forEach(rp => {
                permMap[rp.permission] = rp.scope;
            });
            setSelectedPermissions(permMap);
        } else {
            setSelectedRole(null);
            setRoleFormData({ name: '', code: '', description: '' });
            setSelectedPermissions({});
        }
        setIsRoleModalOpen(true);
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            const permissionsPayload = Object.entries(selectedPermissions).map(([permId, scopeId]) => ({
                permission: permId,
                scope: scopeId
            }));

            const payload = {
                ...roleFormData,
                permissions: permissionsPayload
            };

            if (selectedRole) {
                await updateRole(selectedRole.id, payload);
            } else {
                await createRole(payload);
            }
            setIsRoleModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving role:', error);
        }
    };

    const handleDeleteRole = async (id) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await deleteRole(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting role:', error);
            }
        }
    };

    const handlePermissionToggle = (permId, scopeId) => {
        setSelectedPermissions(prev => {
            if (prev[permId] === scopeId) {
                const newPerms = { ...prev };
                delete newPerms[permId];
                return newPerms;
            }
            return { ...prev, [permId]: scopeId };
        });
    };

    const handleDesignationSelect = (desig) => {
        setSelectedDesignation(desig);
        setDesignationRoles((desig.roles || []).map(r => r.id));
    };

    const handleDesignationRoleToggle = (roleId) => {
        setDesignationRoles(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handleSaveDesignationRoles = async () => {
        if (!selectedDesignation) return;
        try {
            await updateDesignation(selectedDesignation.id, {
                ...selectedDesignation,
                roles: designationRoles
            });
            fetchData();
        } catch (error) {
            console.error('Error saving designation roles:', error);
        }
    };

    if (loading) {
        return (
            <div className="rp-loading">
                <div className="rp-spinner"></div>
                <p>Loading permissions...</p>
            </div>
        );
    }

    return (
        <div className="rp-container">
            <div className="rp-header">
                <div className="rp-title-section">
                    <Shield className="rp-icon" />
                    <div>
                        <h1>Roles & Permissions</h1>
                        <p>Manage access control and role-based permissions</p>
                    </div>
                </div>
            </div>

            <div className="rp-tabs">
                <button
                    className={`rp-tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <Key size={18} /> Manage Roles
                </button>
                <button
                    className={`rp-tab ${activeTab === 'designations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('designations')}
                >
                    <Users size={18} /> Designation Mapping
                </button>
            </div>

            {activeTab === 'roles' && (
                <div className="rp-content">
                    <div className="rp-section-header">
                        <h2>Custom Roles</h2>
                        <button className="rp-btn-primary" onClick={() => handleOpenRoleModal()}>
                            <Plus size={18} /> New Role
                        </button>
                    </div>

                    <div className="rp-roles-grid">
                        {roles.map(role => (
                            <div key={role.id} className={`rp-role-card ${role.role_type === 'system' ? 'system' : ''}`}>
                                <div className="rp-role-header">
                                    <h3>{role.name}</h3>
                                    {role.role_type === 'system' && <span className="rp-badge system">System</span>}
                                </div>
                                <p className="rp-role-code">{role.code}</p>
                                <p className="rp-role-desc">{role.description || 'No description'}</p>
                                <div className="rp-role-stats">
                                    <span>{(role.permissions_data || []).length} permissions</span>
                                </div>
                                <div className="rp-role-actions">
                                    <button onClick={() => handleOpenRoleModal(role)} disabled={role.role_type === 'system'}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteRole(role.id)} disabled={role.role_type === 'system'}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'designations' && (
                <div className="rp-content rp-split-view">
                    <div className="rp-desig-list">
                        <h3>Designations</h3>
                        {designations.map(desig => (
                            <div
                                key={desig.id}
                                className={`rp-desig-item ${selectedDesignation?.id === desig.id ? 'active' : ''}`}
                                onClick={() => handleDesignationSelect(desig)}
                            >
                                <span>{desig.name}</span>
                                <span className="rp-desig-roles-count">{(desig.roles || []).length} roles</span>
                            </div>
                        ))}
                    </div>

                    <div className="rp-desig-roles">
                        {selectedDesignation ? (
                            <>
                                <div className="rp-desig-roles-header">
                                    <h3>Roles for: {selectedDesignation.name}</h3>
                                    <button className="rp-btn-primary" onClick={handleSaveDesignationRoles}>
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                                <div className="rp-desig-roles-list">
                                    {roles.map(role => (
                                        <label key={role.id} className="rp-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={designationRoles.includes(role.id)}
                                                onChange={() => handleDesignationRoleToggle(role.id)}
                                            />
                                            <span>{role.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="rp-desig-placeholder">
                                <Layers size={48} />
                                <p>Select a designation to manage its roles</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <div className="rp-modal-overlay" onClick={() => setIsRoleModalOpen(false)}>
                    <div className="rp-modal" onClick={e => e.stopPropagation()}>
                        <div className="rp-modal-header">
                            <h2>{selectedRole ? 'Edit Role' : 'Create New Role'}</h2>
                            <button className="rp-modal-close" onClick={() => setIsRoleModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRoleSubmit}>
                            <div className="rp-modal-body">
                                <div className="rp-form-row">
                                    <div className="rp-form-group">
                                        <label>Role Name</label>
                                        <input
                                            type="text"
                                            value={roleFormData.name}
                                            onChange={e => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="rp-form-group">
                                        <label>Code</label>
                                        <input
                                            type="text"
                                            value={roleFormData.code}
                                            onChange={e => setRoleFormData(prev => ({ ...prev, code: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="rp-form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={roleFormData.description}
                                        onChange={e => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                    />
                                </div>

                                <div className="rp-permissions-section">
                                    <h3>Permissions</h3>
                                    <div className="rp-permissions-list">
                                        {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                                            <div key={moduleName} className="rp-permission-module">
                                                <div
                                                    className="rp-module-header"
                                                    onClick={() => toggleModule(moduleName)}
                                                >
                                                    {expandedModules[moduleName]
                                                        ? <ChevronDown size={18} />
                                                        : <ChevronRight size={18} />
                                                    }
                                                    <span>{moduleName}</span>
                                                    <span className="rp-module-count">{perms.length}</span>
                                                </div>
                                                {expandedModules[moduleName] && (
                                                    <div className="rp-module-permissions">
                                                        {perms.map(perm => (
                                                            <div key={perm.id} className="rp-permission-row">
                                                                <span className="rp-perm-name">{perm.name}</span>
                                                                <select
                                                                    value={selectedPermissions[perm.id] || ''}
                                                                    onChange={e => handlePermissionToggle(perm.id, e.target.value)}
                                                                >
                                                                    <option value="">No Access</option>
                                                                    {scopes.map(scope => (
                                                                        <option key={scope.id} value={scope.id}>
                                                                            {scope.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="rp-modal-footer">
                                <button type="button" className="rp-btn-secondary" onClick={() => setIsRoleModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="rp-btn-primary">
                                    <Check size={18} /> {selectedRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
