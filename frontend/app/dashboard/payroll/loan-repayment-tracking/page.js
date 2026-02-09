'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import LoanRepaymentTracking from '@/components/ClientAdmin/Payroll/LoanRepaymentTracking/LoanRepaymentTracking';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function LoanRepaymentTrackingPage() {
    return (
        <ModuleGuard requiredModule="Payroll">
            <Dashboard>
                <LoanRepaymentTracking />
            </Dashboard>
        </ModuleGuard>
    );
}
