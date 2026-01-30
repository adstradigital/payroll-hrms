'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveSettingsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=settings');
    }, [router]);

    return null;
}
