'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveReportsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=reports');
    }, [router]);

    return null;
}
