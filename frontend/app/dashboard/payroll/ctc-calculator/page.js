'use client';

import React from 'react';
import CTCCalculator from '@/components/ClientAdmin/HRMS/Payroll/CTCCalculator/CTCCalculator';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';

export default function CTCCalculatorPage() {
    return (
        <Dashboard
            title="CTC Calculator"
            subtitle="Calculate Cost to Company and Take-home Salary breakdown"
            breadcrumbs={['Dashboard', 'Payroll', 'CTC Calculator']}
        >
            <ModuleGuard module="Payroll">
                <CTCCalculator />
            </ModuleGuard>
        </Dashboard>
    );
}
