'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '@/api/axiosInstance';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [permissionCodes, setPermissionCodes] = useState([]);
    const [isAdmin, setIsAdmin] = useState(user?.role === 'admin' || user?.is_admin === true || user?.is_superuser === true);
    const [loading, setLoading] = useState(true);
    const [designation, setDesignation] = useState(null);

    // Fetch permissions from API
    const fetchPermissions = useCallback(async () => {
        // Check if user exists and we have an access token
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        if (!user || !accessToken) {
            console.log('[PermissionContext] Not authenticated (no user or token), skipping fetch');
            setLoading(false);
            return;
        }

        try {
            console.log('[PermissionContext] 📥 Fetching user permissions for:', user.email);
            const response = await axiosInstance.get('/account/employees/me/permissions/');
            const data = response.data;

            console.log('[PermissionContext] ✅ Permissions loaded:');
            console.log('  - Is Admin:', data.is_admin);
            console.log('  - Role:', data.role);
            console.log('  - Designation:', data.designation);
            console.log('  - Permission count:', data.permission_codes?.length || 0);

            setIsAdmin(data.is_admin);
            setPermissions(data.permissions || []);
            setPermissionCodes(data.permission_codes || []);
            setDesignation(data.designation);

            if (data.permissions?.length > 0) {
                console.log('[PermissionContext] 📋 User permissions:');
                data.permissions.forEach(p => {
                    console.log(`    - ${p.permission} (${p.scope}) from ${p.source_role || p.source || 'system'}`);
                });
            }
        } catch (error) {
            console.error('[PermissionContext] ❌ Failed to fetch permissions:', error);
            console.error('[PermissionContext] Error details:', error.response?.data);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch permissions when user changes
    useEffect(() => {
        if (user) {
            console.log('[PermissionContext] User updated, syncing flags:', user);
            setIsAdmin(user.role === 'admin' || user.is_admin === true || user.is_superuser === true || user.is_org_creator === true);
            fetchPermissions();
        } else {
            setPermissions([]);
            setPermissionCodes([]);
            setIsAdmin(false);
            setLoading(false);
        }
    }, [user, fetchPermissions]);

    // Check if user has a specific permission (Case Insensitive)
    const hasPermission = useCallback((permissionCode) => {
        if (!permissionCode) return true; // No restriction
        if (isAdmin) return true; // Admins bypass checks

        return permissionCodes.some(code =>
            code === permissionCode ||
            code.toLowerCase() === permissionCode.toLowerCase()
        );
    }, [isAdmin, permissionCodes]);

    // Check if user has any of the specified permissions (Case Insensitive)
    const hasAnyPermission = useCallback((codes) => {
        if (isAdmin) return true;
        return codes.some(code =>
            permissionCodes.some(pc =>
                pc === code || pc.toLowerCase() === code.toLowerCase()
            )
        );
    }, [isAdmin, permissionCodes]);

    // Check if user has all of the specified permissions
    const hasAllPermissions = useCallback((codes) => {
        if (isAdmin) return true;
        return codes.every(code => permissionCodes.includes(code));
    }, [isAdmin, permissionCodes]);

    // Get permissions for a specific module
    const getModulePermissions = useCallback((moduleCode) => {
        return permissions.filter(p => p.module_code === moduleCode);
    }, [permissions]);

    // Legacy support - subscription-based checks
    const plan = user?.subscription_plan || 'free';

    const value = {
        // New permission system
        permissions,
        permissionCodes,
        isAdmin,
        designation,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getModulePermissions,
        refetchPermissions: fetchPermissions,

        // Legacy subscription checks
        hasHRMS: plan === 'hrms' || plan === 'both' || plan === 'enterprise',
        hasPayroll: plan === 'payroll' || plan === 'both' || plan === 'enterprise',
        plan
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}

// Convenience hook for checking a single permission
export function useHasPermission(permissionCode) {
    const { hasPermission } = usePermissions();
    return hasPermission(permissionCode);
}
