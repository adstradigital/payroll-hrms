'use client';

import { useState, useEffect } from 'react';
import LeaveDashboard from '@/components/ClientAdmin/Payroll/Leave/Dashboard/LeaveDashboard';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { getMyProfile } from '@/api/api_clientadmin';

export default function LeavePage() {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getMyProfile();
            setCurrentUser(res.data.employee || res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    return (
        <Dashboard
            title="Leave Management Dashboard"
            subtitle="Overview of employee leave statistics and activities"
            breadcrumbs={['Dashboard', 'Leave', 'Dashboard']}
        >
            <ModuleGuard module="HRMS">
                <LeaveDashboard currentUser={currentUser} />
            </ModuleGuard>
        </Dashboard>
    );
}
