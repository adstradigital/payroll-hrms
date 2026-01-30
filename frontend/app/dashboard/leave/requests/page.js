'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveRequestsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=requests');
    }, [router]);

    return null;
}
