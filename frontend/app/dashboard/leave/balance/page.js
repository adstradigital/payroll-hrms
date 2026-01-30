'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveBalancePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=balance');
    }, [router]);

    return null;
}
