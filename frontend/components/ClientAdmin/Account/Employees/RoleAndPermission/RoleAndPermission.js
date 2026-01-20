'use client';

import React, { useState, useEffect } from 'react';
import {
    Shield, Check, Search, Save, AlertCircle, ChevronDown, ChevronRight,
    Layers, Lock, User, Users, Globe
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

    // Simple Mode State: "Access Level"
    // 1 = Self (Standard), 3 = Department (Manager), 6 = Organization (Admin)
    const [accessLevel, setAccessLevel] = useState('1');

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
            setDesignations(desigRes.data.results || desigRes.data || []);

            // Group permissions
            const grouped = (permsRes.data.permissions || []).reduce((acc, perm) => {
                // Friendly Name formatting
                const moduleName = perm.module_name.replace(/_/g, ' ').toUpperCase() || 'GENERAL';
                if (!acc[moduleName]) acc[moduleName] = [];
                acc[moduleName].push(perm);
                return acc;
            }, {});

            setGroupedPermissions(grouped);

            // Auto-expand all
            const allExpanded = {};
            Object.keys(grouped).forEach(key => { allExpanded[key] = true; });
            setExpandedModules(allExpanded);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDesignationSelect = (desig) => {
        setSelectedDesignation(desig);

        // Convert API permissions to local map
        const permMap = {};
        let highestScopeLevel = 0;

        (desig.permissions_data || []).forEach(dp => {
            permMap[dp.permission] = dp.scope;

            // Try to guess the "Access Level" based on existing permissions
            const scopeObj = scopes.find(s => s.id === dp.scope);
            if (scopeObj && scopeObj.level > highestScopeLevel) {
                highestScopeLevel = scopeObj.level;
            }
        });

        setSelectedPermissions(permMap);

        // Auto-set the Access Level dropdown based on data
        if (highestScopeLevel >= 6) setAccessLevel('6'); // Organization
        else if (highestScopeLevel >= 3) setAccessLevel('3'); // Department
        else setAccessLevel('1'); // Self
    };

    // Helper to get scope ID based on "Simple Level"
    const getCurrentScopeId = () => {
        // Find scope code matching our simple level
        // Level 1 = 'self', Level 3 = 'department', Level 6 = 'organization'
        const targetCode = accessLevel === '6' ? 'organization' : (accessLevel === '3' ? 'department' : 'self');
        const scope = scopes.find(s => s.code === targetCode) || scopes[0];
        return scope?.id;
    };

    const togglePermission = (permId) => {
        const scopeId = getCurrentScopeId();

        setSelectedPermissions(prev => {
            const newPerms = { ...prev };
            if (newPerms[permId]) {
                delete newPerms[permId];
            } else {
                if (scopeId) newPerms[permId] = scopeId;
            }
            return newPerms;
        });
    };

    // When user changes "Access Level" (Standard vs Manager vs Admin)
    const handleAccessLevelChange = (newLevel) => {
        setAccessLevel(newLevel);

        // OPTIONAL: Update all currently selected permissions to this new scope
        const newScopeCode = newLevel === '6' ? 'organization' : (newLevel === '3' ? 'department' : 'self');
        const newScopeId = scopes.find(s => s.code === newScopeCode)?.id;

        if (newScopeId) {
            setSelectedPermissions(prev => {
                const updated = {};
                Object.keys(prev).forEach(permId => {
                    updated[permId] = newScopeId;
                });
                return updated;
            });
        }
    };

    const handleSave = async () => {
        if (!selectedDesignation) return;
        setSaving(true);
        try {
            const permissionsList = Object.entries(selectedPermissions).map(([permId, scopeId]) => ({
                permission: permId,
                scope: scopeId
            }));

            await updateDesignationPermissions(selectedDesignation.id, {
                permissions: permissionsList
            });

            setNotification({ type: 'success', message: 'Saved successfully!' });
            setTimeout(() => setNotification(null), 3000);

            // Refresh data to keep sync
            fetchData();
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to save.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="rp-loading">Loading...</div>;

    return (
        <div className="rp-container">
            {notification && (
                <div className={`rp-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="rp-header">
                <div>
                    <h1>Access Control</h1>
                    <p>Manage what each Job Title can see and do.</p>
                </div>
                {selectedDesignation && (
                    <button className="rp-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <div className="rp-split-view">
                {/* Left: Job Titles */}
                <div className="rp-left-panel">
                    <div className="rp-panel-search">
                        <Search size={18} />
                        <input
                            placeholder="Search Job Titles..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="rp-desig-list-scroll">
                        {designations.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(desig => (
                            <div
                                key={desig.id}
                                className={`rp-desig-item ${selectedDesignation?.id === desig.id ? 'active' : ''}`}
                                onClick={() => handleDesignationSelect(desig)}
                            >
                                <div className="rp-desig-avatar">{desig.name.charAt(0)}</div>
                                <div className="rp-desig-info">
                                    <span className="rp-desig-name">{desig.name}</span>
                                    <span className="rp-desig-count">{desig.employee_count || 0} Employees</span>
                                </div>
                                <ChevronRight size={16} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Permissions */}
                <div className="rp-right-panel">
                    {selectedDesignation ? (
                        <div className="rp-permissions-wrapper">
                            <div className="rp-panel-header">
                                <div className="rp-ph-content">
                                    <h2>{selectedDesignation.name}</h2>
                                    <p className="rp-subtitle">Configure access rights</p>
                                </div>

                                {/* THE SIMPLIFIED ACCESS LEVEL SWITCHER */}
                                <div className="rp-access-level-control">
                                    <label>Access Level:</label>
                                    <select
                                        value={accessLevel}
                                        onChange={(e) => handleAccessLevelChange(e.target.value)}
                                        className="rp-level-select"
                                    >
                                        <option value="1">👤 Standard (Own Data Only)</option>
                                        <option value="3">👥 Manager (Department Data)</option>
                                        <option value="6">🏢 Admin (All Company Data)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="rp-modules-list">
                                {Object.entries(groupedPermissions).map(([module, modulePerms]) => (
                                    <div key={module} className="rp-module-group expanded">
                                        <div className="rp-module-header">
                                            <span className="rp-module-title-text">{module}</span>
                                        </div>
                                        <div className="rp-module-content">
                                            {modulePerms.map(perm => {
                                                const isSelected = !!selectedPermissions[perm.id];
                                                return (
                                                    <div key={perm.id}
                                                        className={`rp-perm-row ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => togglePermission(perm.id)}
                                                    >
                                                        <div className="rp-perm-check">
                                                            <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                                                                {isSelected && <Check size={12} />}
                                                            </div>
                                                            <div className="rp-perm-text">
                                                                <span className="rp-perm-name">
                                                                    {perm.name.replace(/Can view/i, 'View').replace(/Can add/i, 'Add')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rp-placeholder">
                            <Layers size={48} />
                            <h3>Select a Job Title</h3>
                            <p>Select a designation on the left to set permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
