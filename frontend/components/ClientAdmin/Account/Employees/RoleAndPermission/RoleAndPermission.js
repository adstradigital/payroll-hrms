'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Check, Search, Save, AlertCircle, ChevronDown, ChevronRight, Layers, Lock, Unlock, Crown
} from 'lucide-react';
import {
    getPermissions, getScopes, getAllDesignations, updateDesignationPermissions
} from '@/api/api_clientadmin';
import './RoleAndPermission.css';

export default function RoleAndPermission() {
    const [permissions, setPermissions] = useState([]);
    const [scopes, setScopes] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [selectedPermissions, setSelectedPermissions] = useState({}); // { permId: scopeId }
    const [initialPermissionsSnapshot, setInitialPermissionsSnapshot] = useState({}); // To track changes

    // UI State
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [expandedModules, setExpandedModules] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [permsRes, scopesRes, desigRes] = await Promise.all([
                getPermissions(),
                getScopes(),
                getAllDesignations()
            ]);

            setPermissions(permsRes.data.permissions || []);
            setScopes(scopesRes.data.scopes || []);

            const desigs = desigRes.data.results || desigRes.data || [];
            setDesignations(desigs);

            // If we have a selected designation, update it with fresh data
            if (selectedDesignation) {
                const refreshedDesig = desigs.find(d => d.id === selectedDesignation.id);
                if (refreshedDesig) {
                    handleDesignationSelect(refreshedDesig, false);
                }
            } else if (desigs.length > 0) {
                // Auto-select first designation
                handleDesignationSelect(desigs[0]);
            }

            // Group permissions by module
            const grouped = (permsRes.data.permissions || []).reduce((acc, perm) => {
                const moduleName = perm.module_name || 'Other';
                if (!acc[moduleName]) acc[moduleName] = [];
                acc[moduleName].push(perm);
                return acc;
            }, {});
            setGroupedPermissions(grouped);

            // Auto-expand all modules
            const allExpanded = {};
            Object.keys(grouped).forEach(key => { allExpanded[key] = true; });
            setExpandedModules(allExpanded);
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDesignationSelect = (desig, updateState = true) => {
        if (updateState) {
            setSelectedDesignation(desig);
            setNotification(null);
        }

        // Build permission map from designation permissions
        const permMap = {};
        (desig.permissions_data || []).forEach(dp => {
            permMap[dp.permission] = dp.scope;
        });
        setSelectedPermissions(permMap);
        setInitialPermissionsSnapshot(permMap);
    };

    const togglePermission = (permId, defaultScopeId) => {
        setSelectedPermissions(prev => {
            const newPerms = { ...prev };
            if (newPerms[permId]) {
                delete newPerms[permId]; // Remove permission
            } else {
                newPerms[permId] = defaultScopeId; // Add with default scope
            }
            return newPerms;
        });
    };

    const changeScope = (permId, scopeId) => {
        setSelectedPermissions(prev => ({
            ...prev,
            [permId]: scopeId
        }));
    };

    const toggleModule = (moduleName) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    const handleModuleToggle = (e, moduleName, modulePerms) => {
        e.stopPropagation(); // Prevent accordion toggle

        // Check if all are currently selected
        const allSelected = modulePerms.every(p => selectedPermissions[p.id]);

        setSelectedPermissions(prev => {
            const newPerms = { ...prev };

            if (allSelected) {
                // Deselect all in this module
                modulePerms.forEach(p => {
                    delete newPerms[p.id];
                });
            } else {
                // Select all in this module with default scope
                const defaultScopeId = scopes[0]?.id;
                if (defaultScopeId) {
                    modulePerms.forEach(p => {
                        newPerms[p.id] = defaultScopeId;
                    });
                }
            }
            return newPerms;
        });
    };

    const handleSave = async () => {
        if (!selectedDesignation) return;
        setSaving(true);
        try {
            // Convert map to array { permission: uuid, scope: uuid }
            const permissionsList = Object.entries(selectedPermissions).map(([permId, scopeId]) => ({
                permission: permId,
                scope: scopeId
            }));

            await updateDesignationPermissions(selectedDesignation.id, {
                permissions: permissionsList
            });

            showNotification('success', `Permissions updated for ${selectedDesignation.name}`);

            // Update snapshot to current state so button disables
            setInitialPermissionsSnapshot({ ...selectedPermissions });

            // Refresh data to ensure sync (optional, might not be needed if we trust local state)
            fetchData();
        } catch (error) {
            console.error('Error saving permissions:', error);
            showNotification('error', 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // Filter designations
    const filteredDesignations = designations.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check for changes
    const hasChanges = useMemo(() => {
        if (!selectedDesignation) return false;

        const currentKeys = Object.keys(selectedPermissions);
        const initialKeys = Object.keys(initialPermissionsSnapshot);

        if (currentKeys.length !== initialKeys.length) return true;

        for (const key of currentKeys) {
            if (initialPermissionsSnapshot[key] !== selectedPermissions[key]) {
                return true;
            }
        }
        return false;
    }, [selectedPermissions, initialPermissionsSnapshot, selectedDesignation]);

    if (loading) {
        return (
            <div className="rp-container">
                <div className="rp-loading">
                    <div className="rp-spinner"></div>
                    <p>Loading permissions data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rp-container">
            {notification && (
                <div className={`rp-notification ${notification.type} animate-slide-in`}>
                    {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            <div className="rp-header">
                <div className="rp-title-section">
                    <div className="rp-icon-box">
                        <Crown size={28} />
                    </div>
                    <div>
                        <h1>Roles & Permissions</h1>
                        <p>Configure access levels and security scopes</p>
                    </div>
                </div>
                {selectedDesignation && (
                    <div className="rp-actions">
                        <span className="rp-status-badge">
                            {Object.keys(selectedPermissions).length} Active Permissions
                        </span>
                        <button
                            className="rp-btn-primary"
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            style={{ opacity: (saving || !hasChanges) ? 0.6 : 1, cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer' }}
                        >
                            {saving ? <div className="spinner-small"></div> : <Save size={18} />}
                            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
                        </button>
                    </div>
                )}
            </div>

            <div className="rp-split-view">
                {/* Left Panel: Designation List */}
                <div className="rp-left-panel">
                    <div className="rp-panel-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search Roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="rp-desig-list-scroll">
                        <div className="rp-list-header">DESIGNATIONS</div>
                        {filteredDesignations.map(desig => (
                            <div
                                key={desig.id}
                                className={`rp-desig-item ${selectedDesignation?.id === desig.id ? 'active' : ''}`}
                                onClick={() => handleDesignationSelect(desig)}
                            >
                                <div className="rp-desig-avatar">
                                    {desig.name.charAt(0)}
                                </div>
                                <div className="rp-desig-info">
                                    <span className="rp-desig-name">{desig.name}</span>
                                    <span className="rp-desig-count">
                                        {(desig.permissions_data?.length || 0) + (selectedDesignation?.id === desig.id ? Object.keys(selectedPermissions).length - (desig.permissions_data?.length || 0) : 0)} permissions
                                    </span>
                                </div>
                                {selectedDesignation?.id === desig.id && <ChevronRight size={16} className="rp-active-indicator" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Permissions Matrix */}
                <div className="rp-right-panel">
                    {selectedDesignation ? (
                        <div className="rp-permissions-wrapper">
                            <div className="rp-panel-header">
                                <div className="rp-ph-content">
                                    <h2>{selectedDesignation.name}</h2>
                                    <p className="rp-subtitle">Manage module access and data visibility</p>
                                </div>
                                <div className="rp-security-badge">
                                    <Shield size={14} /> Security Level: High
                                </div>
                            </div>

                            <div className="rp-modules-list">
                                {Object.entries(groupedPermissions).sort().map(([module, modulePerms]) => {
                                    const selectedCount = modulePerms.filter(p => selectedPermissions[p.id]).length;
                                    const isAllSelected = selectedCount === modulePerms.length && modulePerms.length > 0;

                                    return (
                                        <div key={module} className={`rp-module-group ${expandedModules[module] ? 'expanded' : ''}`}>
                                            <div
                                                className="rp-module-header"
                                                onClick={() => toggleModule(module)}
                                            >
                                                <div className="rp-module-title">
                                                    {/* Select All Checkbox */}
                                                    <div
                                                        className="checkbox-wrapper"
                                                        onClick={(e) => handleModuleToggle(e, module, modulePerms)}
                                                        style={{ marginRight: '12px' }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isAllSelected}
                                                            readOnly
                                                        />
                                                        <div className="custom-checkbox">
                                                            {isAllSelected && <Check size={12} strokeWidth={4} />}
                                                        </div>
                                                    </div>

                                                    {expandedModules[module] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    <span>{module}</span>
                                                </div>
                                                <div className="rp-module-meta">
                                                    <div className="rp-progress-bar">
                                                        <div
                                                            className="rp-progress-fill"
                                                            style={{ width: `${(selectedCount / modulePerms.length) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="rp-module-badge">
                                                        {selectedCount} / {modulePerms.length}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rp-module-content">
                                                {modulePerms.map(perm => {
                                                    const isSelected = !!selectedPermissions[perm.id];
                                                    return (
                                                        <div key={perm.id} className={`rp-perm-row ${isSelected ? 'selected' : ''}`}>
                                                            <div className="rp-perm-check">
                                                                <div className="checkbox-wrapper">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`perm-${perm.id}`}
                                                                        checked={isSelected}
                                                                        onChange={() => togglePermission(perm.id, scopes[0]?.id)}
                                                                    />
                                                                    <label htmlFor={`perm-${perm.id}`} className="custom-checkbox">
                                                                        {isSelected && <Check size={12} strokeWidth={4} />}
                                                                    </label>
                                                                </div>
                                                                <div className="rp-perm-text">
                                                                    <label htmlFor={`perm-${perm.id}`} className="rp-perm-name">{perm.name}</label>
                                                                    <p className="rp-perm-desc">{perm.description || 'Access control for this feature'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="rp-scope-container">
                                                                {isSelected ? (
                                                                    <div className="rp-select-wrapper">
                                                                        <Unlock size={14} className="rp-scope-icon" />
                                                                        <select
                                                                            value={selectedPermissions[perm.id]}
                                                                            onChange={(e) => changeScope(perm.id, e.target.value)}
                                                                        >
                                                                            {scopes.map(scope => (
                                                                                <option key={scope.id} value={scope.id}>
                                                                                    {scope.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown size={14} className="rp-select-arrow" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="rp-locked-state">
                                                                        <Lock size={14} /> <span>Restricted</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="rp-placeholder">
                            <div className="rp-placeholder-icon">
                                <Layers size={64} />
                            </div>
                            <h3>Select a Designation</h3>
                            <p>Choose a role from the sidebar to configure permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
