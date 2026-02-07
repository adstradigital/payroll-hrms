'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Loans from '@/components/ClientAdmin/Payroll/Loans/Loans';

export default function LoansPage() {
    return (
        <Dashboard>
            <Loans />
        </Dashboard>
    );
}
