'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveTypesPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/leave?tab=types');
    }, [router]);

    return null;
}
