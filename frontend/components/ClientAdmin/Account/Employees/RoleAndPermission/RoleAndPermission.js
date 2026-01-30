'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Layers, Shield, Settings
} from 'lucide-react';
import {
    getAllDesignations, getRoles, updateDesignation
} from '@/api/api_clientadmin';
import './RoleAndPermission.css';

export default function RoleAndPermission() {
    const [designations, setDesignations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection
    const [selectedDesignation, setSelectedDesignation] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState(null);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [desigRes, rolesRes] = await Promise.all([
                getAllDesignations(),
                getRoles()
            ]);

            setDesignations(desigRes.data.results || desigRes.data || []);
            setRoles(rolesRes.data.roles || rolesRes.data.results || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setNotification({ type: 'error', message: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDesignationSelect = (desig) => {
        setSelectedDesignation(desig);
        // Find currently assigned role (assuming single role for MVP simplicity)
        // Adjust based on your API response structure for designation.roles
        const currentRole = desig.roles && desig.roles.length > 0 ? desig.roles[0].id : null;
        setSelectedRoleId(currentRole);
    };

    const handleRoleSelect = (roleId) => {
        setSelectedRoleId(roleId);
    };

    const handleSave = async () => {
        if (!selectedDesignation || !selectedRoleId) return;
        setSaving(true);
        try {
            // Update designation to have this role
            // NOTE: This replaces all roles with the single selected role
            await updateDesignation(selectedDesignation.id, {
                roles: [selectedRoleId]
            });

            setNotification({ type: 'success', message: 'Role assigned successfully!' });

            // Update local state to reflect change
            setDesignations(prev => prev.map(d => {
                if (d.id === selectedDesignation.id) {
                    const selectedRoleObj = roles.find(r => r.id === selectedRoleId);
                    return { ...d, roles: [selectedRoleObj] };
                }
                return d;
            }));

            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Save error:', error);
            setNotification({ type: 'error', message: 'Failed to save role assignment.' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="rp-loading">Loading...</div>;

    // Filter roles into System and Custom (if any)
    const systemRoles = roles.filter(r => r.is_system);
    const customRoles = roles.filter(r => !r.is_system);

    return (
        <div className="rp-container">
            {notification && (
                <div className={`rp-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <div className="rp-header">
                <div>
                    <h1>🔐 Role Assignment</h1>
                    <p>Assign pre-built roles to job titles. Custom roles can be created for advanced needs.</p>
                </div>
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
                        {designations
                            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(desig => (
                                <div
                                    key={desig.id}
                                    className={`rp-desig-item ${selectedDesignation?.id === desig.id ? 'active' : ''}`}
                                    onClick={() => handleDesignationSelect(desig)}
                                >
                                    <div className="rp-desig-info">
                                        <h3>{desig.name}</h3>
                                        <p>{desig.employee_count || 0} employees</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Right: Role Panel */}
                <div className="rp-right-panel">
                    {selectedDesignation ? (
                        <div className="rp-role-panel">
                            <div className="panel-header">
                                <h2>{selectedDesignation.name}</h2>
                                <p>Assign a role to define what employees with this designation can do.</p>
                            </div>

                            <div className="role-section">
                                <h3>Built-in Roles</h3>
                                <div className="role-grid">
                                    {systemRoles.map(role => (
                                        <div
                                            key={role.id}
                                            className={`role-card system ${selectedRoleId === role.id ? 'selected' : ''}`}
                                            onClick={() => handleRoleSelect(role.id)}
                                        >
                                            <h4>{role.name}</h4>
                                            <p>{role.description}</p>
                                            <span className="role-badge">
                                                {role.permissions_data ? role.permissions_data.length : 0} permissions
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {customRoles.length > 0 && (
                                <div className="role-section">
                                    <h3>Custom Roles</h3>
                                    <div className="role-grid">
                                        {customRoles.map(role => (
                                            <div
                                                key={role.id}
                                                className={`role-card ${selectedRoleId === role.id ? 'selected' : ''}`}
                                                onClick={() => handleRoleSelect(role.id)}
                                            >
                                                <h4>{role.name}</h4>
                                                <p>{role.description}</p>
                                                <span className="role-badge">
                                                    {role.permissions_data ? role.permissions_data.length : 0} permissions
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="role-section">
                                <h3>Advanced Configuration</h3>
                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                                    Need more specific control? You can create a custom role or modify permissions individually.
                                </p>
                                <button className="custom-role-btn" onClick={() => alert('Custom Role Creator coming soon!')}>
                                    <Settings size={18} />
                                    Advanced Permission Editor
                                </button>
                            </div>

                            <div className="rp-actions">
                                <button
                                    className="save-button"
                                    onClick={handleSave}
                                    disabled={saving || !selectedRoleId}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rp-role-panel empty">
                            <Layers size={64} />
                            <h3>Select a Job Title</h3>
                            <p>Choose a designation from the left to assign roles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
