'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveHolidaysPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=holidays');
    }, [router]);

    return null;
}
