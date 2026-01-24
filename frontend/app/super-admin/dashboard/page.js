'use client';

import Dashboard from '@/components/SuperAdmin/SuperDashboard/SuperDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboardPage() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Basic check purely for redirection speed, real protection is in API calls
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/super-admin/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (!user.is_superuser) {
                router.push('/super-admin/login');
                return;
            }
            setAuthorized(true);
        } catch (e) {
            router.push('/super-admin/login');
        }
    }, [router]);

    if (!authorized) return null; // Or a loading spinner

    return <Dashboard />;
}
