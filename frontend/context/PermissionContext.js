'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        const plan = user?.subscription_plan || 'free'; // default to free or no plan

        return {
            hasHRMS: plan === 'hrms' || plan === 'both' || plan === 'enterprise',
            hasPayroll: plan === 'payroll' || plan === 'both' || plan === 'enterprise',
            isAdmin: user?.role === 'admin' || user?.role === 'owner',
            plan: plan
        };
    }, [user]);

    return (
        <PermissionContext.Provider value={permissions}>
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
